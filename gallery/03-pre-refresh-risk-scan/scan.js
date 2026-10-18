#!/usr/bin/env node
// Pre-refresh risk scan
// Lists everything in a Salesforce org that a sandbox refresh would wipe, reset, or break, so each item
// gets backed up, recreated, or consciously dropped before the refresh instead of discovered after it.
// Read-only: every call is a query or a metadata listing. Nothing is changed in the org.
//
// Usage:
//   node scan.js --org <alias> [--out <dir>] [--project <sfdx project dir>] [--days 90] [--max-objects 150] [--redact]
//   --redact masks usernames, email addresses, org IDs, and the org address. Use it for anything you publish.
//
// Output: <out>/refresh-risk-checklist.md and <out>/refresh-risk.json
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true'; o[k] = v; }
  }
  return o;
}
const opts = parseArgs(process.argv.slice(2));
if (!opts.org) {
  console.error('Usage: node scan.js --org <alias> [--out <dir>] [--project <sfdx project dir>] [--days 90] [--max-objects 150]');
  process.exit(2);
}
const ORG = opts.org;
const DAYS = Number(opts.days || 90);
const MAX_OBJECTS = Number(opts['max-objects'] || 150);
const OUT = path.resolve(opts.out || path.join(process.cwd(), 'out'));
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- sf CLI wrapper
function sf(cmdline, cwd) {
  // Runs "sf <cmdline> --json" and returns result. Throws a short Error on failure.
  const full = `sf ${cmdline} --json`;
  let out = '';
  try {
    out = execSync(full, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = (e.stdout || '').toString();
    if (!out.trim()) throw new Error(((e.stderr || e.message || '') + '').trim().split('\n')[0] || 'sf failed');
  }
  let j;
  try { j = JSON.parse(out); } catch (e) { throw new Error('non-JSON response from sf: ' + out.slice(0, 160)); }
  if (j.status !== 0) throw new Error((j.message || j.name || 'sf error').split('\n')[0]);
  return j.result;
}
// SOQL must avoid double quotes and percent signs (the command runs through the shell).
function query(soql, tooling) {
  if (/["%]/.test(soql)) throw new Error('internal: SOQL must not contain " or %');
  const r = sf(`data query --query "${soql}" --target-org ${ORG}${tooling ? ' --use-tooling-api' : ''}`);
  return { records: r.records || [], totalSize: r.totalSize != null ? r.totalSize : (r.records || []).length };
}
function rows(soql, tooling) { return query(soql, tooling).records; }
function listMeta(type) {
  const r = sf(`org list metadata --metadata-type ${type} --target-org ${ORG}`);
  const arr = Array.isArray(r) ? r : (r && r.length === undefined && r.fullName ? [r] : []);
  return arr.map(m => ({ name: m.fullName, modified: (m.lastModifiedDate || '').slice(0, 10), by: m.lastModifiedByName || '' }));
}
const flat = r => { const o = {}; for (const [k, v] of Object.entries(r)) { if (k === 'attributes') continue; if (v && typeof v === 'object' && !Array.isArray(v)) { for (const [k2, v2] of Object.entries(v)) if (k2 !== 'attributes') o[`${k}.${k2}`] = v2; } else o[k] = v; } return o; };

// ---------------------------------------------------------------- checks
// Each check: id, title, why (what the refresh does to it), action (what to do before), run() -> array of rows
const checks = [
  {
    id: 'scheduled-jobs', title: 'Scheduled jobs',
    why: 'Scheduled Apex, scheduled reports, and dashboard refreshes do not survive a refresh. Each one is rescheduled by hand or by a post-copy script.',
    action: 'Record class, schedule, and running user. Reschedule after the refresh.',
    run: () => rows("SELECT CronJobDetail.Name, CronJobDetail.JobType, State, NextFireTime, CronExpression, CreatedBy.Name FROM CronTrigger WHERE State IN ('WAITING','ACQUIRED','EXECUTING','PAUSED') ORDER BY NextFireTime")
      .map(flat).map(r => ({ name: r['CronJobDetail.Name'], type: jobType(r['CronJobDetail.JobType']), state: r.State, next: r.NextFireTime, cron: r.CronExpression, runsAs: r['CreatedBy.Name'] })),
  },
  {
    id: 'connected-apps', title: 'Connected apps',
    why: 'Connected apps copy over, but the tokens users and integrations granted do not. Every integration that authenticates through one re-authorizes against the new sandbox.',
    action: 'List which integration uses each app and who re-authorizes it.',
    run: () => listMeta('ConnectedApp'),
  },
  {
    id: 'oauth-tokens', title: 'Granted OAuth tokens',
    why: 'Tokens are tied to the org copy they were issued in. After the refresh, every one of these is dead.',
    action: 'For each app and user, plan the re-authentication and who does it.',
    run: () => rows("SELECT AppName, User.Username, LastUsedDate, UseCount FROM OauthToken ORDER BY LastUsedDate DESC NULLS LAST").map(flat)
      .map(r => ({ app: r.AppName, user: r['User.Username'], lastUsed: (r.LastUsedDate || '').slice(0, 10), uses: r.UseCount })),
  },
  {
    id: 'named-credentials', title: 'Named credentials',
    why: 'The definitions copy over. The stored passwords, tokens, and certificates behind them do not.',
    action: 'Re-enter each credential after the refresh. Know where the secret lives before you start.',
    run: () => listMeta('NamedCredential'),
  },
  {
    id: 'external-credentials', title: 'External credentials',
    why: 'Same as named credentials: the principal secrets have to be re-entered.',
    action: 'Re-enter principal secrets after the refresh.',
    run: () => listMeta('ExternalCredential'),
  },
  {
    id: 'auth-providers', title: 'Auth providers and SSO',
    why: 'Auth providers and SAML configurations copy over, but callback URLs change with the sandbox domain, and identity providers may need the new URLs.',
    action: 'Update callback URLs on the identity provider side. Test SSO login first thing after the refresh.',
    run: () => [...listMeta('AuthProvider').map(m => ({ ...m, kind: 'AuthProvider' })), ...listMeta('SamlSsoConfig').map(m => ({ ...m, kind: 'SamlSsoConfig' }))],
  },
  {
    id: 'remote-sites', title: 'Remote site settings and CSP trusted sites',
    why: 'These copy over from Production. Any endpoint that exists only for the sandbox (a test API, a staging host) disappears.',
    action: 'Re-add sandbox-only endpoints after the refresh.',
    run: () => [...listMeta('RemoteSiteSetting').map(m => ({ ...m, kind: 'RemoteSiteSetting' })), ...listMeta('CspTrustedSite').map(m => ({ ...m, kind: 'CspTrustedSite' }))],
  },
  {
    id: 'certificates', title: 'Certificates',
    why: 'Certificates copy over, but anything signed for the old sandbox domain or a sandbox-only integration needs checking.',
    action: 'Confirm each certificate is still valid for its purpose after the refresh.',
    run: () => listMeta('Certificate'),
  },
  {
    id: 'sites', title: 'Sites and Experience Cloud sites',
    why: 'Site definitions copy over. Domains, guest user settings, and any sandbox-only site configuration need checking.',
    action: 'Note each site, its domain, and its guest user profile. Test guest access after the refresh.',
    run: () => [...listMeta('CustomSite').map(m => ({ ...m, kind: 'CustomSite' })), ...listMeta('Network').map(m => ({ ...m, kind: 'Network' }))],
  },
  {
    id: 'custom-settings', title: 'Custom setting data',
    why: 'Custom setting records are data. A refresh replaces them with Production values. Sandbox-only values (test endpoints, feature switches, kill switches) are lost.',
    action: 'Export each custom setting now. Re-import the sandbox-only values after the refresh.',
    run: () => {
      const defs = rows('SELECT QualifiedApiName, Label FROM EntityDefinition WHERE IsCustomSetting = true');
      return defs.map(d => {
        let count = 'n/a';
        try { count = query(`SELECT COUNT() FROM ${d.QualifiedApiName}`).totalSize; } catch (e) { count = 'could not count: ' + e.message; }
        return { setting: d.QualifiedApiName, label: d.Label, records: count };
      });
    },
  },
  {
    id: 'custom-metadata', title: 'Custom metadata records',
    why: 'Custom metadata copies over from Production, overwriting any sandbox-only record values.',
    action: 'Retrieve custom metadata to source control before the refresh so sandbox-only values can be redeployed.',
    run: () => listMeta('CustomMetadata'),
  },
  {
    id: 'integration-users', title: 'Users that look like integration or service accounts',
    why: 'After a refresh every user email gets .invalid appended, passwords are reset, and sessions end. Human users notice. Integration users fail silently at 2 a.m.',
    action: 'For each one: who owns it, how it authenticates, and who resets it after the refresh.',
    run: () => rows("SELECT Name, Username, Email, Profile.Name, UserType, LastLoginDate FROM User WHERE IsActive = true AND UserType = 'Standard' ORDER BY LastLoginDate DESC NULLS LAST")
      .map(flat)
      .filter(u => /integration|api|service|system|bot|automation|sync|connector|mulesoft|boomi|workato/i.test(`${u.Name} ${u.Username} ${u['Profile.Name']}`))
      .map(u => ({ name: u.Name, username: u.Username, profile: u['Profile.Name'], lastLogin: (u.LastLoginDate || '').slice(0, 10) })),
  },
  {
    id: 'recent-setup-changes', title: `Setup changes in the last ${DAYS} days`,
    why: 'Configuration done in the sandbox and not yet in source control is overwritten by the refresh. The audit trail shows what changed and who did it.',
    action: 'Check each change against source control. Retrieve anything missing before the refresh.',
    run: () => rows(`SELECT Action, Section, Display, CreatedBy.Name, CreatedDate FROM SetupAuditTrail WHERE CreatedDate = LAST_N_DAYS:${DAYS} ORDER BY CreatedDate DESC LIMIT 500`)
      .map(flat).map(r => ({ when: (r.CreatedDate || '').slice(0, 10), section: r.Section, action: r.Action, detail: (r.Display || '').slice(0, 140), by: r['CreatedBy.Name'] })),
  },
  {
    id: 'event-subscribers', title: 'Platform event and change data capture subscribers',
    why: 'External subscribers hold replay positions for this org copy. After the refresh they reconnect to a new org with new IDs.',
    action: 'Tell each subscriber owner to reset replay IDs after the refresh.',
    run: () => rows('SELECT Name, Type, Topic, Status, Position FROM EventBusSubscriber').map(r => ({ name: r.Name, type: r.Type, topic: r.Topic, status: r.Status, position: r.Position })),
  },
  {
    id: 'email-services', title: 'Email services',
    why: 'Email service addresses are regenerated with the new sandbox domain. Anything that sends mail to them points at a dead address.',
    action: 'Record each address and who sends to it. Update the senders after the refresh.',
    run: () => listMeta('EmailServicesFunction'),
  },
  {
    id: 'custom-object-data', title: 'Custom object record counts',
    why: 'A Full or Partial refresh replaces data. Records that exist only in the sandbox (test data, in-progress configuration data) are gone. Developer and Developer Pro sandboxes keep no data at all.',
    action: 'Export anything you need to keep. Decide per object.',
    run: () => {
      const defs = rows('SELECT QualifiedApiName, Label FROM EntityDefinition WHERE IsCustomizable = true AND IsQueryable = true LIMIT 2000')
        .filter(d => /__c$/.test(d.QualifiedApiName) && !/__(mdt|e|x|b)$/.test(d.QualifiedApiName));
      const out = [];
      for (const d of defs.slice(0, MAX_OBJECTS)) {
        let count = 'n/a';
        try { count = query(`SELECT COUNT() FROM ${d.QualifiedApiName}`).totalSize; } catch (e) { count = 'could not count'; }
        out.push({ object: d.QualifiedApiName, label: d.Label, records: count });
      }
      if (defs.length > MAX_OBJECTS) out.push({ object: `(${defs.length - MAX_OBJECTS} more objects not counted, raise --max-objects)`, label: '', records: '' });
      return out.filter(o => o.records !== 0);
    },
  },
];

if (opts.project) {
  checks.push({
    id: 'source-drift', title: 'Metadata in the org that differs from source control',
    why: 'Anything in the org that is not in the repo is lost on refresh. This is the retrieve preview against the project you pointed at.',
    action: 'Retrieve and commit before the refresh, or accept the loss on purpose.',
    run: () => {
      const r = sf(`project retrieve preview --target-org ${ORG}`, path.resolve(opts.project));
      const items = [];
      for (const c of (r.toRetrieve || [])) items.push({ type: c.type, name: c.fullName, state: c.state || 'changed in org' });
      for (const c of (r.conflicts || [])) items.push({ type: c.type, name: c.fullName, state: 'conflict' });
      return items;
    },
  });
}

function jobType(code) {
  const m = { 1: 'Data Export', 3: 'Dashboard Refresh', 4: 'Reporting Snapshot', 6: 'Scheduled Flow', 7: 'Scheduled Apex', 8: 'Report Run', 9: 'Batch Job', A: 'Reporting Notification' };
  return m[code] || `system job (type code ${code})`;
}

// --redact masks login usernames and email addresses, org IDs, and the org's My Domain host, for output that will be published.
const REDACT = opts.redact === 'true';
const emailMap = new Map();
function redact(text) {
  if (!REDACT) return text;
  return text
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, m => {
      if (!emailMap.has(m.toLowerCase())) emailMap.set(m.toLowerCase(), `user-${emailMap.size + 1}@redacted.example`);
      return emailMap.get(m.toLowerCase());
    })
    .replace(/\b00D[A-Za-z0-9]{12}(?:[A-Za-z0-9]{3})?\b/g, '00D-redacted')
    .replace(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.my\.salesforce\.com\b/gi, 'redacted.my.salesforce.com')
    .replace(/(Org : )00D[A-Za-z0-9]+/g, '$100D-redacted');
}

// ---------------------------------------------------------------- run
const started = new Date();
console.error(`Pre-refresh risk scan of ${ORG}, read-only, ${checks.length} checks`);
const results = [];
for (const c of checks) {
  process.stderr.write(`  ${c.title} ... `);
  const t0 = Date.now();
  try {
    const items = c.run() || [];
    results.push({ id: c.id, title: c.title, why: c.why, action: c.action, count: items.length, items });
    console.error(`${items.length} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  } catch (e) {
    results.push({ id: c.id, title: c.title, why: c.why, action: c.action, count: null, items: [], error: e.message });
    console.error(`could not check: ${e.message}`);
  }
}

// ---------------------------------------------------------------- manual checks (not queryable)
const manual = [
  'Email deliverability: a refreshed sandbox is set to System email only. Decide whether to raise it, and tell testers.',
  'Email masking: user emails get .invalid appended. Fix the handful that need real mail (integration owners, testers).',
  'Outbound messages, callouts, and webhooks: any endpoint that pointed at the old sandbox URL (My Domain changes) must be updated on the other side.',
  'Login IP ranges and trusted IPs on profiles: confirm they match what the sandbox users need.',
  'Debug logs, trace flags, and Apex test settings: all reset.',
  'Data masking or Data Mask templates: rerun after the refresh if the client requires it.',
  'Installed package license assignments: recheck user assignments after the refresh.',
  'Report and dashboard subscriptions: recreate.',
  'Sandbox post-copy script (an Apex class implementing SandboxPostCopy): the right place to automate everything above that repeats. If there is none, that is a finding too.',
];

// ---------------------------------------------------------------- write
const stamp = started.toISOString().slice(0, 10);
const summary = results.map(r => ({ check: r.title, found: r.count == null ? 'could not check' : r.count, action: r.action }));
const md = [];
md.push(`# Pre-refresh risk checklist: ${ORG}`);
md.push('');
md.push(`Read-only scan run ${stamp}. ${results.length} automated checks plus ${manual.length} manual ones. Nothing in the org was changed.`);
md.push('');
md.push('Every item below is either backed up, recreated after the refresh, or dropped on purpose. Tick the box when it has an owner.');
md.push('');
md.push('## Summary');
md.push('');
md.push('| Check | Found | Action before refresh |');
md.push('|---|---|---|');
for (const s of summary) md.push(`| ${s.check} | ${s.found} | ${s.action} |`);
md.push('');
for (const r of results) {
  md.push(`## ${r.title}`);
  md.push('');
  md.push(r.why);
  md.push('');
  if (r.error) { md.push(`Could not check: ${r.error}`); md.push(''); continue; }
  if (!r.items.length) { md.push('Nothing found.'); md.push(''); continue; }
  const cols = Object.keys(r.items[0]);
  md.push(`| Assigned | ${cols.join(' | ')} |`);
  md.push(`|---|${cols.map(() => '---').join('|')}|`);
  for (const it of r.items.slice(0, 60)) md.push(`| [ ] | ${cols.map(k => String(it[k] == null ? '' : it[k]).replace(/\|/g, '/')).join(' | ')} |`);
  if (r.items.length > 60) md.push(`| | (${r.items.length - 60} more in refresh-risk.json) |${cols.slice(1).map(() => ' |').join('')}`);
  md.push('');
  md.push(`Action: ${r.action}`);
  md.push('');
}
md.push('## Manual checks');
md.push('');
for (const m of manual) md.push(`- [ ] ${m}`);
md.push('');
md.push(`Generated by scan.js in ${((Date.now() - started.getTime()) / 1000).toFixed(0)} seconds.`);
if (REDACT) md.splice(3, 0, 'Usernames, email addresses, the org ID, and the org address are redacted in this copy.', '');
fs.writeFileSync(path.join(OUT, 'refresh-risk-checklist.md'), redact(md.join('\n')) + '\n', 'utf8');
fs.writeFileSync(path.join(OUT, 'refresh-risk.json'), redact(JSON.stringify({ org: ORG, run: started.toISOString(), days: DAYS, redacted: REDACT, results, manual }, null, 2)) + '\n', 'utf8');
console.error(`Wrote ${path.join(OUT, 'refresh-risk-checklist.md')} and refresh-risk.json`);
