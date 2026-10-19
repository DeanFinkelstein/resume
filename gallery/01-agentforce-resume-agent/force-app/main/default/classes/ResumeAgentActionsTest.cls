@IsTest
private class ResumeAgentActionsTest {
    private static final String TEST_USER_LAST_NAME = 'ResumeAgentTestUser';

    // The actions run in user mode, so the tests run as a standard user who holds only the agent's permission set.
    @TestSetup
    static void seed() {
        System.runAs(new User(Id = UserInfo.getUserId())) {
            Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
            User u = new User(
                Alias = 'rsmagt', Email = 'resume.agent.test@example.com', EmailEncodingKey = 'UTF-8',
                LastName = TEST_USER_LAST_NAME, LanguageLocaleKey = 'en_US', LocaleSidKey = 'en_US',
                ProfileId = p.Id, TimeZoneSidKey = 'America/New_York',
                Username = 'resume.agent.test.' + System.currentTimeMillis() + '@example.com'
            );
            insert u;
            PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'Resume_Agent_Access' LIMIT 1];
            insert new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = ps.Id);
        }
        insert new List<Resume_Section__c>{
            new Resume_Section__c(Name = 'Summary', Section_Key__c = 'summary', Sort_Order__c = 1,
                Body_Technical__c = 'Salesforce Managed Services Team Lead.', Body_Plain__c = 'Leads a support team.'),
            new Resume_Section__c(Name = 'Certifications', Section_Key__c = 'certifications', Sort_Order__c = 2,
                Body_Technical__c = 'Eight Salesforce certifications.', Body_Plain__c = null)
        };
        insert new List<Resume_Credential__c>{
            new Resume_Credential__c(Name = 'Salesforce Certified Data 360 Consultant', Former_Name__c = 'Data Cloud Consultant', Issuer__c = 'Salesforce', Date_Earned__c = 'Sep 2024', Credential_Id__c = 'data-360-consultant', Sort_Order__c = 1),
            new Resume_Credential__c(Name = 'Salesforce Certified Agentforce Specialist', Former_Name__c = 'AI Specialist', Issuer__c = 'Salesforce', Date_Earned__c = 'Oct 2024', Credential_Id__c = 'agentforce-specialist', Sort_Order__c = 2),
            new Resume_Credential__c(Name = 'Salesforce Certified Experience Cloud Consultant', Issuer__c = 'Salesforce', Date_Earned__c = 'Aug 2023', Credential_Id__c = 'experience-cloud-consultant', Sort_Order__c = 3)
        };
        insert new List<Resume_Engagement__c>{
            new Resume_Engagement__c(Name = 'Field Service rollout', Key__c = 'fsm', Employer__c = 'Cirrius Solutions Inc.', Period__c = '2026',
                Skill_Tags__c = 'Field Service, Salesforce Maps', Summary_Technical__c = 'Led the FSM rollout.', Summary_Plain__c = 'Set up technician scheduling.',
                Source_Tag__c = 'Leadership email, Mar 2026', Sort_Order__c = 1),
            new Resume_Engagement__c(Name = 'Carrier API diagnosis', Key__c = 'carrier', Employer__c = 'Cirrius Solutions Inc.', Period__c = '2026',
                Skill_Tags__c = 'Integration, API', Summary_Technical__c = 'Verified a carrier API diagnosis read-only.', Summary_Plain__c = 'Checked a failing connection.',
                Source_Tag__c = 'Client CEO email, Oct 2026', Sort_Order__c = 2)
        };
    }

    @IsTest
    static void profileReturnsSectionsInTheRequestedRegister() {
        ResumeGetProfile.Request tech = new ResumeGetProfile.Request();
        tech.register = 'Technical';
        ResumeGetProfile.Request plain = new ResumeGetProfile.Request();
        ResumeGetProfile.Request both = new ResumeGetProfile.Request();
        both.register = 'Both';
        List<ResumeGetProfile.Response> res;
        System.runAs(agentUser()) {
            Test.startTest();
            res = ResumeGetProfile.getProfile(new List<ResumeGetProfile.Request>{ tech, plain, both });
            Test.stopTest();
        }
        Assert.isTrue(res[2].profileText.contains('=== TECHNICAL VERSION ==='), 'both returns the technical version');
        Assert.isTrue(res[2].profileText.contains('Leads a support team'), 'both returns the plain version');
        Assert.isTrue(res[2].profileText.contains('Managed Services Team Lead'), 'both includes technical wording');
        Assert.isTrue(res[0].profileText.contains('Managed Services Team Lead'), 'technical body expected');
        Assert.isTrue(res[1].profileText.contains('Leads a support team'), 'plain body expected');
        Assert.isTrue(res[1].profileText.contains('Eight Salesforce certifications'), 'falls back to technical when plain is blank');
        Assert.isTrue(res[0].profileText.indexOf('## Summary') < res[0].profileText.indexOf('## Certifications'), 'sections keep their order');
    }

    @IsTest
    static void findExperienceRanksAndReportsNoMatch() {
        ResumeFindExperience.Request hit = new ResumeFindExperience.Request();
        hit.keyword = 'What has he done with Field Service?';
        ResumeFindExperience.Request miss = new ResumeFindExperience.Request();
        miss.keyword = 'quantum';
        ResumeFindExperience.Request shortWord = new ResumeFindExperience.Request();
        shortWord.keyword = 'AI'; // must not match inside "Maps", "failing", or "API"
        List<ResumeFindExperience.Response> res;
        System.runAs(agentUser()) {
            Test.startTest();
            res = ResumeFindExperience.find(new List<ResumeFindExperience.Request>{ hit, miss, shortWord });
            Test.stopTest();
        }
        Assert.areEqual(1, res[0].matchCount);
        Assert.isTrue(res[0].matches.contains('Field Service rollout'));
        Assert.isTrue(res[0].matches.contains('[source: Leadership email, Mar 2026]'));
        Assert.areEqual(0, res[1].matchCount);
        Assert.areEqual('', res[1].matches);
        Assert.areEqual(0, res[2].matchCount, 'a short keyword matches whole words only');
    }

    @IsTest
    static void credentialsFilterAndFallBackToFullList() {
        ResumeGetCredentials.Request dataCloud = new ResumeGetCredentials.Request();
        dataCloud.nameFilter = 'Is he certified in Data Cloud?';
        ResumeGetCredentials.Request none = new ResumeGetCredentials.Request();
        none.nameFilter = 'Marketing Cloud';
        ResumeGetCredentials.Request all = new ResumeGetCredentials.Request();
        List<ResumeGetCredentials.Response> res;
        System.runAs(agentUser()) {
            Test.startTest();
            res = ResumeGetCredentials.getCredentials(new List<ResumeGetCredentials.Request>{ dataCloud, none, all });
            Test.stopTest();
        }
        Assert.areEqual(1, res[0].count, 'the former name finds the renamed certification, and Experience Cloud does not match');
        Assert.isTrue(res[0].credentials.contains('Data 360 Consultant (formerly Data Cloud Consultant), Salesforce, Sep 2024'));
        Assert.isFalse(res[1].filterMatched, 'no Marketing Cloud certification exists');
        Assert.areEqual(3, res[1].count, 'full list returned when the filter matches nothing');
        Assert.areEqual(3, res[2].count);
        Assert.isTrue(res[2].filterMatched);
        Assert.isTrue(res[2].credentials.contains('- Salesforce Certified Experience Cloud Consultant, Salesforce, Aug 2023'), 'no former name, no parentheses');
        Assert.isFalse(res[2].credentials.contains('agentforce-specialist'), 'the upsert key is not shown');
    }

    @IsTest
    static void inquiryCreatesALeadAndRejectsBadInput() {
        ResumeCaptureInquiry.Request good = new ResumeCaptureInquiry.Request();
        good.name = 'Jane Q Doe';
        good.email = 'jane@example.com';
        good.company = 'Example Co';
        good.question = 'Open to a part-time Agentforce role?';
        ResumeCaptureInquiry.Request badEmail = new ResumeCaptureInquiry.Request();
        badEmail.name = 'Sam Roe';
        badEmail.email = 'not-an-email';
        badEmail.question = 'Hello';
        ResumeCaptureInquiry.Request noQuestion = new ResumeCaptureInquiry.Request();
        noQuestion.name = 'Pat Poe';
        noQuestion.email = 'pat@example.com';
        ResumeCaptureInquiry.Request again = new ResumeCaptureInquiry.Request(); // same person writes twice
        again.name = 'Jane Q Doe';
        again.email = 'jane@example.com';
        again.company = 'Example Co';
        again.question = 'Following up on my earlier message.';
        List<ResumeCaptureInquiry.Response> res;
        System.runAs(agentUser()) {
            Test.startTest();
            res = ResumeCaptureInquiry.capture(new List<ResumeCaptureInquiry.Request>{ good, badEmail, noQuestion, again });
            Test.stopTest();
        }
        Assert.isTrue(res[0].success, res[0].confirmation);
        Assert.isFalse(res[1].success);
        Assert.isFalse(res[2].success);
        Assert.isTrue(res[3].success, 'a second message from the same email is still recorded: ' + res[3].confirmation);
        Lead l = [SELECT FirstName, LastName, Company, Email, Inquiry_Question__c FROM Lead WHERE Email = 'jane@example.com' ORDER BY CreatedDate ASC, Id ASC LIMIT 1];
        Assert.areEqual('Jane Q', l.FirstName);
        Assert.areEqual('Doe', l.LastName);
        Assert.areEqual('Example Co', l.Company);
        Assert.areEqual('Open to a part-time Agentforce role?', l.Inquiry_Question__c);
        Assert.areEqual(2, [SELECT COUNT() FROM Lead WHERE Email IN ('jane@example.com', 'not-an-email', 'pat@example.com')], 'two from Jane, none from the invalid requests');
    }

    private static User agentUser() {
        return [SELECT Id FROM User WHERE LastName = :TEST_USER_LAST_NAME LIMIT 1];
    }
}
