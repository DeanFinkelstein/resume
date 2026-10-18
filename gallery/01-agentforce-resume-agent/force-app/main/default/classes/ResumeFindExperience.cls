/**
 * Agent action: finds the pieces of Dean Finkelstein's experience that match a keyword or a short phrase,
 * ranked by how many of the words they contain. Engagements are described by function, never by client name.
 */
public with sharing class ResumeFindExperience {
    private static final Integer MAX_RESULTS = 5;
    private static final Set<String> STOP_WORDS = new Set<String>{
        'the', 'and', 'for', 'with', 'what', 'has', 'have', 'did', 'does', 'any', 'his', 'him', 'dean', 'work', 'done', 'experience'
    };

    public class Request {
        @InvocableVariable(
            label='Keyword'
            description='A skill, product, or topic to look for, for example Field Service, integration, dashboards, or AI.'
            required=true
        )
        public String keyword;

        @InvocableVariable(
            label='Register'
            description='Technical or Plain. Defaults to Plain.'
        )
        public String register;
    }

    public class Response {
        @InvocableVariable(label='Matches' description='Matching engagements with role, period, summary, and source tag. Empty text when nothing matched.')
        public String matches;

        @InvocableVariable(label='Match Count' description='How many engagements matched.')
        public Integer matchCount;
    }

    @InvocableMethod(
        label='Find Experience by Keyword'
        description='Searches Dean Finkelstein\'s engagements for a skill or topic and returns up to five matches with their source tags. Use it for questions like what has he done with Field Service, or any integration work.'
    )
    public static List<Response> find(List<Request> requests) {
        List<Resume_Engagement__c> all = [
            SELECT Name, Employer__c, Role__c, Period__c, Summary_Technical__c, Summary_Plain__c, Skill_Tags__c, Source_Tag__c
            FROM Resume_Engagement__c
            WITH USER_MODE
            ORDER BY Sort_Order__c ASC NULLS LAST
            LIMIT 200
        ];
        List<Response> out = new List<Response>();
        for (Request r : requests) {
            out.add(search(all, r));
        }
        return out;
    }

    private static Response search(List<Resume_Engagement__c> all, Request r) {
        Boolean tech = r != null && String.isNotBlank(r.register) && r.register.trim().toLowerCase().startsWith('tech');
        List<String> words = new List<String>();
        String raw = (r == null || r.keyword == null) ? '' : r.keyword.toLowerCase();
        for (String w : raw.split('[^a-z0-9]+')) {
            // Short words match inside longer ones ("he" in "the"), so keep three letters and up, plus AI.
            if ((w.length() >= 3 || w == 'ai') && !STOP_WORDS.contains(w)) {
                words.add(w);
            }
        }

        List<Scored> scored = new List<Scored>();
        Integer best = 0;
        for (Resume_Engagement__c e : all) {
            List<String> fields = new List<String>();
            for (String f : new List<String>{ e.Name, e.Skill_Tags__c, e.Role__c, e.Employer__c, e.Summary_Technical__c, e.Summary_Plain__c }) {
                if (f != null) {
                    fields.add(f);
                }
            }
            String hay = String.join(fields, ' ').toLowerCase();
            Set<String> tokens = new Set<String>(hay.split('[^a-z0-9]+'));
            Integer score = 0;
            for (String w : words) {
                // Whole-word match always counts. Longer words may also match inside a word (integration, integrations).
                // Short words like "ai" only match whole words, so they cannot hit "maintain" or "email".
                if (tokens.contains(w) || (w.length() >= 5 && hay.contains(w))) {
                    score++;
                }
            }
            if (score > 0) {
                scored.add(new Scored(e, score));
                best = Math.max(best, score);
            }
        }
        scored.sort();
        // Keep only the strongest matches: a two-word hit beats every one-word hit.
        List<Scored> top = new List<Scored>();
        for (Scored s : scored) {
            if (s.score == best) {
                top.add(s);
            }
        }
        scored = top;

        Response resp = new Response();
        List<String> lines = new List<String>();
        for (Integer i = 0; i < scored.size() && i < MAX_RESULTS; i++) {
            Resume_Engagement__c e = scored[i].record;
            String summary = tech ? e.Summary_Technical__c : e.Summary_Plain__c;
            lines.add('- ' + e.Name + ' (' + e.Employer__c + ', ' + e.Period__c + '): ' + summary
                + (String.isBlank(e.Source_Tag__c) ? '' : ' [source: ' + e.Source_Tag__c + ']'));
        }
        resp.matchCount = Math.min(scored.size(), MAX_RESULTS);
        resp.matches = String.join(lines, '\n');
        return resp;
    }

    private class Scored implements Comparable {
        Resume_Engagement__c record;
        Integer score;
        Scored(Resume_Engagement__c record, Integer score) {
            this.record = record;
            this.score = score;
        }
        public Integer compareTo(Object other) {
            return ((Scored) other).score - this.score; // higher score first
        }
    }
}
