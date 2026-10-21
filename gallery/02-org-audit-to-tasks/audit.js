#!/usr/bin/env node
// Org health audit
// A read-only scan of a Salesforce org that writes a findings document: security exposure, retired automation,
// stale code, license waste, unused configuration, and limits close to the ceiling. Each finding carries a
// severity, the affected component, and a recommendation, so the next step (turning findings into tasks) has
// structured input instead of a wall of text.
//
// Usage:
//   node audit.js --org <alias> --preflight
//   node audit.js --org <alias> [--out <dir>] [--stale-days 90] [--min-api 55] [--redact]
//   --preflight checks the signed-in user's access before the audit: one small query per check plus the user's
//   effective permissions. It names any missing permission or setting and exits 1 if something needs fixing.
//   --redact masks usernames, email addresses, org IDs, and the org address. Use it for anything you publish.
//
// Output: <out>/findings.md (human) and <out>/findings.json (structured, input to the task skill)
'use strict';

const { execFileSync } = require('child_process');
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
  console.error('Usage: node audit.js --org <alias> [--preflight] [--out <dir>] [--stale-days 90] [--min-api 55] [--redact]');
  process.exit(2);
}
const ORG = opts.org;
const STALE = Number(opts['stale-days'] || 90);
const MIN_API = Number(opts['min-api'] || 55);
const OUT = path.resolve(opts.out || path.join(process.cwd(), 'out'));
if (!opts.preflight) fs.mkdirSync(OUT, { recursive: true });

// sf runs with an argument list, never through a shell, so no value is parsed as shell syntax. On Windows, sf is a
// .cmd shim that Node will not start without a shell, so run the CLI's own entry script with node instead.
function sfBin() {
  if (process.platform !== 'win32') return ['sf'];
  for (const dir of (process.env.PATH || '').split(path.delimiter).filter(Boolean)) {
    const entry = [path.join(dir, 'node_modules', '@salesforce', 'cli', 'bin', 'run.js'), path.join(dir, '..', 'client', 'bin', 'run.js')]
      .find(f => fs.existsSync(f));
    if (entry) return [process.execPath, '--no-deprecation', entry];
  }
  return ['sf'];
}
const SF = sfBin();
function sf(args) {
  let out = '';
  try {
    out = execFileSync(SF[0], [...SF.slice(1), ...args, '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = (e.stdout || '').toString();
    if (!out.trim()) throw new Error(((e.stderr || e.message || '') + '').trim().split('\n')[0] || 'sf failed');
  }
  const j = JSON.parse(out);
  if (j.status !== 0) throw new Error((j.message || j.name || 'sf error').replace(/\s+/g, ' ').trim());
  return j.result;
}
function rows(soql, tooling) {
  const r = sf(['data', 'query', '--query', soql, '--target-org', ORG, ...(tooling ? ['--use-tooling-api'] : [])]);
  return r.records || [];
}
const pick = (r, k) => k.split('.').reduce((o, p) => (o == null ? o : o[p]), r);
const day = s => (s || '').slice(0, 10);

const findings = [];
let seq = 0;
function add(check, severity, component, detail, recommendation, effort) {
  findings.push({ id: `F-${String(++seq).padStart(3, '0')}`, check, severity, component, detail, recommendation, effort });
}

// ---------------------------------------------------------------- pre-flight
// Run first in a client org, right after the admin creates the user. Everything here is a query, like the audit.
// The permission list was proven on 2026-10-20 by running the audit as a Read Only user and as an admin.
const NEEDED = [
  ['PermissionsViewSetup', 'View Setup and Configuration', 'most checks'],
  ['PermissionsViewRoles', 'View Roles and Role Hierarchy', 'Salesforce requires it with View Health Check'],
  ['PermissionsViewHealthCheck', 'View Health Check', 'the Security Health Check'],
  ['PermissionsViewPublicReports', 'View Reports in Public Folders', 'the unused-reports count, which comes back low with no error without it'],
];
const CAN_CHANGE = [
  ['PermissionsModifyAllData', 'Modify All Data'],
  ['PermissionsCustomizeApplication', 'Customize Application'],
  ['PermissionsModifyMetadata', 'Modify Metadata Through Metadata API Functions'],
  ['PermissionsAuthorApex', 'Author Apex'],
  ['PermissionsManageUsers', 'Manage Users'],
];
const ADD_VIEW_SETUP = 'Add View Setup and Configuration to the permission set.';
const PROBES = [
  ['Users with Modify All Data or View All Data', () => rows('SELECT Id FROM PermissionSetAssignment LIMIT 1'), ADD_VIEW_SETUP],
  ['Users with no login', () => rows('SELECT Id, LastLoginDate FROM User WHERE IsActive = true LIMIT 1'), ADD_VIEW_SETUP],
  ['Workflow Rules and Process Builder', () => { rows("SELECT Id FROM Flow WHERE Status = 'Active' AND ProcessType = 'Workflow' LIMIT 1", true); rows('SELECT Id FROM WorkflowRule LIMIT 1', true); }, ADD_VIEW_SETUP],
  ['Flow API versions', () => rows("SELECT Id FROM Flow WHERE Status = 'Active' LIMIT 1", true), ADD_VIEW_SETUP],
  ['Apex API versions', () => { rows('SELECT Id FROM ApexClass LIMIT 1'); rows('SELECT Id FROM ApexTrigger LIMIT 1'); }, ADD_VIEW_SETUP],
  ['Inactive validation rules', () => rows('SELECT Id FROM ValidationRule WHERE Active = false LIMIT 1', true), ADD_VIEW_SETUP],
  ['Unused reports', () => rows('SELECT Id FROM Report LIMIT 1'), 'Check that the user has Run Reports (the Read Only profile does).'],
  ['Security Health Check', () => { rows('SELECT Score FROM SecurityHealthCheck', true); rows('SELECT RiskType FROM SecurityHealthCheckRisks LIMIT 1', true); },
    'Add View Health Check to the permission set, together with View Setup and Configuration and View Roles and Role Hierarchy.'],
  ['Org limits', () => sf(['limits', 'api', 'display', '--target-org', ORG]), ADD_VIEW_SETUP],
];

// Salesforce messages end with a period; drop it before adding the fix.
const trim = s => String(s).replace(/[.\s]+$/, '');

function preflight() {
  const out = [];
  const line = (status, name, detail) => out.push({ status, name, detail });
  let fixes = 0;
  const fix = (name, detail) => { fixes++; line('FIX', name, detail); };
  const print = () => {
    console.log(`Pre-flight for ${ORG}`);
    for (const l of out) console.log(`  ${l.status.padEnd(4)}  ${l.name}${l.detail ? `: ${l.detail}` : ''}`);
    return fixes;
  };

  // Signed in? A failed browser login never reaches this point; the README lists what blocks it.
  let user;
  try {
    const d = sf(['org', 'display', '--target-org', ORG]);
    if (d.connectedStatus && d.connectedStatus !== 'Connected') throw new Error(d.connectedStatus);
    user = d.username;
    line('ok', 'Signed in', opts.redact ? 'yes' : `as ${user}`);
  } catch (e) {
    fix('Signed in', `${trim(e.message)}. Sign in with: sf org login web --alias ${ORG} --instance-url <the org's My Domain URL>`);
    print(); return 1;
  }

  // API access: Professional Edition orgs often don't have it, and nothing below works without it.
  try {
    const o = rows('SELECT OrganizationType, IsSandbox FROM Organization')[0] || {};
    line('ok', 'API access', `${o.OrganizationType || 'unknown edition'}${o.IsSandbox ? ', sandbox' : ''}`);
  } catch (e) {
    const m = e.message;
    fix('API access', /API_DISABLED_FOR_ORG/i.test(m) ? "this org doesn't include the Salesforce API (common on Professional Edition). The org has to add API access first."
      : /API_CURRENTLY_DISABLED/i.test(m) ? "the user's profile doesn't allow API access. Use the standard Read Only profile."
        : `${trim(m)}. Check that the user is active, then sign in again.`);
    print(); return 1;
  }

  // The user's effective permissions: the profile's permission set plus every assigned permission set.
  try {
    const me = rows(`SELECT Id FROM User WHERE Username = '${String(user).replace(/'/g, "\\'")}'`)[0];
    const fields = [...NEEDED, ...CAN_CHANGE].map(p => p[0]).concat('PermissionsViewAllData');
    const sets = rows(`SELECT ${fields.join(', ')} FROM PermissionSet WHERE Id IN (SELECT PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId = '${me.Id}')`);
    const has = f => sets.some(s => s[f] === true);
    for (const [f, label, why] of NEEDED) {
      if (has(f)) line('ok', label);
      else fix(label, `missing. Needed for ${why}. Add it to the permission set.`);
    }
    const write = CAN_CHANGE.filter(([f]) => has(f)).map(([, label]) => label);
    if (write.length) line('note', 'Not read-only', `this user can change things (${write.join(', ')}). Fine for an admin, but don't describe the work as read-only.`);
    else line('ok', 'Read-only', 'the user has none of the permissions that change data, setup, or code');
    if (has('PermissionsViewAllData')) line('note', 'View All Data', 'this user can see every record. The audit only reads setup.');
  } catch (e) {
    fix('Permissions', `could not read them (${trim(e.message)}). ${ADD_VIEW_SETUP}`);
  }

  // One small query per check, the same objects the audit reads.
  let ready = 0;
  for (const [name, probe, hint] of PROBES) {
    try { probe(); ready++; line('ok', `Check: ${name}`); } catch (e) { fix(`Check: ${name}`, `${trim(e.message)}. ${hint}`); }
  }

  // The two checks a read-only user can't run. Expected to be skipped; reported so nobody is surprised.
  try { rows('SELECT PercentCovered FROM ApexOrgWideCoverage', true); line('note', 'Check: Apex test coverage', 'available to this user'); }
  catch (e) { line('note', 'Check: Apex test coverage', "not visible to a read-only user (expected). Ask the admin for the figure: Setup, Apex Classes, Estimate your organization's code coverage"); }
  try { rows('SELECT Id FROM CustomField LIMIT 1', true); line('note', 'Check: custom field descriptions', 'available to this user'); }
  catch (e) { line('note', 'Check: custom field descriptions', 'needs admin-level access to every field (expected for a read-only user). Skipped'); }

  print();
  console.log(fixes ? `\nNot ready: ${fixes} item(s) to fix above. ${ready} of ${PROBES.length} checks can run now.`
    : `\nReady: all ${PROBES.length} read-only checks can run.`);
  return fixes ? 1 : 0;
}
if (opts.preflight) process.exit(preflight());

// ---------------------------------------------------------------- checks
const checks = [
  {
    name: 'Users with Modify All Data or View All Data',
    run: () => {
      const r = rows("SELECT Assignee.Name, Assignee.Username, Assignee.IsActive, PermissionSet.Label, PermissionSet.IsOwnedByProfile, PermissionSet.Profile.Name, PermissionSet.PermissionsModifyAllData, PermissionSet.PermissionsViewAllData FROM PermissionSetAssignment WHERE (PermissionSet.PermissionsModifyAllData = true OR PermissionSet.PermissionsViewAllData = true) AND Assignee.IsActive = true");
      const byUser = new Map();
      for (const a of r) {
        const u = pick(a, 'Assignee.Username');
        const src = pick(a, 'PermissionSet.IsOwnedByProfile') ? `profile ${pick(a, 'PermissionSet.Profile.Name')}` : `permission set ${pick(a, 'PermissionSet.Label')}`;
        const perm = pick(a, 'PermissionSet.PermissionsModifyAllData') ? 'Modify All Data' : 'View All Data';
        const e = byUser.get(u) || { name: pick(a, 'Assignee.Name'), grants: [] };
        e.grants.push(`${perm} via ${src}`);
        byUser.set(u, e);
      }
      for (const [u, e] of byUser) {
        add('Broad data access', 'high', `User ${e.name} (${u})`, e.grants.join('; '),
          'Confirm the business need. Move to a narrower permission set, or document the exception with an owner and a review date.', 'S');
      }
      return byUser.size;
    },
  },
  {
    name: `Active users with no login in ${STALE} days`,
    run: () => {
      const r = rows(`SELECT Name, Username, Profile.UserLicense.Name, LastLoginDate FROM User WHERE IsActive = true AND UserType = 'Standard' AND (LastLoginDate < LAST_N_DAYS:${STALE} OR LastLoginDate = null)`);
      for (const u of r) {
        add('License waste', 'medium', `User ${u.Name} (${u.Username})`,
          `License ${pick(u, 'Profile.UserLicense.Name') || 'unknown'}; last login ${day(u.LastLoginDate) || 'never'}`,
          'Confirm with the manager, then freeze or deactivate and reclaim the license. Check first whether it is an integration user.', 'S');
      }
      return r.length;
    },
  },
  {
    name: 'Workflow rules and Process Builder still active',
    run: () => {
      let n = 0;
      const pb = rows("SELECT Definition.DeveloperName, ProcessType, VersionNumber, ApiVersion FROM Flow WHERE Status = 'Active' AND ProcessType = 'Workflow'", true);
      for (const f of pb) {
        n++;
        add('Retired automation', 'medium', `Process Builder ${pick(f, 'Definition.DeveloperName')}`, `Active version ${f.VersionNumber}, API ${f.ApiVersion}`,
          'Migrate to a record-triggered flow with the Migrate to Flow tool, test in a sandbox, then deactivate.', 'M');
      }
      try {
        const wr = rows("SELECT Name, TableEnumOrId FROM WorkflowRule", true);
        for (const w of wr) {
          n++;
          add('Retired automation', 'medium', `Workflow rule ${w.Name} on ${w.TableEnumOrId}`, 'Workflow rules are retired; check whether this one is still active in Setup.',
            'Migrate to a record-triggered flow, test, then deactivate.', 'M');
        }
      } catch (e) { /* WorkflowRule not queryable in some orgs; Process Builder results still stand */ }
      return n;
    },
  },
  {
    name: `Active flows below API ${MIN_API}`,
    run: () => {
      const r = rows(`SELECT Definition.DeveloperName, ProcessType, VersionNumber, ApiVersion FROM Flow WHERE Status = 'Active' AND ApiVersion < ${MIN_API} AND ProcessType != 'Workflow'`, true);
      for (const f of r) {
        add('Stale API version', 'low', `Flow ${pick(f, 'Definition.DeveloperName')}`, `${f.ProcessType}, active version ${f.VersionNumber}, API ${f.ApiVersion}`,
          'Open, save as a new version on the current API, retest, activate.', 'S');
      }
      return r.length;
    },
  },
  {
    name: `Apex classes and triggers below API ${MIN_API}`,
    run: () => {
      // Standard API, not Tooling: a read-only user can query these, and the results match an admin's.
      const cls = rows(`SELECT Name, ApiVersion, NamespacePrefix FROM ApexClass WHERE ApiVersion < ${MIN_API} AND NamespacePrefix = null`);
      const trg = rows(`SELECT Name, ApiVersion, TableEnumOrId, NamespacePrefix FROM ApexTrigger WHERE ApiVersion < ${MIN_API} AND NamespacePrefix = null`);
      for (const c of cls) add('Stale API version', 'low', `Apex class ${c.Name}`, `API ${c.ApiVersion}`, 'Raise the API version in a sandbox, run the tests, deploy.', 'S');
      for (const t of trg) add('Stale API version', 'low', `Apex trigger ${t.Name} on ${t.TableEnumOrId}`, `API ${t.ApiVersion}`, 'Raise the API version in a sandbox, run the tests, deploy.', 'S');
      return cls.length + trg.length;
    },
  },
  {
    name: 'Org-wide Apex test coverage',
    run: () => {
      // Coverage needs code permissions (Author Apex, Modify Metadata) or View All Data. A read-only user has neither.
      let r;
      try { r = rows('SELECT PercentCovered FROM ApexOrgWideCoverage', true); } catch (e) {
        throw new Error("not visible to a read-only user. Ask the org's admin for the figure: Setup, Apex Classes, Estimate your organization's code coverage");
      }
      const pct = r.length ? r[0].PercentCovered : null;
      if (pct != null && pct < 85) {
        add('Test coverage', pct < 75 ? 'high' : 'medium', 'Org-wide Apex coverage', `${pct}% covered (deployments to production require 75%)`,
          'Run all tests, list the classes with the lowest coverage, add meaningful assertions starting with the most-changed classes.', 'L');
        return 1;
      }
      return 0;
    },
  },
  {
    name: 'Inactive validation rules',
    run: () => {
      const r = rows('SELECT ValidationName, EntityDefinition.QualifiedApiName FROM ValidationRule WHERE Active = false', true);
      for (const v of r) {
        add('Unused configuration', 'low', `Validation rule ${v.ValidationName} on ${pick(v, 'EntityDefinition.QualifiedApiName')}`, 'Inactive',
          'Decide: reactivate with a test, or delete with a note in the change log.', 'S');
      }
      return r.length;
    },
  },
  {
    name: 'Custom fields without a description',
    run: () => {
      // A read-only user can't query CustomField, and FieldDefinition only shows the fields they have field-level access to.
      let r;
      try { r = rows('SELECT DeveloperName, TableEnumOrId, Description, NamespacePrefix FROM CustomField WHERE NamespacePrefix = null', true); } catch (e) {
        throw new Error('needs admin-level access to every field, which a read-only user does not have');
      }
      const missing = r.filter(f => !f.Description || !String(f.Description).trim());
      const byObj = new Map();
      for (const f of missing) byObj.set(f.TableEnumOrId, (byObj.get(f.TableEnumOrId) || 0) + 1);
      // Custom objects come back as IDs (01I...). Resolve them to API names so the finding is readable.
      const ids = [...byObj.keys()].filter(k => /^01I[A-Za-z0-9]{12,15}$/.test(k));
      if (ids.length) {
        try {
          const names = new Map(rows(`SELECT DurableId, QualifiedApiName FROM EntityDefinition WHERE DurableId IN ('${ids.join("','")}')`)
            .map(e => [e.DurableId, e.QualifiedApiName]));
          for (const id of ids) {
            const name = names.get(id) || names.get(id.slice(0, 15));
            if (name) { byObj.set(name, (byObj.get(name) || 0) + byObj.get(id)); byObj.delete(id); }
          }
        } catch (e) { /* leave IDs in place if the lookup fails */ }
      }
      for (const [obj, count] of byObj) {
        add('Documentation gap', 'low', `Object ${obj}`, `${count} custom field(s) without a description`,
          'Add a one-line description to each field: what it holds, who sets it, and what reads it.', 'S');
      }
      return byObj.size;
    },
  },
  {
    name: 'Reports not run in a year',
    run: () => {
      const r = rows('SELECT Name, FolderName, LastRunDate FROM Report WHERE LastRunDate < LAST_N_DAYS:365 OR LastRunDate = null LIMIT 2000');
      if (r.length) {
        add('Unused configuration', 'low', `${r.length} report(s)`, `Not run in 365 days or never run. Examples: ${r.slice(0, 5).map(x => x.Name).join(', ')}`,
          'Move to an archive folder for 90 days, then delete what nobody asked for.', 'M');
        return 1;
      }
      return 0;
    },
  },
  {
    name: 'Security Health Check',
    run: () => {
      const s = rows('SELECT Score FROM SecurityHealthCheck', true);
      const score = s.length ? Number(s[0].Score) : null;
      let n = 0;
      try {
        const risks = rows("SELECT RiskType, Setting, SettingGroup, OrgValue, StandardValue FROM SecurityHealthCheckRisks WHERE RiskType IN ('HIGH_RISK','MEDIUM_RISK')", true);
        for (const k of risks) {
          n++;
          add('Security setting', k.RiskType === 'HIGH_RISK' ? 'high' : 'medium', `${k.SettingGroup}: ${k.Setting}`,
            `Org value ${k.OrgValue}, baseline ${k.StandardValue}${score != null ? `; overall score ${score}` : ''}`,
            'Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value.', 'S');
        }
      } catch (e) { /* risks object not queryable: the score alone still gets reported below */ }
      if (score != null && n === 0 && score < 80) {
        n++;
        add('Security setting', 'medium', 'Security Health Check', `Score ${score}`, 'Open Health Check in Setup and fix the high-risk items first.', 'M');
      }
      return n;
    },
  },
  {
    name: 'Org limits above 80 percent',
    run: () => {
      const r = sf(['limits', 'api', 'display', '--target-org', ORG]);
      let n = 0;
      for (const l of r || []) {
        if (!l.max || l.max <= 0) continue;
        const used = l.max - l.remaining;
        const pct = Math.round((used / l.max) * 100);
        if (pct >= 80) {
          n++;
          add('Limit pressure', pct >= 95 ? 'high' : 'medium', `Limit ${l.name}`, `${used} of ${l.max} used (${pct}%)`,
            'Find what is consuming it (integration, batch job, storage growth) before it blocks users.', 'M');
        }
      }
      return n;
    },
  },
];

// ---------------------------------------------------------------- run
const started = Date.now();
console.error(`Org health audit of ${ORG}, read-only, ${checks.length} checks`);
const log = [];
for (const c of checks) {
  process.stderr.write(`  ${c.name} ... `);
  const t0 = Date.now();
  try {
    const n = c.run();
    log.push({ check: c.name, findings: n, seconds: +((Date.now() - t0) / 1000).toFixed(1) });
    console.error(`${n}`);
  } catch (e) {
    log.push({ check: c.name, findings: null, error: e.message });
    console.error(`could not check: ${e.message}`);
  }
}

const order = { high: 0, medium: 1, low: 2 };
findings.sort((a, b) => order[a.severity] - order[b.severity] || a.check.localeCompare(b.check));
const counts = findings.reduce((m, f) => (m[f.severity] = (m[f.severity] || 0) + 1, m), {});
const runAt = new Date().toISOString();

const md = [];
md.push(`# Org health audit: ${ORG}`, '');
md.push(`Read-only scan run ${runAt.slice(0, 10)}. ${findings.length} findings: ${counts.high || 0} high, ${counts.medium || 0} medium, ${counts.low || 0} low. Nothing in the org was changed.`, '');
md.push('## Checks run', '', '| Check | Findings |', '|---|---|');
for (const l of log) md.push(`| ${l.check} | ${l.findings == null ? `could not check: ${l.error}` : l.findings} |`);
md.push('', '## Findings', '', '| ID | Severity | Check | Component | Detail | Recommendation | Effort |', '|---|---|---|---|---|---|---|');
for (const f of findings) md.push(`| ${f.id} | ${f.severity} | ${f.check} | ${f.component.replace(/\|/g, '/')} | ${String(f.detail).replace(/\|/g, '/')} | ${f.recommendation} | ${f.effort} |`);
md.push('', 'Effort: S is under an hour, M is under a day, L is more than a day.', '', `Generated by audit.js in ${((Date.now() - started) / 1000).toFixed(0)} seconds.`);
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
    .replace(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.my\.salesforce\.com\b/gi, 'redacted.my.salesforce.com');
}
if (REDACT) md.splice(3, 0, 'Usernames, email addresses, the org ID, and the org address are redacted in this copy.', '');
fs.writeFileSync(path.join(OUT, 'findings.md'), redact(md.join('\n')) + '\n', 'utf8');
fs.writeFileSync(path.join(OUT, 'findings.json'), redact(JSON.stringify({ org: ORG, run: runAt, staleDays: STALE, minApi: MIN_API, redacted: REDACT, checks: log, findings }, null, 2)) + '\n', 'utf8');
console.error(`Wrote ${path.join(OUT, 'findings.md')} (${md.length} lines) and findings.json`);
