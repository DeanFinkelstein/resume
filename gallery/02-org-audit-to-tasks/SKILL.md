---
name: org-audit-to-tasks
description: Audit a Salesforce org read-only, turn the findings into a reviewed, prioritized task list, and create the tasks in ClickUp or GitHub through MCP. Asks before it acts, and never creates a task the person has not approved.
---

# Org audit to tasks

The hand-built version of this took half a day: read a long audit, decide what belongs together, write each task with a priority and a definition of done, then type it into the tracker. This skill does the reading and the typing. The deciding stays with the person.

## Step 1: ask before acting

Ask in one message and wait:

1. Which org (CLI alias)? Confirm it is not a client production org unless the engagement allows read-only scans there.
2. Where do the tasks go? ClickUp (which list) or GitHub (which repo). Check that the matching MCP server is connected; if not, stop and say how to connect it.
3. Who owns the tasks? Assignee names, or leave unassigned.
4. Anything to leave out? Some findings are known and accepted. Saying so now saves noise later.

## Step 2: pre-flight

```
node audit.js --org <alias> --preflight
```

Run this before every audit of a client org, right after the client's admin sets up the user. It reads the user's effective permissions, tries one small query per check, and exits 1 if anything needs fixing.

- **Not ready:** stop. Send the person the FIX lines as they are; each one names the missing permission or setting. Run the pre-flight again once they're fixed. Do not run a partial audit.
- **Not read-only:** tell the person before anyone describes the work as read-only.
- **The two notes about Apex test coverage and custom field descriptions** are expected for a read-only user. Ask the client's admin for the coverage figure and add it to the report by hand. Leave custom field documentation out.

If the browser login failed before the pre-flight could run, see "Run it without admin access" in README.md for the usual causes.

## Step 3: audit
```
node audit.js --org <alias> --out ./out
```

Writes `out/findings.md` and `out/findings.json`. Read-only: every call is a query or a listing.

## Step 4: shape the tasks

```
node to-tasks.js out/findings.json
```

Writes `out/tasks.json`: one task per finding type and severity, each affected component as a checklist item, long groups split into batches of 25, with priority, effort, labels, and acceptance criteria.

## Step 5: review with the person

Show the task list as a table: key, title, priority, effort, checklist count. Then apply judgment the script cannot:

- Merge or split where the grouping does not match how the team works.
- Drop the findings the person said to leave out in Step 1.
- Raise anything that looks small but is not (an integration user with Modify All Data is a security finding and a change-control finding).
- Rewrite acceptance criteria where the team has its own definition of done.

Do not create anything until the person says the list is right.

## Step 6: create

Create each approved task through the connected MCP server, or for GitHub with `node create-issues.js --repo owner/name` (preview first with `--dry-run`), with the title, description, priority, labels, checklist (ClickUp checklist or a GitHub task list in the body), and acceptance criteria. Record each created task's URL back into `out/tasks.json` under `url`.

Then report: how many tasks were created, where, and the time from Step 3 to the last task created.

## Rules

- The audit never writes to the org.
- No audit of a client org until the pre-flight reports ready.
- No task is created without approval of the list.
- No client names in anything that leaves the engagement folder.
- If a task system call fails, stop, report what was created and what was not, and do not retry blindly.
