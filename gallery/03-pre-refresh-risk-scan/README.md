# Pre-refresh risk scan

**What it does.** Before a sandbox refresh, it lists everything in the org that the refresh will wipe, reset, or break: scheduled jobs, connected apps and the OAuth tokens behind them, named and external credentials, auth providers and SSO, remote sites, certificates, sites, custom setting data, custom metadata, integration-looking users, recent setup changes not yet in source control, platform event subscribers, email services, custom object record counts, and (if you point it at a project) the metadata in the org that differs from source control. It writes a checklist with an owner column and the manual checks the API cannot see, and the skill around it asks its questions first and drafts the client note last.

**Why it exists.** A client once planned a Full sandbox refresh with a third-party team's work sitting only in that sandbox. The list of what would be lost, including items outside our scope, was built by hand and the client acted on it. This is that list as a tool, so it takes minutes instead of an afternoon and nothing depends on remembering.

**What goes in.** A Salesforce CLI alias for a sandbox (never Production), optionally the path to the org's source-control project, and the answers to five questions.

**What comes out.** `out/refresh-risk-checklist.md` (human checklist with owners and actions), `out/refresh-risk.json` (the raw findings), and a drafted client note.

**Built with.** Node (no dependencies), the Salesforce CLI (`sf data query`, `sf org list metadata`, `sf project retrieve preview`), and a Claude Code skill (`SKILL.md`) that wraps the script with the ask-first, review, draft workflow.

## Run it

```
sf org login web --alias my-sandbox
node scan.js --org my-sandbox --out ./out
node scan.js --org my-sandbox --out ./out --project ../path/to/sfdx-project --days 120
node scan.js --org my-sandbox --out ./out --redact      # for anything you will publish
```

Read-only. Every call is a query or a listing. If a check fails because the running user lacks a permission, the checklist says so and the rest still runs.

## Proof (run 2026-10-17 against the gallery's Agentforce Developer Edition org)

16 automated checks in 67 seconds, plus 9 manual checks in the checklist. It found 3 scheduled jobs, 1 granted OAuth token, 1 named credential, 7 remote sites and trusted sites, 4 sites and Experience Cloud sites, 3 users that look like integration accounts, 41 setup changes in the last 90 days, and 4 custom objects holding data. Each one has an owner box and an action in `out/refresh-risk-checklist.md`.

A Developer Edition is not a sandbox, so nothing here will actually be refreshed. The scan is read-only and runs the same way against a sandbox. The output in `out/` is redacted with `--redact`: usernames, email addresses, the org ID, and the org address are masked.

## Time

Writing: one session. Running: under two minutes on a small org, longer where there are many custom objects to count (cap it with `--max-objects`).

## What I would change next time

- Add a `SandboxPostCopy` Apex class generator so the repeatable parts of the checklist become code the refresh runs itself.
- Diff two runs (before the last refresh, before this one) to show what accumulated in the sandbox in between.

Source tag for the resume card: built in a Developer Edition org, code and sample output in this folder.
