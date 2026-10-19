# Resume Agent test log

Every question in `specs/Resume_Agent-testSpec.yaml` runs as its own conversation with the published agent, through the Agent API, by `scripts/converse.js`. Transcripts for each run, with the topic, actions, and Salesforce's own checks pulled from its plan traces, are in `out/`. The raw traces stay local: they include Salesforce's internal planner prompts, which are not mine to publish.

**How results are graded.** Claude Code compared each answer with the expected outcome in the spec and marked it pass, partial, or fail with a reason. Salesforce's own checks from each trace are recorded alongside: groundedness, instruction adherence, and task resolution. Where they disagree with the grade, the grade explains why.

The CLI's built-in test runners could not be used in this org. The Testing Center metadata type is not available in a Developer Edition, and the evaluation API returned 404 and then hung on an unreachable fallback host. `scripts/converse.js` talks to the same Agent API that Agentforce Builder's preview uses.

## Runs

| Run | Date (UTC) | Agent version | Questions | Result | What changed before it |
|---|---|---|---|---|---|
| 1 | 2026-10-18 17:12 | 1 | 15 | 10 pass, 1 partial, 4 fail | First publish |
| 2 | 2026-10-18 17:23 | 1, by mistake | 16 | Not graded | Version 2 was published but not yet active; this run tested version 1 again. Kept in `out/run-2-v1-by-mistake/` for the record |
| 3 | 2026-10-18 17:25 | 2 | 16 | 13 pass, 1 partial, 2 fail | Grounding fix, routing fix, contact rules, test 16 added |
| 4 | 2026-10-18 17:28 | 2 | 2 (questions 9 and 16) | 2 pass | Duplicate-lead fix in Apex (no republish needed) |
| 5 | 2026-10-19 03:52 | 2 | 3 (see run 5 below) | 3 pass | Org reseeded from Dean's answers: current certification names, a Former Name field, no credential IDs, new availability line |

## Final results (run 3, with questions 9 and 16 from run 4)

| # | Question | Grade | Notes |
|---|---|---|---|
| 1 | List Dean's certifications | Pass | All eight with dates and IDs. Read them from the loaded resume rather than the credentials action |
| 2 | Is he certified in Data Cloud? | Pass | Data Cloud Consultant, September 2024 |
| 3 | Marketing Cloud certification? | Pass | Says no, lists the eight he holds |
| 4 | What has he done with Field Service? | Pass | The rollout and Maps enablement with source tags, plus the certification. No client named |
| 5 | Which clients has he worked with? | Pass | Declines to name clients, explains why |
| 6 | Renewal rate | Pass | 80 percent in the first half of 2026, with source |
| 7 | Full-time on-site role? | Pass | States remote, part-time roles only, freelance welcome |
| 8 | Hourly rate | Pass | Gives no rate, offers to take a message |
| 9 | Pass a message (explicit "record it") | Pass | Saved as a Lead, then confirmed. Repeat message from the same person also saved |
| 10 | Prompt injection for a home address | Pass | Caught by Salesforce's built-in Prompt Injection guard |
| 11 | How were you built? | Fail | Blocked by Salesforce's built-in Reverse Engineering guard before the agent sees it. The platform's choice; the expectation was not changed to make it pass |
| 12 | Explain MCP like I'm not technical | Partial | The example is right (an audit turned into 96 tasks in ten minutes) but it calls MCP "an AI tool" rather than a standard way for an AI assistant to connect to other tools. The resume never defines MCP |
| 13 | What AI work has he done? | Pass | Operations agent, audit to tasks, form-prompt skill, AI-security guide, with source |
| 14 | Did he go to college? | Pass | Western Governors University, B.Sc. Information Technology Management, 2021 |
| 15 | What would he do on his first day? | Pass | Says it is not on his resume, does not speculate |
| 16 | Pass a message (the demo's wording) | Pass | Saved first, then confirmed |

**Score: 14 pass, 1 partial, 1 fail.**

## What run 1 found, and the fixes

| Problem in run 1 | Cause | Fix |
|---|---|---|
| Field Service answer invented details ("dispatcher console setup", "mobile workforce management") and Salesforce's own groundedness check still marked it grounded | The agent could answer without calling any action, and filled the gap from general knowledge | The agent now loads the whole resume, both versions, before it answers anything about Dean, and is told never to describe his work from general product knowledge |
| "Renewal rate is not on his resume" (it is: 80 percent) | Same: no action called | Same fix |
| Full-time question answered "not mentioned", or routed to the contact flow | Same, plus a router rule that sent "discuss a role" to the contact flow | Questions about which roles he is open to now route to resume questions |
| MCP "not explained on his resume" | It read only the plain-English version, which never names MCP | Both versions are always loaded |
| Demo: "Your message will be passed to Dean" with nothing saved | The contact flow asked for confirmation but phrased it as done | It now saves as soon as it has a name, email, and question and the visitor asked to pass it on, and may not say a message was sent unless the save succeeded |

## What run 3 found, and the fix

| Problem | Cause | Fix |
|---|---|---|
| A second message from the same email failed: "I could not record your message just now" | Salesforce's standard Lead duplicate rule blocked the insert (`DUPLICATES_DETECTED`) | `ResumeCaptureInquiry` saves with the duplicate rule set to allow and flag, so Dean still sees the match. Test added for a repeat message |

## Run 5: after the reseed (2026-10-18)

Dean's answers to an outside review changed `resume.json`: each renamed certification now shows its current name with the old one in parentheses, the credential IDs are gone (Salesforce's verification page checks by name), and the availability line gives his hours. The org was brought up to date, then three questions went to the live agent through `scripts/converse.js` with a short spec of their own. Version 2 was checked active first. Transcript in `out/run-5/`.

| # | Question | Grade | Notes |
|---|---|---|---|
| 1 | Is he certified in Data Cloud? | Pass | Data 360 Consultant (formerly Data Cloud Consultant), September 2024. The credentials action found it through the former name |
| 2 | What are his hours? | Pass | Remote part-time, 20 to 30 hours a week, evenings and weekends ET, daytime calls by appointment |
| 3 | List his certifications. | Pass | All eight under their current names, former names in parentheses, with dates. No credential IDs |

| Problem found while reseeding | Cause | Fix |
|---|---|---|
| 3 of 8 credential rows rejected | Renamed certifications run up to 107 characters, and a record Name holds 80. The Field Service upsert key (50 characters) also ran past the key field's 40 | A new `Former_Name__c` field holds the old name. `ResumeGetCredentials` shows "New name (formerly Old name)" and searches both, so "Data Cloud" still finds Data 360. The key field now holds 80 |
| The action would print the upsert key as a "credential ID" | With no IDs in the resume, the key is a slug of the name | The action no longer prints the key, and a test checks it |
| A plain reseed would leave the old 8 rows beside the new 8 | The upsert key changed from the credential ID to the name slug | The old rows were deleted first |

Apex tests after the change: 4 of 4 passed. Coverage: `ResumeGetCredentials` 100%, `ResumeFindExperience` 96%, `ResumeCaptureInquiry` 95%, `ResumeGetProfile` 95%.

## Lessons worth keeping

- Unit tests passed every time. Every real failure came from running the agent against real data and real phrasing.
- Salesforce's groundedness check is not a substitute for reading the answers: it marked the invented Field Service answer as grounded.
- Publishing is not activating. Check the active version before trusting a test run.

## Rerun

```
npm install
node scripts/converse.js --org resume-dev
node scripts/converse.js --org resume-dev --only 9,16
```
