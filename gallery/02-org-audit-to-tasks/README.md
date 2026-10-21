# Org audit to tasks

[Dean Finkelstein's resume](https://deanfinkelstein.github.io/resume/) · [View the code on GitHub](https://github.com/DeanFinkelstein/resume/tree/main/gallery/02-org-audit-to-tasks)

**What it does.** Audits a Salesforce org read-only (broad data access, license waste, retired automation, stale API versions, test coverage, inactive validation rules, undocumented fields, unused reports, Security Health Check risks, limits near the ceiling), writes the findings as a document and as structured data, shapes them into a prioritized task list with checklists and acceptance criteria, and, after the person approves the list, creates the tasks as GitHub issues (or in ClickUp through MCP).

**Why it exists.** On a client engagement, a 244-line audit became 96 structured ClickUp tasks in about ten minutes through Claude Code and MCP. By hand it had taken half a day. This is that workflow rebuilt from scratch so it can be shown in public: a dev org, a fresh audit script, and the same pattern of letting the agent ask its questions before it acts.

**What goes in.** A CLI alias, the task destination, owners, and anything to leave out.

**What comes out.** `out/findings.md`, `out/findings.json`, `out/tasks.json` (with the created issue URLs), `out/issues-preview.md`, and the issues themselves.

**Built with.** Node (no dependencies), the Salesforce CLI, a Claude Code skill (`SKILL.md`), and the GitHub CLI (`create-issues.js`) or a ClickUp or GitHub MCP server.

## Run it

```
node audit.js --org resume-dev --out ./out
node to-tasks.js out/findings.json
node create-issues.js --repo owner/name --dry-run   # preview every issue
node create-issues.js --repo owner/name             # after the list is approved
```

Add `--redact` to the audit for anything you will publish.

Then, in Claude Code, run the skill and approve the list before anything is created.

## Run it without admin access

The audit only reads, so it doesn't need an admin. Use a user with the standard Read Only profile plus a permission set with five view-only permissions:

- View Setup and Configuration
- View Roles and Role Hierarchy
- View Health Check
- View Reports in Public Folders
- Approve Uninstalled Connected Apps (since September 2025 the Salesforce CLI's sign-in app is uninstalled by default, and this is what lets the user sign in through it)

Salesforce requires the first two in the same permission set as View Health Check, even though the Read Only profile already has them. The user also has to connect an authenticator app before the first CLI login if the org requires MFA.

Tested on 2026-10-20 by running the audit as that user and as an admin: 9 of the 11 checks matched exactly, finding for finding. The other two can't be read without much broader access. Org-wide Apex coverage needs code permissions or View All Data, and custom field descriptions need access to every field. The script says so and moves on; ask the org's admin for the coverage figure (Setup, Apex Classes, Estimate your organization's code coverage).

## Proof (runs on 2026-10-17 and 2026-10-18 against the gallery's Agentforce Developer Edition org)

| Step | Result |
|---|---|
| Audit, 11 read-only checks | 36 findings in 41 seconds: 16 high, 9 medium, 11 low |
| Shape into tasks | 7 tasks with checklists and acceptance criteria, in under a second |
| Review | Two edits before creation: the org's only admin dropped as an accepted exception, and the never-logged-in task reworded so nobody deactivates the Resume Agent's run-as user |
| Create the tasks | 7 GitHub issues in 12 seconds. The text of each one is in [out/issues-preview.md](out/issues-preview.md) |
| Rerun after turning on MFA | 37 findings in 46 seconds; the Health Check score rose from 64 to 69. The first run is kept in `out/before-mfa/` |

What it found in a brand-new org is the point. Multi-factor authentication was off, the Security Health Check score was 64, two users held Modify All Data or View All Data, four licensed users had never logged in, and org-wide Apex coverage was 0 percent because the sample app's tests had never run. The findings in `out/` are redacted with `--redact`: usernames, email addresses, the org ID, and the org address are masked.

## What I would change next time

- Diff two audits and only create tasks for new findings.
- Let the skill propose owners from the setup audit trail (who last changed each component).

Source tag for the resume card: built in a Developer Edition org, scripts, skill, and run log in this folder.
