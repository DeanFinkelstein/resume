#!/usr/bin/env node
// Loads the resume into the org from resume.json (the same file the resume page, the Word copy, and the
// Claude-based assistant are built from), so every surface tells the same story.
// Upserts on external IDs, so it is safe to run again after the resume changes.
//
// Usage: node scripts/seed.js --org <alias> [--resume ../../resume.json] [--dry-run]
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const ORG = flag('org');
const DRY = args.includes('--dry-run');
const here = path.resolve(__dirname, '..');
const resumePath = path.resolve(here, flag('resume', '../../resume.json'));
if (!ORG && !DRY) { console.error('Usage: node scripts/seed.js --org <alias> [--resume path] [--dry-run]'); process.exit(2); }
const R = JSON.parse(fs.readFileSync(resumePath, 'utf8'));
const outDir = path.join(here, 'data');
fs.mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------- sections (grounding text, both registers)
const g = (o, reg) => (o && typeof o === 'object') ? o[reg] : o;
const sec = [];
function section(key, title, build) { sec.push({ Section_Key__c: key, Name: title, Body_Technical__c: build('t'), Body_Plain__c: build('p'), Sort_Order__c: sec.length + 1 }); }

section('summary', 'Summary', reg => [
  g(R.tagline, reg), '', g(R.summary, reg), `Sources: ${R.summary.src}`,
].join('\n'));
section('availability', 'Availability and Contact', reg => [
  R.availability,
  `Location: ${R.contact[0]}. Email: ${R.contact[1]}. LinkedIn: ${R.contact[2]}.`,
  reg === 't' ? 'Client names are left off on purpose. References are available with the client\'s consent.'
              : 'Client names are left off on purpose. Dean can share references once the client agrees.',
].join('\n'));
section('results', 'Selected Results', reg => R.highlights.map(h => `- ${g(h, reg)} (source: ${h.src})`).join('\n'));
section('skills', 'Core Skills', reg => R.skills.map(s => `- ${g(s.label, reg)}: ${g(s, reg)}`).join('\n'));
section('ai', g(R.aiPractice.heading, 't'), reg => [g(R.aiPractice.intro, reg), ...R.aiPractice.items.map(i => `- ${g(i, reg)}`), `Source: ${R.aiPractice.src}`].join('\n'));
for (const j of R.experience) {
  const key = 'exp-' + j.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  section(key, `Experience: ${j.company}`, reg => [
    `${j.company} (${g(j.note, reg)}), ${j.dates}`, `${j.roles}${j.src ? ` (source: ${j.src})` : ''}`,
    ...j.bullets.map(b => `- ${g(b, reg)}${b.src ? ` (source: ${b.src})` : ''}`),
  ].join('\n'));
}
section('certifications', 'Certifications', reg => [
  ...R.certifications.map(c => `- ${c.name}, ${c.date}${reg === 't' ? `, credential ID ${c.id}` : ''}`), g(R.certNote, reg),
].join('\n'));
section('education', 'Education', () => R.education.map(e => `- ${e.text} (source: ${e.src})`).join('\n'));
section('about-agent', 'About This Agent', reg => reg === 't'
  ? 'This agent runs on Agentforce in a Salesforce Developer Edition org Dean set up for his portfolio. Its answers come from three custom objects (Resume Section, Resume Credential, Resume Engagement) loaded from resume.json, the same file his resume page is built from, through four Apex actions: Get Resume Profile, Find Experience by Keyword, Get Credentials, and Capture Inquiry. It never names a client, because the data holds none. The Agent Script, Apex, tests, and seed script are in his portfolio gallery. A second assistant on his resume page does the same job on Claude behind a Cloudflare Worker, so the two stacks can be compared.'
  : 'This assistant runs on Salesforce\'s AI agent product, Agentforce, in a practice Salesforce account Dean set up for his portfolio. Everything it knows comes from his resume, loaded into Salesforce from the same file his resume page is built from. It can look up his experience, list his certifications, and pass a message to him. It never names a client, because that information is not in it. Dean built a second assistant on his resume page that does the same job with Claude, so you can compare the two.');

// ---------------------------------------------------------------- credentials
const cred = R.certifications.map((c, i) => ({
  Credential_Id__c: c.id, Name: c.name, Issuer__c: 'Salesforce', Date_Earned__c: c.date, AI_Related__c: c.ai ? 'true' : 'false', Sort_Order__c: i + 1,
}));

// ---------------------------------------------------------------- engagements
const cirriusNames = [
  'Managed services leadership', 'Client governance and pre-sales', 'AI-security briefing and Production deployment',
  'Medical-device integrations and Health Cloud', 'Sales KPI dashboard and Tableau Next', 'Carrier API diagnosis and remediation',
  'Field Service rollout and Salesforce Maps', 'Testing push to UAT', 'AI tooling and methodology', 'Podcast and mid-year review',
];
const TAGS = [
  [/field service|fsm|technician/i, 'Field Service'], [/maps/i, 'Salesforce Maps'], [/docusign|clm|contract-signing/i, 'DocuSign CLM'],
  [/integration|api|connect/i, 'Integration'], [/soap login/i, 'SOAP Login Retirement'], [/health cloud|healthcare add-on/i, 'Health Cloud'],
  [/permission|persona|who can see/i, 'Security model'], [/sandbox/i, 'Sandbox strategy'], [/crm analytics|crma/i, 'CRM Analytics'],
  [/tableau/i, 'Tableau'], [/claude|ai |\bai\b|agent|mcp/i, 'AI'], [/mcp/i, 'MCP'], [/production|deploy/i, 'Deployment'],
  [/uat|testing/i, 'Testing'], [/renew|sow|governance|end of month/i, 'Account management'], [/pre-sales|deck|deal/i, 'Pre-sales'],
  [/lead the managed services team|line-manage|coach|managed fifty|mentored/i, 'Leadership'], [/training|instructional/i, 'Training'],
  [/salesmate/i, 'Salesmate'], [/zapier/i, 'Zapier'], [/lightning/i, 'Lightning'], [/data loader|import/i, 'Data migration'],
  [/report|dashboards/i, 'Reports and dashboards'], [/catering|supply|inventory/i, 'Operations'], [/delphi/i, 'Delphi CRM'], [/podcast|security/i, 'Security'],
];
const tagsFor = text => [...new Set(TAGS.filter(([re]) => re.test(text)).map(([, t]) => t))].join(', ').slice(0, 255);
const eng = [];
for (const j of R.experience) {
  if (j.company.startsWith('Cirrius')) {
    if (j.bullets.length !== cirriusNames.length) throw new Error(`expected ${cirriusNames.length} Cirrius bullets, found ${j.bullets.length}`);
    j.bullets.forEach((b, i) => eng.push({
      Key__c: `cirrius-${i + 1}`, Name: cirriusNames[i], Employer__c: j.company, Role__c: j.roles.slice(0, 255), Period__c: j.dates,
      Summary_Technical__c: b.t, Summary_Plain__c: b.p, Skill_Tags__c: tagsFor(`${b.t} ${b.p}`), Source_Tag__c: (b.src || '').slice(0, 255),
      AI_Related__c: b.ai ? 'true' : 'false', Sort_Order__c: eng.length + 1,
    }));
  } else {
    const t = j.bullets.map(b => b.t).join(' '), p = j.bullets.map(b => b.p).join(' ');
    eng.push({
      Key__c: j.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), Name: `${j.roles} at ${j.company}`.slice(0, 80),
      Employer__c: j.company, Role__c: j.roles.slice(0, 255), Period__c: j.dates, Summary_Technical__c: t, Summary_Plain__c: p,
      Skill_Tags__c: tagsFor(`${t} ${p}`), Source_Tag__c: j.src || '', AI_Related__c: 'false', Sort_Order__c: eng.length + 1,
    });
  }
}

// ---------------------------------------------------------------- csv + upsert
const csvCell = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
function writeCsv(file, rows) {
  const cols = Object.keys(rows[0]);
  const text = [cols.join(','), ...rows.map(r => cols.map(c => csvCell(r[c])).join(','))].join('\n') + '\n';
  fs.writeFileSync(path.join(outDir, file), text, 'utf8');
  return path.join(outDir, file);
}
const jobs = [
  { sobject: 'Resume_Section__c', ext: 'Section_Key__c', file: writeCsv('sections.csv', sec), n: sec.length },
  { sobject: 'Resume_Credential__c', ext: 'Credential_Id__c', file: writeCsv('credentials.csv', cred), n: cred.length },
  { sobject: 'Resume_Engagement__c', ext: 'Key__c', file: writeCsv('engagements.csv', eng), n: eng.length },
];
console.error(`Built ${sec.length} sections, ${cred.length} credentials, ${eng.length} engagements from ${resumePath}`);
if (DRY) { console.error('Dry run: CSVs written to data/, nothing sent to the org.'); process.exit(0); }
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
const sfRun = args => execFileSync(SF[0], [...SF.slice(1), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
for (const j of jobs) {
  let out = '';
  try { out = sfRun(['data', 'upsert', 'bulk', '--sobject', j.sobject, '--file', j.file, '--external-id', j.ext, '--line-ending', 'LF', '--wait', '10', '--target-org', ORG, '--json']); } catch (e) { out = (e.stdout || '').toString(); }
  let res;
  try { res = JSON.parse(out); } catch (e) { console.error(`${j.sobject}: could not parse sf output: ${out.slice(0, 200)}`); process.exitCode = 1; continue; }
  if (res.status !== 0) { console.error(`${j.sobject}: upsert failed (${(res.message || '').slice(0, 160)})`); process.exitCode = 1; continue; }
  // Verify by counting what is in the org, rather than trusting the job summary.
  let count = '?';
  try {
    const q = JSON.parse(sfRun(['data', 'query', '--query', `SELECT COUNT() FROM ${j.sobject}`, '--target-org', ORG, '--json']));
    count = q.result.totalSize;
  } catch (e) { /* leave as unknown */ }
  console.error(`${j.sobject}: upserted ${j.n} from resume.json; ${count} record(s) now in the org`);
  if (count !== '?' && count < j.n) process.exitCode = 1;
}
