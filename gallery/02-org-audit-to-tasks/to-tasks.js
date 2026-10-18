#!/usr/bin/env node
// Turns findings.json into a normalized task list: one task per finding type and severity, with each affected
// component as a checklist item, a priority, an effort estimate, and acceptance criteria.
// The skill (SKILL.md) reviews this list with the person, then creates the tasks through whichever MCP server is
// connected (ClickUp or GitHub). This script never calls a task system itself.
//
// Usage: node to-tasks.js <findings.json> [--out tasks.json] [--max-items 25]
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const input = args.find(a => !a.startsWith('--'));
if (!input) { console.error('Usage: node to-tasks.js <findings.json> [--out tasks.json] [--max-items 25]'); process.exit(2); }
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const outPath = path.resolve(flag('out', path.join(path.dirname(path.resolve(input)), 'tasks.json')));
const MAX_ITEMS = Number(flag('max-items', 25));

const data = JSON.parse(fs.readFileSync(input, 'utf8'));
const priority = { high: 'urgent', medium: 'high', low: 'normal' };
const effortRank = { S: 1, M: 2, L: 3 };
const acceptance = {
  'Broad data access': ['Each listed user has a documented reason or a narrower permission set', 'Exceptions have an owner and a review date'],
  'License waste': ['Each listed user is confirmed with their manager', 'Licenses reclaimed or the exception documented'],
  'Retired automation': ['Each item rebuilt as a record-triggered flow and tested in a sandbox', 'Old automation deactivated after the new flow is live'],
  'Stale API version': ['Each component saved on the current API version', 'Tests pass in a sandbox before deployment'],
  'Test coverage': ['Org-wide coverage at or above 85 percent', 'New tests assert behavior, not just lines touched'],
  'Unused configuration': ['Each item reactivated with a test, archived, or deleted with a change-log note'],
  'Documentation gap': ['Every listed field has a one-line description: what it holds, who sets it, what reads it'],
  'Security setting': ['Each setting matches the Health Check baseline or has a recorded reason'],
  'Limit pressure': ['The consumer of each limit is identified', 'A fix or an alert is in place before the limit is reached'],
};

const groups = new Map();
for (const f of data.findings) {
  const key = `${f.check}|${f.severity}`;
  const g = groups.get(key) || { check: f.check, severity: f.severity, items: [], effort: 'S', recommendation: f.recommendation };
  g.items.push({ finding: f.id, component: f.component, detail: f.detail });
  if (effortRank[f.effort] > effortRank[g.effort]) g.effort = f.effort;
  groups.set(key, g);
}

const tasks = [];
let n = 0;
for (const g of [...groups.values()].sort((a, b) => ['high', 'medium', 'low'].indexOf(a.severity) - ['high', 'medium', 'low'].indexOf(b.severity))) {
  // Long groups split into batches so each task stays finishable.
  for (let i = 0; i < g.items.length; i += MAX_ITEMS) {
    const batch = g.items.slice(i, i + MAX_ITEMS);
    const part = g.items.length > MAX_ITEMS ? ` (part ${Math.floor(i / MAX_ITEMS) + 1} of ${Math.ceil(g.items.length / MAX_ITEMS)})` : '';
    tasks.push({
      key: `T-${String(++n).padStart(3, '0')}`,
      title: `${g.check}: ${batch.length} item${batch.length === 1 ? '' : 's'}${part}`,
      priority: priority[g.severity],
      severity: g.severity,
      effort: batch.length > 5 && g.effort === 'S' ? 'M' : g.effort,
      labels: ['org-audit', g.check.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
      description: `${g.recommendation}\n\nFrom the org health audit of ${data.org} run ${String(data.run).slice(0, 10)}.`,
      checklist: batch.map(b => `${b.finding} ${b.component}: ${b.detail}`),
      acceptance: acceptance[g.check] || ['Each checklist item resolved or documented'],
    });
  }
}

fs.writeFileSync(outPath, JSON.stringify({ source: path.basename(input), org: data.org, run: data.run, tasks }, null, 2) + '\n', 'utf8');
console.error(`${data.findings.length} findings -> ${tasks.length} tasks -> ${outPath}`);
