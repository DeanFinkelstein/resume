# Artifact gallery

[Dean Finkelstein's resume](https://deanfinkelstein.github.io/resume/) · [View the code on GitHub](https://github.com/DeanFinkelstein/resume/tree/main/gallery)

Fresh builds that show how Dean Finkelstein uses AI tooling in Salesforce work. Everything here was built from scratch in an Agentforce Developer Edition org and this folder. Nothing is copied from client work, and no client is named anywhere.

Each artifact has the same shape: a README that says what it does, what goes in, what comes out, how long it took, and what Dean would change next time; the code or skill files; and proof from a real run. Every claim carries a source, the same rule as the resume.

## The artifacts

| # | Artifact | What it proves | Status (2026-10-18) |
|---|---|---|---|
| 1 | [Agentforce resume agent](01-agentforce-resume-agent/) | Can design, ground, build, and test an Agentforce agent end to end, with the agent itself in source control | Published and active. 16-question test plan run against the live agent four times: 10 of 15 on the first run, 14 pass, 1 partial, 1 platform-blocked on the last. See its TEST-LOG |
| 2 | [Org audit to tasks](02-org-audit-to-tasks/) | The audit-to-tasks workflow rebuilt in public: scan, findings, prioritized tasks, created through MCP after approval | Ran, reviewed, and created: 7 GitHub issues in this repo. Rerun after MFA: 37 findings, Health Check 64 to 69 |
| 3 | [Pre-refresh risk scan](03-pre-refresh-risk-scan/) | Judgment about risk: everything a sandbox refresh would wipe or break, with owners | Ran: 16 checks in 67 seconds, redacted checklist in `out/` |
| 4 | [Adopting AI safely in a Salesforce shop](04-adopting-ai-safely/) | Can explain OAuth, data retention, licensing, and the Einstein Trust Layer to an IT lead in one page | Done: one-page PDF, facts checked against eight primary sources |
| 5 | [Ask this resume](05-ask-this-resume/) | A grounded assistant on the resume page with visible rules, a spend cap, and honest refusals | Live on the resume page since 2026-10-18. 12 of 12 test questions pass, including off-topic and jailbreak refusals. About half a cent per answer once cached |

## Ground rules

- No client names, client contacts, or client data. Functional descriptors only, the same rule as the resume.
- Dev org only. Nothing runs against a client or employer org.
- No em-dashes, none of the filler phrases on the resume's avoid-list. `../build/qa.py` is run on every file before it is published.
- Every number has a source. Every quote is verbatim.
- Secrets never enter this folder. API keys live in Worker secrets or local, git-ignored files. Published scan output is redacted.

## Still to do (Dean)

Nothing outstanding.

Done on 2026-10-18: multi-factor authentication turned on in the dev org; the agent demo re-recorded against version 2; the public repo created and GitHub Pages turned on; the audit tasks created as issues; the Worker deployed with its key set and the chat panel switched on.
