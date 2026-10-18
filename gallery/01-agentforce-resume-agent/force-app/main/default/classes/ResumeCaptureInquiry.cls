/**
 * Agent action: records a visitor's question as a Lead so Dean can follow up in person.
 * Validates the email, never overwrites anything, and tells the agent exactly what was recorded.
 */
public with sharing class ResumeCaptureInquiry {
    private static final Pattern EMAIL_PATTERN = Pattern.compile('^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$');

    public class Request {
        @InvocableVariable(label='Name' description='The visitor\'s full name.' required=true)
        public String name;

        @InvocableVariable(label='Email' description='The visitor\'s email address, for Dean\'s reply.' required=true)
        public String email;

        @InvocableVariable(label='Company' description='The visitor\'s company, if they gave one.')
        public String company;

        @InvocableVariable(label='Question' description='What the visitor wants to ask or discuss with Dean.' required=true)
        public String question;
    }

    public class Response {
        @InvocableVariable(label='Success' description='True when the inquiry was recorded.')
        public Boolean success;

        @InvocableVariable(label='Confirmation' description='What was recorded, or why it was not, in one or two sentences to relay to the visitor.')
        public String confirmation;
    }

    @InvocableMethod(
        label='Capture Inquiry'
        description='Records a visitor\'s name, email, company, and question so Dean Finkelstein can reply in person. Use it when the visitor wants to contact Dean, or asks something the resume does not cover. Confirm the details with the visitor before calling it.'
    )
    public static List<Response> capture(List<Request> requests) {
        List<Response> out = new List<Response>();
        for (Request r : requests) {
            out.add(captureOne(r));
        }
        return out;
    }

    private static Response captureOne(Request r) {
        Response resp = new Response();
        String name = r == null || r.name == null ? '' : r.name.normalizeSpace();
        String email = r == null || r.email == null ? '' : r.email.trim();
        String question = r == null || r.question == null ? '' : r.question.trim();
        if (String.isBlank(name) || String.isBlank(question)) {
            resp.success = false;
            resp.confirmation = 'I need a name and a question before I can pass this to Dean.';
            return resp;
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            resp.success = false;
            resp.confirmation = 'That email address does not look right. Could you check it?';
            return resp;
        }

        List<String> nameParts = name.split(' ');
        String lastName = nameParts.remove(nameParts.size() - 1);
        Lead lead = new Lead(
            FirstName = nameParts.isEmpty() ? null : String.join(nameParts, ' ').left(40),
            LastName = lastName.left(80),
            Email = email,
            Company = String.isBlank(r.company) ? 'Not provided' : r.company.trim().left(255),
            LeadSource = 'Web',
            Description = 'Captured by the Agentforce resume agent on ' + Date.today().format() + '.',
            Inquiry_Question__c = question.left(4000)
        );
        // A visitor who writes twice is still a visitor with a question. Let the duplicate rule flag the match
        // for Dean instead of blocking the save. Found in agent test run 3: the second message from the same
        // email failed with DUPLICATES_DETECTED.
        Database.DMLOptions opts = new Database.DMLOptions();
        opts.DuplicateRuleHeader.allowSave = true;
        Database.SaveResult sr = Database.insert(lead, opts, AccessLevel.USER_MODE);
        if (sr.isSuccess()) {
            resp.success = true;
            resp.confirmation = 'Recorded for Dean: ' + name + ' (' + email + ')'
                + (String.isBlank(r.company) ? '' : ', ' + r.company.trim()) + ', asking: "' + question.left(200) + '". He will reply by email.';
        } else {
            resp.success = false;
            resp.confirmation = 'I could not record that just now. Please email Dean at finkelstein.dean@gmail.com.';
        }
        return resp;
    }
}
