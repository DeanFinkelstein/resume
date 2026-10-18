/**
 * Agent action: returns Dean Finkelstein's resume, section by section, in the requested register.
 * This is the agent's grounding when the org has no Knowledge: every answer about Dean starts here.
 */
public with sharing class ResumeGetProfile {
    public class Request {
        @InvocableVariable(
            label='Register'
            description='Technical for readers who know Salesforce, Plain for everyone else, Both for the full grounding text. Defaults to Plain.'
        )
        public String register;
    }

    public class Response {
        @InvocableVariable(
            label='Profile Text'
            description='The resume, section by section, in the requested register. The only source for answers about Dean.'
        )
        public String profileText;
    }

    @InvocableMethod(
        label='Get Resume Profile'
        description='Returns Dean Finkelstein\'s resume text: summary, results, skills, AI work, experience, certifications, education, availability, and how this agent was built. Call it before answering any question about Dean.'
    )
    public static List<Response> getProfile(List<Request> requests) {
        List<Resume_Section__c> sections = [
            SELECT Name, Body_Technical__c, Body_Plain__c
            FROM Resume_Section__c
            WITH USER_MODE
            ORDER BY Sort_Order__c ASC NULLS LAST
            LIMIT 50
        ];
        List<Response> out = new List<Response>();
        for (Request r : requests) {
            String reg = (r == null || String.isBlank(r.register)) ? 'plain' : r.register.trim().toLowerCase();
            Response resp = new Response();
            if (sections.isEmpty()) {
                resp.profileText = 'No resume sections are loaded in this org.';
            } else if (reg.startsWith('both')) {
                // Both versions: the Technical one names every product and tool, the Plain one says it simply.
                resp.profileText = '=== TECHNICAL VERSION ===\n' + render(sections, true)
                    + '\n\n=== PLAIN ENGLISH VERSION ===\n' + render(sections, false);
            } else {
                resp.profileText = render(sections, reg.startsWith('tech'));
            }
            out.add(resp);
        }
        return out;
    }

    private static String render(List<Resume_Section__c> sections, Boolean tech) {
        List<String> parts = new List<String>();
        for (Resume_Section__c s : sections) {
            String body = tech ? s.Body_Technical__c : s.Body_Plain__c;
            if (String.isBlank(body)) {
                body = tech ? s.Body_Plain__c : s.Body_Technical__c;
            }
            parts.add('## ' + s.Name + '\n' + (body == null ? '' : body));
        }
        return String.join(parts, '\n\n');
    }
}
