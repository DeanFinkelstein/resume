# Agentforce resume agent

[Dean Finkelstein's resume](https://deanfinkelstein.github.io/resume/) · [View the code on GitHub](https://github.com/DeanFinkelstein/resume/tree/main/gallery/01-agentforce-resume-agent)

<video src="demo.mp4" poster="demo-poster.jpg" controls muted playsinline width="634"></video>

[Watch the demo](demo.mp4) (75 seconds, silent, in the Agentforce Builder preview): the agent confirms a certification from the data in the org, declines to name clients, gives the availability line, and saves a test message for Dean as a Lead.

**What it does.** An Agentforce service agent that answers questions about Dean from data in a Salesforce org, refuses what it cannot ground, never names a client, and takes a message for Dean as a Lead when the answer is not on his resume. It is the Salesforce-stack twin of the Claude-based assistant on the resume page.

**Why it exists.** Dean's next step is leading client-facing Agentforce work. This is a complete agent built the way he would build one for a client: a data model, grounded actions with tests, an Agent Script definition in source control, guardrails written down, and a test plan written before the agent ran.

## What is in this folder

| Path | What it is |
|---|---|
| `force-app/main/default/objects/` | Three custom objects (Resume Section, Resume Credential, Resume Engagement) and one Lead field (Inquiry Question) |
| `force-app/main/default/classes/` | Four Apex actions (`ResumeGetProfile`, `ResumeFindExperience`, `ResumeGetCredentials`, `ResumeCaptureInquiry`) and their tests |
| `force-app/main/default/permissionsets/` | `Resume_Agent_Access` (read-only, for the agent user) and `Resume_Data_Admin` (for loading data) |
| `force-app/main/default/aiAuthoringBundles/Resume_Agent/` | The agent in Agent Script: router, resume questions, contact Dean, off topic. The agent user is a placeholder |
| `scripts/seed.js` | Loads sections, credentials, and engagements from `resume.json` (the same file the resume page is built from), upserting on external IDs |
| `scripts/publish.js` | Validates, publishes, and activates the agent, filling in the agent user only for the publish |
| `specs/Resume_Agent-testSpec.yaml` | Sixteen-case test plan in the Salesforce CLI test spec format |
| `scripts/converse.js` | Runs each test case as its own conversation through the Agent API and saves transcripts plus a summary of Salesforce's plan trace (raw traces stay local) |
| `TEST-LOG.md` and `out/` | Four test runs: what failed, why, what changed, and the transcripts |
| `demo.mp4` and `demo-poster.jpg` | The 75-second recording above, and its poster frame |
| `DESIGN.md` | The design written before the build, with an "As built" section at the top that lists where the build differs and why |

## Build log (2026-10-17, Agentforce Developer Edition org)

| Step | Result |
|---|---|
| Deploy objects, fields, Apex, permission sets | 29 of 29 components deployed |
| Apex tests (run as a standard user holding only the agent's permission set) | 4 of 4 passed. Coverage: `ResumeGetProfile` 100%, `ResumeGetCredentials` 100%, `ResumeFindExperience` 96%, `ResumeCaptureInquiry` 92% |
| Load data from `resume.json` | 12 sections, 8 credentials, 13 engagements; a second run left the counts unchanged |
| Actions against the real data (read-only anonymous Apex) | "Data Cloud" returns the one matching certification. "Marketing Cloud" reports no match and returns all eight. "Field Service" returns the one rollout. "AI" returns the two AI engagements. The profile returns 12 sections |
| Deploy the Agent Script bundle as metadata | Accepted by the org as a draft |
| Publish and activate | Done in Agentforce Builder, which compiles in the org. The CLI's compile endpoint returns 404 for this org. Builder flagged two integer outputs that needed an object type; fixed |
| Agent test plan, 4 runs (see [TEST-LOG.md](TEST-LOG.md)) | Run 1: 10 of 15. Final: 14 pass, 1 partial, 1 fail (Salesforce's built-in reverse-engineering guard) |

## Two bugs the real data caught

The first run of the actions against the loaded data found what the unit tests did not:

- A search for "Field Service" returned five results, because "service" also matched "Managed Services." The search now keeps only the strongest matches.
- A search for "AI" put an unrelated engagement first, because "ai" matched inside ordinary words. Short keywords now match whole words only, and a test pins it.

That is the reason the build log runs the actions on real data, not just the tests.

## What the test runs caught

Run 1 against the published agent passed 10 of 15. The agent sometimes answered without reading the resume. Once it invented Field Service details, and Salesforce's own groundedness check still marked that answer grounded. A demo recording also caught the agent saying a message "will be passed" without saving it. The fixes: load the whole resume before every answer, route availability questions correctly, never claim a message was sent unless it was saved, and save repeat messages despite the duplicate rule. The full story, with transcripts, is in [TEST-LOG.md](TEST-LOG.md).

## Publish again after a change (in the org)

1. Deploy the bundle, then reload Agentforce Builder.
2. **Publish**, then **Activate**, then check the active version: `SELECT VersionNumber, Status FROM BotVersion WHERE BotDefinition.DeveloperName = 'Resume_Agent'`.
3. Run the conversations: `node scripts/converse.js --org resume-dev`.

## What I would change next time

- Ground on Knowledge or Data Cloud retrieval instead of a custom object once the org has it. The custom object keeps the demo inside a free Developer Edition.
- Add a second guardrail layer in Apex: reject any action output that contains a name from a client blocklist, so confidentiality does not rest on the prompt alone.

Source tag for the resume card: built in a Developer Edition org; metadata, Apex, tests, seed script, and test plan in this folder.
