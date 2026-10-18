# Artifact gallery

Fresh builds that show how Dean Finkelstein uses AI tooling in Salesforce work. Everything here was built from scratch in an Agentforce Developer Edition org and this folder. Nothing is copied from client work, and no client is named anywhere.

Each artifact has the same shape: a README that says what it does, what goes in, what comes out, how long it took, and what Dean would change next time; the code or skill files; and proof from a real run. Every claim carries a source, the same rule as the resume.

## The artifacts

| # | Artifact | What it proves | Status (2026-10-18) |
|---|---|---|---|
| 1 | [Agentforce resume agent](01-agentforce-resume-agent/) | Can design, ground, build, and test an Agentforce agent end to end, with the agent itself in source control | Published and active. 16-question test plan run against the live agent four times: 10 of 15 on the first run, 14 pass, 1 partial, 1 platform-blocked on the last. See its TEST-LOG |
| 2 | [Org audit to tasks](02-org-audit-to-tasks/) | The audit-to-tasks workflow rebuilt in public: scan, findings, prioritized tasks, created through MCP after approval | Ran: 36 findings in 41 seconds, shaped into 7 tasks. Task creation pending the choice of ClickUp or GitHub |
| 3 | [Pre-refresh risk scan](03-pre-refresh-risk-scan/) | Judgment about risk: everything a sandbox refresh would wipe or break, with owners | Ran: 16 checks in 67 seconds, redacted checklist in `out/` |
| 4 | [Adopting AI safely in a Salesforce shop](04-adopting-ai-safely/) | Can explain OAuth, data retention, licensing, and the Einstein Trust Layer to an IT lead in one page | Done: one-page PDF, facts checked against eight primary sources |
| 5 | [Ask this resume](05-ask-this-resume/) | A grounded assistant on the resume page with visible rules, a spend cap, and honest refusals | Worker built, type-checked, and tested locally (10 of 10 checks). Deploy pending Cloudflare login and API key |

## Ground rules

- No client names, client contacts, or client data. Functional descriptors only, the same rule as the resume.
- Dev org only. Nothing runs against a client or employer org.
- No em-dashes, none of the filler phrases on the resume's avoid-list. `../build/qa.py` scans every file before it ships.
- Every number has a source. Every quote is verbatim.
- Secrets never enter this folder. API keys live in Worker secrets or local, git-ignored files. Published scan output is redacted.

## Still to do (Dean)

1. **Re-record the agent demo** against the active version 2 and save it over `01-agentforce-resume-agent/demo.mp4`.
2. **Pick the task destination** for artifact 2: ClickUp or GitHub Issues.
3. **Create the public GitHub repo** for the resume page and this gallery, so the links on the page resolve.
4. **Switch on the Worker** for artifact 5: create an Anthropic API key, then store it as a Worker secret after Claude deploys it (steps in the setup guide).

Done: multi-factor authentication turned on in the dev org (2026-10-18).
