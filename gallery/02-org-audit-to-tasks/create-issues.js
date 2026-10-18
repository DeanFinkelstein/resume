#!/usr/bin/env node
// Creates the reviewed tasks in tasks.json as GitHub issues with the GitHub CLI, and writes each issue's URL back
// into tasks.json. Skips any task that already has a URL, so it is safe to run again.
// Run it only after the person has approved the list (step 4 of SKILL.md).
//
// Usage: node create-issues.js --repo <owner/name> [--tasks out/tasks.json] [--dry-run]
// Auth: uses the GitHub CLI's active account, or GH_TOKEN if set (to act as a different account for one run).
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const REPO = flag('repo');
const DRY = args.includes('--dry-run');
const tasksPath = path.resolve(flag('tasks', path.join(__dirname, 'out', 'tasks.json')));
if (!REPO) { console.error('Usage: node create-issues.js --repo <owner/name> [--tasks out/tasks.json] [--dry-run]'); process.exit(2); }

const data = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
const effortWords = { S: 'under an hour', M: 'under a day', L: 'more than a day' };
const labelColors = { 'org-audit': '0e8a16', 'priority: urgent': 'b60205', 'priority: high': 'd93f0b', 'priority: normal': 'fbca04' };

function body(t) {
  const lines = [];
  lines.push(`**Priority:** ${t.priority} · **Effort:** ${t.effort} (${effortWords[t.effort] || t.effort}) · **Severity:** ${t.severity}`, '');
  lines.push(t.description.trim(), '');
  if (t.reviewNote) lines.push(`> **Review note.** ${t.reviewNote}`, '');
  lines.push('### Checklist', '');
  for (const c of t.checklist) lines.push(`- [ ] ${c}`);
  lines.push('', '### Done when', '');
  for (const a of t.acceptance) lines.push(`- ${a}`);
  lines.push('', '---', '');
  lines.push(`From the read-only org health audit of the gallery's Agentforce Developer Edition org, run ${String(data.run).slice(0, 16).replace('T', ' ')} UTC, shaped by \`to-tasks.js\`${data.review ? ` and reviewed by ${data.review.approvedBy} on ${data.review.date} before creation` : ''}. Usernames, email addresses, the org ID, and the org address are redacted.`);
  return lines.join('\n') + '\n';
}

function gh(argv) {
  return execFileSync('gh', argv, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

const pending = data.tasks.filter(t => !t.url);
console.error(`${data.tasks.length} tasks, ${pending.length} to create in ${REPO}${DRY ? ' (dry run)' : ''}`);

if (DRY) {
  const preview = pending.map(t => `# ${t.title}\nLabels: ${['org-audit', `priority: ${t.priority}`, ...t.labels.filter(l => l !== 'org-audit')].join(', ')}\n\n${body(t)}`).join('\n\n');
  const out = path.join(path.dirname(tasksPath), 'issues-preview.md');
  fs.writeFileSync(out, preview, 'utf8');
  console.error(`Preview written to ${out}`);
  process.exit(0);
}

// Labels first, so every issue can carry them.
const wanted = new Set(['org-audit', ...pending.map(t => `priority: ${t.priority}`), ...pending.flatMap(t => t.labels)]);
for (const name of wanted) {
  gh(['label', 'create', name, '--repo', REPO, '--color', labelColors[name] || 'c5def5', '--force']);
}

for (const t of pending) {
  const file = path.join(os.tmpdir(), `issue-${t.key}.md`);
  fs.writeFileSync(file, body(t), 'utf8');
  const labels = ['org-audit', `priority: ${t.priority}`, ...t.labels.filter(l => l !== 'org-audit')];
  const argv = ['issue', 'create', '--repo', REPO, '--title', t.title, '--body-file', file];
  for (const l of labels) argv.push('--label', l);
  try {
    t.url = gh(argv).split('\n').pop();
    console.error(`  ${t.key} ${t.url}`);
  } catch (e) {
    console.error(`  ${t.key} failed: ${(e.stderr || e.message || '').toString().split('\n')[0]}`);
    console.error('Stopping. Tasks created so far keep their URLs in tasks.json; run again to continue.');
    break;
  } finally {
    fs.rmSync(file, { force: true });
  }
}
fs.writeFileSync(tasksPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.error(`Updated ${tasksPath}`);
