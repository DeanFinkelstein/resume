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

## Step 2: audit

```
node audit.js --org <alias> --out ./out
```

Writes `out/findings.md` and `out/findings.json`. Read-only: every call is a query or a listing.

## Step 3: shape the tasks

```
node to-tasks.js out/findings.json
```

Writes `out/tasks.json`: one task per finding type and severity, each affected component as a checklist item, long groups split into batches of 25, with priority, effort, labels, and acceptance criteria.

## Step 4: review with the person

Show the task list as a table: key, title, priority, effort, checklist count. Then apply judgment the script cannot:

- Merge or split where the grouping does not match how the team works.
- Drop the findings the person said to leave out in Step 1.
- Raise anything that looks small but is not (an integration user with Modify All Data is a security finding and a change-control finding).
- Rewrite acceptance criteria where the team has its own definition of done.

Do not create anything until the person says the list is right.

## Step 5: create

Create each approved task through the connected MCP server, with the title, description, priority, labels, checklist (ClickUp checklist or a GitHub task list in the body), and acceptance criteria. Record each created task's URL back into `out/tasks.json` under `url`.

Then report: how many tasks were created, where, and the time from Step 2 to the last task created.

## Rules

- The audit never writes to the org.
- No task is created without approval of the list.
- No client names in anything that leaves the engagement folder.
- If a task system call fails, stop, report what was created and what was not, and do not retry blindly.
