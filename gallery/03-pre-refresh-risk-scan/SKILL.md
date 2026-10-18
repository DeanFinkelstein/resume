---
name: pre-refresh-risk-scan
description: Before a Salesforce sandbox refresh, list everything the refresh will wipe, reset, or break, assign an owner to each item, and draft the note to the client. Read-only. Asks its questions before it runs anything.
---

# Pre-refresh risk scan

Use this when a sandbox refresh is coming and someone needs to know what will be lost. The scan is read-only. The judgment is in the questions, the review, and the note that goes out.

## Step 1: ask before acting

Ask these in one message and wait for the answers. Do not run the scan first.

1. Which org, and what is its CLI alias? Confirm it is a sandbox, not Production. Production is never scanned by this skill.
2. When is the refresh, and what type (Full, Partial, Developer Pro, Developer)? Full and Partial replace data. Developer and Developer Pro keep none.
3. Is there a source-control project for this org? If yes, where is it on disk? The scan can compare the org against it.
4. Who owns the integrations? The checklist assigns owners, so names (internal people only) help.
5. Is anything in this sandbox known to exist nowhere else? Test data someone built by hand, a feature switch, a demo configuration.

## Step 2: run the scan

```
node scan.js --org <alias> --out ./out [--project <path to sfdx project>] [--days 90]
```

The script writes `out/refresh-risk-checklist.md` and `out/refresh-risk.json`. If a check fails (a permission the running user lacks, an object the org does not have), it says so in the checklist and keeps going. Do not retry with more permissions without asking.

## Step 3: review, do not just forward

Read the checklist and apply judgment the script cannot:

- Which items are outside our scope but still at risk? Flag them anyway. The client would rather hear it twice than not at all.
- Which items are noise? A connected app nobody uses can be dropped on purpose. Say so instead of listing it as work.
- Which items will break silently? Integration users and OAuth tokens go first on the note.
- Is there a post-copy script? If not, recommend one. It turns most of this list into code.

Edit the checklist: strike noise, add owners, add anything the answers from Step 1 surfaced.

## Step 4: draft the note

Write the client note in plain words, one screen long:

- The refresh date and type, in the first line.
- What will be lost or reset, grouped: data, credentials and integrations, scheduled jobs, sandbox-only configuration.
- What we need from them, with a date: owners for the items outside our scope, confirmation on anything we plan to drop.
- What we will do, with a date: exports before, re-entry and rescheduling after, a smoke test on day one.

Attach the checklist. Send nothing without the engagement lead reading it first.

## Rules

- Read-only. The script only queries and lists. Never add a write.
- Sandboxes only. If the alias resolves to Production, stop and say so.
- Never paste secrets into the checklist. Named credential names, yes. Values, never.
- No client names in anything that leaves the engagement folder.
