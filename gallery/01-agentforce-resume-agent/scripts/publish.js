#!/usr/bin/env node
// Validates and publishes the Resume Agent, then activates it.
// The agent user's username never goes into the repo: the .agent file holds a placeholder, this script swaps the
// real username in for the publish and always puts the placeholder back.
//
// Usage: node scripts/publish.js --org <alias> --agent-user <username> [--validate-only] [--no-activate]
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flag = n => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined; };
const ORG = flag('org');
const USER = flag('agent-user');
if (!ORG || !USER) { console.error('Usage: node scripts/publish.js --org <alias> --agent-user <username> [--validate-only] [--no-activate]'); process.exit(2); }
const API = 'Resume_Agent';
const PLACEHOLDER = '__AGENT_USER__';
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'force-app', 'main', 'default', 'aiAuthoringBundles', API, `${API}.agent`);
const original = fs.readFileSync(file, 'utf8');
if (!original.includes(PLACEHOLDER)) { console.error(`Placeholder ${PLACEHOLDER} not found in ${file}. Refusing to publish.`); process.exit(1); }

function run(label, cmd) {
  process.stderr.write(`${label} ... `);
  let out = '';
  try { out = execSync(cmd, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stdout || '').toString() || (e.stderr || '').toString(); }
  const i = out.indexOf('{');
  let j = {};
  try { j = JSON.parse(out.slice(i)); } catch (e) { j = { status: 1, message: out.slice(0, 600) }; }
  console.error(j.status === 0 ? 'ok' : `failed: ${(j.message || '').slice(0, 1200)}`);
  return j;
}

let exitCode = 0;
try {
  fs.writeFileSync(file, original.split(PLACEHOLDER).join(USER), 'utf8');
  const v = run('Validating Agent Script', `sf agent validate authoring-bundle --api-name ${API} --target-org ${ORG} --json`);
  if (v.status !== 0) { exitCode = 1; }
  else if (!args.includes('--validate-only')) {
    const p = run('Publishing', `sf agent publish authoring-bundle --api-name ${API} --target-org ${ORG} --json`);
    if (p.status !== 0) exitCode = 1;
    else if (!args.includes('--no-activate')) {
      const a = run('Activating', `sf agent activate --api-name ${API} --target-org ${ORG} --json`);
      if (a.status !== 0) exitCode = 1;
    }
  }
} finally {
  fs.writeFileSync(file, original, 'utf8'); // the placeholder always goes back
}
process.exit(exitCode);
