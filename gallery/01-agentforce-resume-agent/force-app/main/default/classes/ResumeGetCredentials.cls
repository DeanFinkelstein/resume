/**
 * Agent action: lists Dean Finkelstein's certifications, optionally filtered by name.
 * When a filter matches nothing it says so and returns the full list, so the agent never has to guess.
 */
public with sharing class ResumeGetCredentials {
    private static final Set<String> STOP_WORDS = new Set<String>{
        'salesforce', 'certified', 'certification', 'certifications', 'cert', 'certs', 'consultant',
        'is', 'he', 'in', 'a', 'an', 'the', 'of', 'any', 'his', 'does', 'have', 'has'
    };

    public class Request {
        @InvocableVariable(
            label='Name Filter'
            description='Optional words to filter by, for example Data Cloud or AI. Leave blank for all certifications.'
        )
        public String nameFilter;
    }

    public class Response {
        @InvocableVariable(label='Credentials' description='Matching certifications with issue date and credential ID, one per line.')
        public String credentials;

        @InvocableVariable(label='Count' description='How many certifications are listed.')
        public Integer count;

        @InvocableVariable(label='Filter Matched' description='False when a filter was given and nothing matched; the full list is returned instead.')
        public Boolean filterMatched;
    }

    @InvocableMethod(
        label='Get Credentials'
        description='Returns Dean Finkelstein\'s Salesforce certifications and other credentials with issue dates and credential IDs. Use it for any question about certifications.'
    )
    public static List<Response> getCredentials(List<Request> requests) {
        List<Resume_Credential__c> all = [
            SELECT Name, Issuer__c, Date_Earned__c, Credential_Id__c
            FROM Resume_Credential__c
            WITH USER_MODE
            ORDER BY Sort_Order__c ASC NULLS LAST
            LIMIT 200
        ];
        List<Response> out = new List<Response>();
        for (Request r : requests) {
            List<String> words = new List<String>();
            String raw = (r == null || r.nameFilter == null) ? '' : r.nameFilter.toLowerCase();
            for (String w : raw.split('[^a-z0-9]+')) {
                if (w.length() >= 2 && !STOP_WORDS.contains(w)) {
                    words.add(w);
                }
            }
            List<Resume_Credential__c> hits = new List<Resume_Credential__c>();
            if (!words.isEmpty()) {
                for (Resume_Credential__c c : all) {
                    String name = c.Name.toLowerCase();
                    Boolean every = true;
                    for (String w : words) {
                        if (!name.contains(w)) {
                            every = false;
                            break;
                        }
                    }
                    if (every) {
                        hits.add(c);
                    }
                }
            }
            Response resp = new Response();
            resp.filterMatched = words.isEmpty() || !hits.isEmpty();
            List<Resume_Credential__c> shown = (words.isEmpty() || hits.isEmpty()) ? all : hits;
            List<String> lines = new List<String>();
            for (Resume_Credential__c c : shown) {
                lines.add('- ' + c.Name + ', ' + c.Issuer__c + ', ' + c.Date_Earned__c
                    + (String.isBlank(c.Credential_Id__c) ? '' : ', credential ID ' + c.Credential_Id__c));
            }
            resp.count = shown.size();
            resp.credentials = String.join(lines, '\n');
            out.add(resp);
        }
        return out;
    }
}
