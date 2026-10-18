# Org audit to tasks

**What it does.** Audits a Salesforce org read-only (broad data access, license waste, retired automation, stale API versions, test coverage, inactive validation rules, undocumented fields, unused reports, Security Health Check risks, limits near the ceiling), writes the findings as a document and as structured data, shapes them into a prioritized task list with checklists and acceptance criteria, and, after the person approves the list, creates the tasks in ClickUp or GitHub through MCP.

**Why it exists.** On a client engagement, a 244-line audit became 96 structured ClickUp tasks in about ten minutes through Claude Code and MCP. By hand it had taken half a day. This is that workflow rebuilt from scratch so it can be shown in public: a dev org, a fresh audit script, and the same pattern of letting the agent ask its questions before it acts.

**What goes in.** A CLI alias, the task destination, owners, and anything to leave out.

**What comes out.** `out/findings.md`, `out/findings.json`, `out/tasks.json` (with the created task URLs), and the tasks themselves.

**Built with.** Node (no dependencies), the Salesforce CLI, a Claude Code skill (`SKILL.md`), and the ClickUp or GitHub MCP server.

## Run it

```
node audit.js --org resume-dev --out ./out
node to-tasks.js out/findings.json
```

Add `--redact` to the audit for anything you will publish.

Then, in Claude Code, run the skill and approve the list before anything is created.

## Proof (run 2026-10-17 against the gallery's Agentforce Developer Edition org)

| Step | Result |
|---|---|
| Audit, 11 read-only checks | 36 findings in 41 seconds: 16 high, 9 medium, 11 low |
| Shape into tasks | 7 tasks with checklists and acceptance criteria, in under a second |
| Create the tasks through MCP | Pending: Dean's choice of ClickUp or GitHub Issues |

What it found in a brand-new org is the point. Multi-factor authentication was off, the Security Health Check score was 64, two users held Modify All Data or View All Data, four licensed users had never logged in, and org-wide Apex coverage was 0 percent because the sample app's tests had never run. The findings in `out/` are redacted with `--redact`: usernames, email addresses, the org ID, and the org address are masked.

## What I would change next time

- Diff two audits and only create tasks for new findings.
- Let the skill propose owners from the setup audit trail (who last changed each component).

Source tag for the resume card: built in a Developer Edition org, scripts, skill, and run log in this folder.
