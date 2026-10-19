// Builds the web-page resume: one self-contained HTML file with a Plain English | Technical switch,
// a "Show the AI work" mode, a source note next to each claim, an inline diagram of the AI tooling loop,
// a "How this page was built" section, a copy-as-Markdown button, and a resume.json beside the page.
// Usage: node build-web-resume.js <outDir>
const fs = require('fs');
const path = require('path');
const C = require('./content');

const outDir = process.argv[2] || '.';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = s => esc(s).replace(/"/g, '&quot;');
const pair = o => `<span class="t">${esc(o.t)}</span><span class="p">${esc(o.p)}</span>`;
const src = (s, href) => s ? (href ? `<a class="src" href="${attr(href)}">${esc(s)}</a>` : `<span class="src">${esc(s)}</span>`) : '';
const aiCls = o => (o && o.ai) ? ' class="ai"' : '';

const ACCENT = '#e69138';      // rules, fills, markers
const ACCENT_TEXT = '#9a5a12'; // accent-colored text: 5.46:1 on white, where ACCENT is 2.48:1
// Build date in local time: the footer, the copy-as-Markdown text, and resume.json say when the page was last built.
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
// The files the header buttons download. The build writes the Word copy; the PDF is printed from this page (see README.md).
const PDF_TECH = 'Dean Finkelstein - Resume (Technical).pdf';
const WORD = 'Dean Finkelstein - Resume.docx';

// ---------------------------------------------------------------- markdown (for the copy button)
function mdFor(reg) {
  const r = o => o[reg];
  const L = [];
  L.push(`# ${C.name}`);
  L.push(r(C.tagline));
  L.push(`${C.contact.join(' · ')}`);
  L.push(C.availability, '');
  L.push('## Summary', r(C.summary), `Sources: ${C.summary.src}`, '');
  L.push('## Selected Results');
  C.highlights.forEach(h => L.push(`- ${r(h)} (source: ${h.src}${h.srcHref ? `, ${h.srcHref}` : ''})`));
  L.push('', '## Core Skills');
  C.skills.forEach(s => L.push(`- ${r(s.label)}: ${r(s)}`));
  L.push('', `## ${r(C.aiPractice.heading)}`, r(C.aiPractice.intro));
  C.aiPractice.items.forEach(i => L.push(`- ${r(i)}`));
  L.push(`Source: ${C.aiPractice.src}`, '');
  const g2 = C.gallery.filter(g => g.ready);
  if (g2.length) { L.push('## Gallery'); g2.forEach(g => L.push(`- ${r(g.title)}: ${r(g.what)} (${g.proof}; ${g.href})`)); L.push(''); }
  L.push('## Experience');
  C.experience.forEach(j => {
    L.push(`### ${j.company} · ${r(j.note)} · ${j.dates}`);
    L.push(`${j.roles} (${j.src})`);
    j.bullets.forEach(b => L.push(`- ${r(b)}${b.src ? ` (source: ${b.src}${b.srcHref ? `, ${b.srcHref}` : ''})` : ''}`));
    L.push('');
  });
  L.push('## Certifications');
  C.certifications.forEach(c => L.push(`- ${c.name}, ${c.date}`));
  L.push(r(C.certNote), `${C.certNote.src}: ${C.certNote.srcHref}`, '', '## Education');
  C.education.forEach(e => L.push(`- ${e.text} (${e.src})`));
  L.push('', `## ${C.builtWith.heading}`, r(C.builtWith.body));
  C.builtWith.pipeline.forEach(p => L.push(`- ${p}`));
  L.push('', r(C.disclosure), `Last updated ${today}.`);
  return L.join('\n');
}
const mdPlain = mdFor('p');
const mdTech = mdFor('t');
const jsonSafe = s => JSON.stringify(s).replace(/</g, '\\u003c');

// ---------------------------------------------------------------- machine-readable
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: C.name,
  jobTitle: 'Team Lead, Managed Services',
  worksFor: { '@type': 'Organization', name: 'Cirrius Solutions Inc.' },
  email: `mailto:${C.contact[1]}`,
  address: { '@type': 'PostalAddress', addressLocality: 'Matamoras', addressRegion: 'PA', addressCountry: 'US' },
  url: C.site.href,
  sameAs: ['https://www.linkedin.com/in/deanfinkelstein/'],
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'Western Governors University' },
  hasCredential: C.certifications.map(c => ({ '@type': 'EducationalOccupationalCredential', name: c.name, credentialCategory: 'certification', dateCreated: c.date })),
  knowsAbout: ['Salesforce', 'Managed Services', 'CRM Analytics', 'Tableau', 'Field Service', 'Claude Code', 'MCP', 'Agentforce'],
};
const resumeJson = {
  generated: today,
  name: C.name, contact: C.contact, availability: C.availability,
  tagline: C.tagline, summary: C.summary, highlights: C.highlights, skills: C.skills,
  aiPractice: C.aiPractice, experience: C.experience, certifications: C.certifications,
  certNote: C.certNote, education: C.education, builtWith: C.builtWith, disclosure: C.disclosure,
  gallery: C.gallery.filter(g => g.ready),
  notes: 'Fields t and p are the same fact in the Technical and Plain English registers. src is where the claim comes from. ai marks AI-tooling items. Client names are left off on purpose.',
};

// ---------------------------------------------------------------- page
const head = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Dean Finkelstein - Resume</title>
<meta name="description" content="${attr(C.site.description)}">
<link rel="canonical" href="${attr(C.site.href)}">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:url" content="${attr(C.site.href)}">
<meta property="og:title" content="Dean Finkelstein - Resume">
<meta property="og:description" content="${attr(C.site.description)}">
<meta property="og:image" content="${attr(C.site.href + C.site.card.file)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${attr(C.site.card.alt)}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${jsonSafe(jsonLd)}</script>
<style>
:root{--ink:#1f2328;--muted:#5b6670;--rule:#d9dee3;--rule-strong:#b9c1c8;--accent:${ACCENT};--accent-text:${ACCENT_TEXT};--soft:#fff7ee;--soft2:#f0d2b3;--tag-text:#7a4a12;
  --bg:#fff;--canvas:#f3f4f6;--surface:#f4f5f7;--raised:#fff;--line:#9aa5ad;--on-accent:#111;
  --sans:"Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,BlinkMacSystemFont,Roboto,"Helvetica Neue",Arial,sans-serif;
  --print-sans:Calibri,Carlito,"Segoe UI",-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono","Courier New",monospace}
/* Dark colors follow the visitor's system setting, on screen only, so a PDF printed from a dark-mode machine stays light. */
@media screen and (prefers-color-scheme:dark){
  :root{--ink:#e6e3de;--muted:#a3abb3;--rule:#30353b;--rule-strong:#4a5058;--accent-text:#f0a95a;--soft:#2b2219;--soft2:#5c4329;--tag-text:#e8b27a;
    --bg:#17191c;--canvas:#0e0f11;--surface:#202328;--raised:#2c3036;--line:#6b737b}
}
*{box-sizing:border-box}
html{background:var(--canvas)}
body{margin:0 auto;max-width:880px;padding:28px 16px 48px;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.5;-webkit-text-size-adjust:100%}
a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--rule-strong)}
a:hover{border-bottom-color:var(--accent)}
b{font-weight:700}
body:not(.tech) .t{display:none}
body.tech .p{display:none}

.top{padding-bottom:2px}
h1{font-size:34px;line-height:1.1;margin:0 0 6px}
.tag{margin:0 0 8px;color:var(--accent-text);font-weight:700;font-size:17px}
.contact{margin:0 0 4px;color:var(--muted)}
.avail{margin:0;font-weight:700}
.controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;margin:18px 0 4px;padding:10px 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}
.mode{display:flex;align-items:center;gap:8px}
.mode-label{font-size:14px;color:var(--muted)}
.toggle{display:flex;align-items:center;gap:2px;background:var(--surface);border:1px solid var(--rule);border-radius:8px;padding:3px}
.toggle button{appearance:none;border:0;background:transparent;font:inherit;font-size:14px;color:var(--muted);padding:5px 12px;border-radius:6px;cursor:pointer}
.toggle button:hover{color:var(--ink)}
.toggle button[aria-pressed="true"]{background:var(--raised);color:var(--ink);font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,.14)}
.toggle button:focus-visible,.btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.btn{appearance:none;font:inherit;font-size:14px;padding:6px 12px;border-radius:8px;border:1px solid var(--rule);background:var(--bg);color:var(--ink);cursor:pointer}
.btn:hover{border-color:var(--accent)}
.btn[aria-pressed="true"]{background:var(--soft);border-color:var(--accent);font-weight:700}
.hint{margin-left:auto;font-size:12.5px;color:var(--muted)}
.cta{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}
a.btn{display:inline-block;font-weight:700;padding:7px 14px}
a.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
a.btn.primary:hover{filter:brightness(1.05)}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.print-note,.print-url,#proof{display:none}

section{margin:0 0 22px}
h2{font-size:14px;letter-spacing:1.2px;text-transform:uppercase;margin:28px 0 10px;padding-bottom:5px;border-bottom:1px solid var(--rule)}
p{margin:0 0 8px}
ul,ol{margin:0 0 6px;padding-left:22px}
li{margin:0 0 7px}
li::marker{color:var(--muted)}
/* Source tags: quiet outlined chips, so the claim reads first */
.src{display:inline-block;margin-left:6px;padding:0 8px;border:1px solid var(--rule);border-radius:10px;color:var(--muted);font-size:12px;line-height:1.6;white-space:nowrap;vertical-align:1px}
.srcline{margin:-2px 0 0;font-size:12.5px;color:var(--muted)}
.srcline .src{margin-left:0}
a.src{border-color:var(--rule-strong);text-decoration:underline;text-decoration-color:var(--rule-strong);text-underline-offset:2px}
a.src:hover{border-color:var(--accent);text-decoration-color:var(--accent)}

.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:2px 0 14px}
.tile{background:var(--surface);border-radius:10px;padding:12px 14px}
.tile .num{font-size:28px;font-weight:700;line-height:1.1}
.tile .lbl{margin-top:4px;font-size:13.5px;line-height:1.35;color:var(--muted)}

.results{list-style:none;padding:0;margin:0;border-top:1px solid var(--rule)}
.results li{display:grid;grid-template-columns:1fr auto;gap:6px 18px;align-items:start;padding:8px 0;margin:0;border-bottom:1px solid var(--rule)}
.results .src{margin:2px 0 0;white-space:normal;max-width:220px;text-align:left}

.skill{margin:0 0 6px}
.skill .lab{font-weight:700}

.job{display:flex;justify-content:space-between;align-items:baseline;gap:8px 16px;flex-wrap:wrap;margin:14px 0 2px}
.job .co{font-size:17px;font-weight:700}
.job .note,.job .dates{color:var(--muted)}
.roles{font-style:italic;margin:0 0 6px}
/* Older jobs start folded on screen; print always shows them in full */
.job-toggle{appearance:none;border:0;background:none;padding:2px 0;margin:0 0 6px;font:inherit;font-size:13.5px;color:var(--muted);cursor:pointer}
.job-toggle::before{content:"";display:inline-block;margin-right:7px;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;vertical-align:1px;transition:transform .15s}
.job-toggle[aria-expanded="true"]::before{transform:rotate(90deg)}
.job-toggle:hover{color:var(--ink)}
.job-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:3px}
@media screen{.jobwrap.collapsed .job-body{display:none}}
.certs{list-style:none;padding:0;margin:0 0 6px;columns:2;column-gap:28px}
.certs li{break-inside:avoid;margin:0 0 5px}

/* AI tooling in practice */
.dg{display:block;width:100%;height:auto;margin:6px 0 10px;border:1px solid var(--rule);border-radius:8px;background:var(--bg)}
.dg text{font-family:var(--sans);fill:var(--ink)}
.dg .box{fill:var(--bg);stroke:var(--rule);stroke-width:1}
.dg .core{fill:var(--soft);stroke:var(--accent);stroke-width:1.5}
.dg .lbl{font-size:12.5px;font-weight:700}
.dg .sub{font-size:11px;fill:var(--muted)}
.dg .ttl{font-size:16px;font-weight:700}
.dg .rule{font-size:11px;fill:var(--tag-text)}
.dg .ln{stroke:var(--line);stroke-width:1.3;fill:none}
.dg marker path{fill:var(--line)}
.dg .cap{font-size:11.5px;fill:var(--muted)}
/* the same loop as a stacked list, shown in place of the diagram on narrow screens */
.dg-list{display:none;margin:6px 0 10px}
.dg-step{border:1px solid var(--rule);border-radius:8px;padding:8px 12px}
.dg-step.core{background:var(--soft);border-color:var(--accent)}
.dg-step h3{margin:0 0 4px;font-size:12.5px;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}
.dg-step.core h3{font-size:16px;letter-spacing:0;text-transform:none;color:var(--ink)}
.dg-step ul{list-style:none;padding:0;margin:0}
.dg-step li{margin:0 0 4px;font-size:14px}
.dg-step li span{display:block;font-size:13px;color:var(--muted)}
.dg-step .rule{color:var(--tag-text)}
.dg-arrow{text-align:center;color:var(--line);line-height:1;margin:3px 0}
.dg-list .cap{margin:6px 0 0;font-size:12.5px;color:var(--muted)}
.practice{list-style:none;padding:0;margin:0}
.practice li{padding-left:14px;position:relative}
.practice li::before{content:"";position:absolute;left:0;top:.6em;width:6px;height:6px;border-radius:50%;background:var(--muted)}

/* gallery */
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin:6px 0 4px}
.gcard{border:1px solid var(--rule);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:6px;background:var(--bg)}
.gcard h3{margin:0;font-size:15.5px}
.gcard p{margin:0;font-size:14px}
.gcard .proof{font-family:var(--mono);font-size:11.5px;color:var(--tag-text)}
.gcard a.open{align-self:flex-start;margin-top:auto;font-size:13.5px;font-weight:700}
.gcard.wide{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:10px 18px;align-items:start}
.gcard .gtext{display:flex;flex-direction:column;gap:6px;height:100%}
.gcard figure{margin:0}
.gcard video{display:block;width:100%;height:auto;border:1px solid var(--rule);border-radius:6px;background:var(--surface)}
.gcard figcaption{margin-top:4px;font-size:12.5px;color:var(--muted)}
/* how this page was built */
.pipeline{list-style:none;padding:10px 12px;margin:6px 0 8px;background:var(--surface);border:1px solid var(--rule);border-radius:8px;font-family:var(--mono);font-size:12.5px;color:var(--ink)}
.pipeline li{margin:0 0 4px}
.links{list-style:none;padding:0;margin:0}
.links li{display:inline-block;margin:0 14px 4px 0}

/* AI mode */
body.ai .tile:not(.ai),body.ai .results li:not(.ai),body.ai .skill:not(.ai),body.ai #experience li:not(.ai),body.ai .certs li:not(.ai),body.ai #education li,body.ai #summary p{opacity:.28}
body.ai .ai{background:var(--soft);outline:2px solid var(--soft2);outline-offset:4px;border-radius:3px}
body.ai .results li.ai{outline-offset:-2px;padding-left:8px;padding-right:8px}
body.ai .tile.ai{outline-offset:-2px;border-radius:10px}
body.ai #ai-practice,body.ai #built,body.ai #gallery{outline:2px solid var(--soft2);outline-offset:8px;border-radius:3px}

/* ask this resume */
.ask-launch{position:fixed;right:18px;bottom:18px;z-index:50;appearance:none;border:1px solid var(--ink);background:var(--ink);color:var(--bg);font:inherit;font-weight:700;font-size:14px;padding:10px 14px;border-radius:999px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15)}
.ask-launch:hover{filter:brightness(1.05)}
.ask-launch:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.ask-panel{position:fixed;right:18px;bottom:70px;z-index:50;width:min(400px,calc(100vw - 36px));max-height:min(620px,calc(100vh - 100px));display:none;flex-direction:column;background:var(--bg);border:1px solid var(--rule);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.18);overflow:hidden}
.ask-panel[data-open="true"]{display:flex}
.ask-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid var(--rule);background:var(--surface)}
.ask-head b{font-size:15px}
.ask-head button{appearance:none;border:0;background:transparent;font:inherit;font-size:13px;color:var(--muted);cursor:pointer;padding:4px 6px;border-radius:4px}
.ask-head button:hover{color:var(--ink)}
.ask-intro{margin:0;padding:10px 12px;font-size:13px;color:var(--muted);border-bottom:1px solid var(--rule)}
.ask-rules{display:none;margin:0;padding:10px 12px;font-family:var(--mono);font-size:11.5px;white-space:pre-wrap;color:var(--ink);background:var(--surface);border-bottom:1px solid var(--rule);max-height:200px;overflow:auto}
.ask-rules[data-open="true"]{display:block}
.ask-log{flex:1;overflow:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;min-height:120px}
.ask-msg{max-width:92%;padding:8px 10px;border-radius:10px;font-size:14px;line-height:1.4;white-space:pre-wrap}
.ask-msg.user{align-self:flex-end;background:var(--soft);border:1px solid var(--soft2)}
.ask-msg.bot{align-self:flex-start;background:var(--surface);border:1px solid var(--rule)}
.ask-msg.note{align-self:stretch;background:transparent;border:1px dashed var(--rule);color:var(--muted);font-size:13px}
.ask-starters{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px}
.ask-starters button{appearance:none;border:1px solid var(--rule);background:var(--bg);font:inherit;font-size:12.5px;color:var(--ink);padding:4px 9px;border-radius:999px;cursor:pointer}
.ask-starters button:hover{border-color:var(--accent)}
.ask-form{display:flex;gap:6px;padding:10px 12px;border-top:1px solid var(--rule)}
.ask-form textarea{flex:1;resize:none;font:inherit;font-size:14px;padding:8px 10px;border:1px solid var(--rule);border-radius:8px;background:var(--bg);color:var(--ink);min-height:40px;max-height:120px}
.ask-form button{appearance:none;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);font:inherit;font-weight:700;padding:0 14px;border-radius:8px;cursor:pointer}
.ask-form button:disabled{opacity:.5;cursor:default}
@media (max-width:640px){.ask-panel{right:10px;left:10px;width:auto;bottom:66px}.ask-launch{right:12px;bottom:12px}}
footer{margin-top:30px;padding-top:12px;border-top:1px solid var(--rule);color:var(--muted);font-size:13.5px}
footer p{margin:0 0 4px}
.disclosure{color:var(--ink)}

@media (max-width:640px){
  /* bottom padding keeps the floating Ask button clear of the last lines of the page */
  body{font-size:15.5px;padding-top:20px;padding-bottom:76px}
  h1{font-size:27px}
  .dg{display:none}
  .dg-list{display:block}
  .gcard.wide{grid-template-columns:1fr}
  .hint{margin-left:0;flex-basis:100%}
  .tiles{gap:8px}
  .tile{padding:10px}
  .tile .num{font-size:22px}
  .tile .lbl{font-size:12.5px}
  .results li{grid-template-columns:1fr}
  .results .src{max-width:none}
  .certs{columns:1}
  .src{white-space:normal;max-width:100%}
}

@media print{
  @page{size:Letter;margin:0.55in}
  html,body{background:#fff;max-width:none;padding:0;margin:0;font-family:var(--print-sans);font-size:9.1pt;line-height:1.18;color:#000}
  /* The PDFs keep their own look: Calibri and orange rules */
  .controls,.cta,.ask-launch,.ask-panel,.screen-only{display:none !important}
  .print-note{display:block;margin:0;font-size:8pt;color:#444}
  .print-url{display:inline}
  #proof{display:block}
  .proof{list-style:none;padding:0;margin:0}
  .proof li{margin:0 0 1pt}
  .proof a{white-space:nowrap}
  .top{padding-bottom:4pt;margin-bottom:2pt;border-bottom:1.5pt solid var(--accent)}
  h1{font-size:21pt;margin:0 0 1pt}
  .tag{font-size:10.5pt;margin:0 0 2pt}
  .contact{margin:0 0 1pt}
  section{margin:0 0 3pt}
  h2{font-size:9.2pt;margin:5pt 0 2pt;padding-bottom:1pt;border-bottom-color:var(--accent);break-after:avoid}
  p{margin:0 0 2pt}
  ul,ol{margin:0 0 2pt;padding-left:16pt}
  li{margin:0 0 1.5pt;break-inside:avoid}
  li::marker{color:var(--accent)}
  /* Source tags stay on the web page: in a PDF's text layer they splice into the sentences beside them. */
  .src,.srcline{display:none}
  .results li{display:block;padding:2pt 0;border-bottom:0.5pt solid #ddd}
  .job{margin:4.5pt 0 0.5pt;break-after:avoid}
  .job .co{font-size:10.5pt}
  .roles{margin:0 0 2pt;break-after:avoid}
  .certs{columns:2;column-gap:18pt}
  .certs li{margin:0 0 1.5pt}
  .dg,.dg-list,.pipeline,.links,#ai-practice > p:first-of-type,#gallery{display:none}
  .practice{columns:2;column-gap:14pt}
  .practice li{break-inside:avoid}
  .practice li{padding-left:10pt}
  .practice li::before{top:.5em;width:4pt;height:4pt;background:var(--accent)}
  .pipeline{padding:4pt 6pt;margin:3pt 0 3pt;font-size:7.6pt;background:#fff;border:0.5pt solid #ccc}
  .pipeline li{margin:0 0 1pt}
  .links a{border:0}
  body.ai *{opacity:1 !important;outline:none !important;background:transparent}
  footer{margin-top:5pt;padding-top:3pt;font-size:7.6pt;border-top:0.75pt solid var(--accent)}
  a{border:0;color:#000}
}
</style>
</head>
<body class="tech">
`;

const header = `
<header>
  <div class="top">
    <div>
      <h1>${esc(C.name)}</h1>
      <p class="tag">${pair(C.tagline)}</p>
      <p class="contact">${esc(C.contact[0])} · <a href="mailto:${esc(C.contact[1])}">${esc(C.contact[1])}</a> · <a href="https://www.linkedin.com/in/deanfinkelstein/">${esc(C.contact[2])}</a><span class="print-url"> · <a href="${esc(C.site.href)}">${esc(C.site.label)}</a></span></p>
      <p class="avail">${esc(C.availability)}</p>
      <p class="cta"><a class="btn primary" href="mailto:${attr(C.contact[1])}">Email Dean</a><a class="btn" href="${attr(encodeURI(PDF_TECH))}" download>Download PDF (Technical)</a><a class="btn" href="${attr(encodeURI(WORD))}" download>Download Word</a></p>
      <p class="print-note"><span class="p">Plain English version. The Technical version and the source for each claim are on the web page.</span><span class="t">Technical version. The Plain English version and the source for each claim are on the web page.</span></p>
    </div>
  </div>
  <div class="controls">
    <span class="mode"><span class="mode-label" id="mode-label">Mode:</span>
    <span class="toggle" role="group" aria-labelledby="mode-label">
      <button type="button" id="btn-tech" aria-pressed="true">Technical</button>
      <button type="button" id="btn-plain" aria-pressed="false">Plain English</button>
    </span></span>
    <button type="button" class="btn" id="btn-ai" aria-pressed="false">Show the AI work</button>
    <button type="button" class="btn" id="btn-copy" aria-describedby="copy-desc">Copy for your AI assistant</button>
    <span class="sr-only" id="copy-desc">Copies this resume as plain Markdown in the version currently shown, for whatever AI tool you use.</span>
    <span class="hint">Same resume, two ways to read it. Each claim notes its source.</span>
  </div>
</header>
`;

const summarySec = `
<section id="summary">
  <h2>Summary</h2>
  <p>${pair(C.summary)}</p>
  <p class="srcline">${src('Sources: ' + C.summary.src)}</p>
</section>
`;

const resultsSec = `
<section id="results">
  <h2>Selected Results</h2>
  <div class="tiles screen-only">
${C.metrics.map(m => `    <div class="tile${m.ai ? ' ai' : ''}"><div class="num">${esc(m.n)}</div><div class="lbl">${pair(m)}</div></div>`).join('\n')}
  </div>
  <ol class="results">
${C.highlights.map(h => `    <li${aiCls(h)}><span class="claim">${pair(h)}</span>${src(h.src, h.srcHref)}</li>`).join('\n')}
  </ol>
</section>
`;

const skillsSec = `
<section id="skills">
  <h2>Core Skills</h2>
${C.skills.map(s => `  <p class="skill${s.ai ? ' ai' : ''}"><span class="lab"><span class="t">${esc(s.label.t)}:</span><span class="p">${esc(s.label.p)}:</span></span> ${pair(s)}</p>`).join('\n')}
</section>
`;

// Inline diagram of the daily loop. Facts only: inputs, the tooling, outputs, the two working rules.
// The same facts feed the SVG (wide screens) and the stacked list that replaces it below 640 px.
const dgInputs = [
  ['Daily work', 'meetings, tickets, notes, decisions'],
  ['Client org metadata', 'pulled through VS Code'],
  ['Audit document', '244 lines of findings'],
  ['Form requirements', 'Sheet, Doc, or PDF'],
];
const dgOutputs = [
  ['COPs, daily notes, tasks', 'kept current, every day'],
  ['Package impact analysis', 'every piece of metadata touched'],
  ['96 ClickUp tasks', 'in about ten minutes, was half a day'],
  ['Ready-to-run form prompt', 'SharinPix, backed up first'],
];
const dgTools = ['MCP (ClickUp, client org)', 'Obsidian: the Thor agent', 'reusable skills'];
const dgRules = ['Rule 1: let the agent ask questions before it acts', 'Rule 2: back up first'];
const dgShared = 'Shared with the team: the pattern, demos, and a client AI-security briefing, now a template';
const dgCaption = 'Source: 2026 self-evaluation. Client names left off on purpose.';
const box = (x, y, [l1, l2], cls = 'box') => `
    <rect class="${cls}" x="${x}" y="${y}" width="228" height="44" rx="6"/>
    <text class="lbl" x="${x + 12}" y="${y + 18}">${esc(l1)}</text>
    <text class="sub" x="${x + 12}" y="${y + 34}">${esc(l2)}</text>`;
const dgItems = list => list.map(([l1, l2]) => `<li><b>${esc(l1)}</b><span>${esc(l2)}</span></li>`).join('');
const diagramList = `
  <div class="dg-list">
    <div class="dg-step"><h3>Inputs</h3><ul>${dgItems(dgInputs)}</ul></div>
    <div class="dg-arrow" aria-hidden="true">&#8595;</div>
    <div class="dg-step core"><h3>Claude Code</h3><ul>${dgTools.map(t => `<li>+ ${esc(t)}</li>`).join('')}${dgRules.map(r => `<li class="rule">${esc(r)}</li>`).join('')}<li><span>${esc(dgShared)}</span></li></ul></div>
    <div class="dg-arrow" aria-hidden="true">&#8595;</div>
    <div class="dg-step"><h3>Outputs</h3><ul>${dgItems(dgOutputs)}</ul></div>
    <p class="cap">${esc(dgCaption)}</p>
  </div>`;
const diagram = `
  <svg class="dg" viewBox="0 0 840 340" role="img" aria-labelledby="dg-title dg-desc">
    <title id="dg-title">How the AI tooling loop runs</title>
    <desc id="dg-desc">Inputs on the left (daily work, client org metadata, an audit document, form requirements) flow into Claude Code with MCP, Obsidian, and reusable skills, and out to kept-current notes and tasks, a package impact analysis, 96 ClickUp tasks, and a ready-to-run form prompt. Two rules sit in the middle: let the agent ask questions before it acts, and back up first.</desc>
    <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9aa5ad"/></marker></defs>
    ${dgInputs.map((b, i) => box(14, 22 + 74 * i, b)).join('')}
    <rect class="core" x="318" y="22" width="204" height="266" rx="8"/>
    <text class="ttl" x="420" y="52" text-anchor="middle">Claude Code</text>
    <text class="sub" x="420" y="76" text-anchor="middle">+ MCP (ClickUp, client org)</text>
    <text class="sub" x="420" y="94" text-anchor="middle">+ Obsidian: the Thor agent</text>
    <text class="sub" x="420" y="112" text-anchor="middle">+ reusable skills</text>
    <line class="ln" x1="338" y1="130" x2="502" y2="130"/>
    <text class="rule" x="420" y="152" text-anchor="middle">Rule 1: let the agent ask questions</text>
    <text class="rule" x="420" y="168" text-anchor="middle">before it acts</text>
    <text class="rule" x="420" y="192" text-anchor="middle">Rule 2: back up first</text>
    <line class="ln" x1="338" y1="210" x2="502" y2="210"/>
    <text class="sub" x="420" y="232" text-anchor="middle">Shared with the team:</text>
    <text class="sub" x="420" y="248" text-anchor="middle">the pattern, demos, and a client</text>
    <text class="sub" x="420" y="264" text-anchor="middle">AI-security briefing, now a template</text>
    ${dgOutputs.map((b, i) => box(598, 22 + 74 * i, b)).join('')}
    <line class="ln" x1="242" y1="44" x2="316" y2="80" marker-end="url(#ar)"/>
    <line class="ln" x1="242" y1="118" x2="316" y2="130" marker-end="url(#ar)"/>
    <line class="ln" x1="242" y1="192" x2="316" y2="180" marker-end="url(#ar)"/>
    <line class="ln" x1="242" y1="266" x2="316" y2="230" marker-end="url(#ar)"/>
    <line class="ln" x1="524" y1="80" x2="596" y2="44" marker-end="url(#ar)"/>
    <line class="ln" x1="524" y1="130" x2="596" y2="118" marker-end="url(#ar)"/>
    <line class="ln" x1="524" y1="180" x2="596" y2="192" marker-end="url(#ar)"/>
    <line class="ln" x1="524" y1="230" x2="596" y2="266" marker-end="url(#ar)"/>
    <text class="cap" x="420" y="322" text-anchor="middle">${esc(dgCaption)}</text>
  </svg>`;

const aiSec = `
<section id="ai-practice">
  <h2><span class="t">${esc(C.aiPractice.heading.t)}</span><span class="p">${esc(C.aiPractice.heading.p)}</span></h2>
  <p>${pair(C.aiPractice.intro)}</p>
${diagram}${diagramList}
  <ul class="practice">
${C.aiPractice.items.map(i => `    <li class="ai">${pair(i)}</li>`).join('\n')}
  </ul>
  <p class="srcline">${src('Source: ' + C.aiPractice.src)}</p>
</section>
`;

// Print only: three links a forwarded PDF can follow back to the work.
const proofSec = `
<section id="proof">
  <h2>${esc(C.proof.heading)}</h2>
  <ul class="proof">
${C.proof.items.map(i => `    <li><b>${pair(i.label)}:</b> ${pair(i)} <a href="${esc(i.href)}">${esc(i.href.replace(/^https:\/\//, '').replace(/\/$/, ''))}</a></li>`).join('\n')}
  </ul>
</section>
`;

const shown = C.gallery.filter(g => g.ready);
const gallerySec = !shown.length ? '' : `
<section id="gallery">
  <h2><span class="t">Gallery: Built in Public</span><span class="p">See It Working</span></h2>
  <p class="srcline"><span class="t">Fresh builds in an Agentforce Developer Edition org. Code, run logs, and redacted output for each.</span><span class="p">Things Dean built from scratch in a practice Salesforce account, with the code and the results from a real run.</span></p>
  <div class="gallery">
${shown.map(g => {
  const text = `<h3>${pair(g.title)}</h3><p>${pair(g.what)}</p><p class="proof">${esc(g.proof)}</p><a class="open" href="${esc(g.href)}">Open</a>`;
  if (!g.video) return `    <article class="gcard">${text}</article>`;
  // A card with a demo spans the row: text on the left, the recording on the right (stacked on phones).
  const v = g.video;
  return `    <article class="gcard wide"><div class="gtext">${text}</div><figure><video controls muted playsinline preload="metadata" width="1268" height="1068" poster="${attr(v.poster)}" aria-describedby="${g.key}-cap"><source src="${attr(v.src)}" type="video/mp4"><a href="${attr(v.src)}">Download the demo (MP4)</a></video><figcaption id="${g.key}-cap">${esc(v.caption)}</figcaption></figure></article>`;
}).join('\n')}
  </div>
</section>
`;

const expSec = `
<section id="experience">
  <h2>Experience</h2>
${C.experience.map((j, i) => `
  <div class="jobwrap${j.collapsed ? ' collapsed' : ''}">
  <div class="job"><span><span class="co">${esc(j.company)}</span> <span class="note">· ${pair(j.note)}</span></span><span class="dates">${esc(j.dates)}</span></div>
  <p class="roles">${esc(j.roles)}${j.src ? ' ' + src(j.src) : ''}</p>${j.collapsed ? `
  <button type="button" class="job-toggle screen-only" aria-expanded="false" aria-controls="job-${i}">Show details</button>` : ''}
  <ul class="job-body" id="job-${i}">
${j.bullets.map(b => `    <li${aiCls(b)}>${pair(b)}${b.src ? src(b.src, b.srcHref) : ''}</li>`).join('\n')}
  </ul>
  </div>`).join('\n')}
</section>
`;

const certSec = `
<section id="certifications">
  <h2>Salesforce Certifications</h2>
  <ul class="certs">
${C.certifications.map(c => `    <li${aiCls(c)}>${esc(c.name.replace(/^Salesforce Certified /, ''))}, ${esc(c.date)}</li>`).join('\n')}
  </ul>
  <p${aiCls(C.certNote)}>${pair(C.certNote)}${src(C.certNote.src, C.certNote.srcHref)}</p>
</section>
`;

const eduSec = `
<section id="education">
  <h2>Education</h2>
  <ul>
${C.education.map(e => `    <li>${esc(e.text)}${src(e.src)}</li>`).join('\n')}
  </ul>
</section>
`;

const builtSec = `
<section id="built">
  <h2>${esc(C.builtWith.heading)}</h2>
  <p>${pair(C.builtWith.body)}</p>
  <ul class="pipeline">
${C.builtWith.pipeline.map(p => `    <li>${esc(p)}</li>`).join('\n')}
  </ul>
  <ul class="links">
${C.builtWith.links.map(l => `    <li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('\n')}
  </ul>
</section>
`;

const footer = `
<footer>
  <p class="disclosure">${pair(C.disclosure)}</p>
  <p class="screen-only"><span class="p">How to read this page: every line is written twice, once in plain words and once for Salesforce people. The switch at the top flips between them. The small tags show where each claim comes from.</span><span class="t">How to read this page: every line is written twice, once for Salesforce people and once in plain words. The switch at the top flips between them. The small tags show the source of each claim.</span></p>
<p>Last updated ${today}.</p>
</footer>
<button type="button" class="ask-launch" id="ask-launch" aria-expanded="false" aria-controls="ask-panel">${esc(C.ask.label)}</button>
<section class="ask-panel" id="ask-panel" data-open="false" role="dialog" aria-label="${esc(C.ask.label)}">
  <div class="ask-head"><b>${esc(C.ask.label)}</b><span><button type="button" id="ask-how">How this works</button><button type="button" id="ask-close" aria-label="Close">Close</button></span></div>
  <p class="ask-intro">${pair(C.ask.intro)}</p>
  <pre class="ask-rules" id="ask-rules" data-open="false"></pre>
  <div class="ask-log" id="ask-log" aria-live="polite"></div>
  <div class="ask-starters" id="ask-starters">${C.ask.starters.map(q => `<button type="button">${esc(q)}</button>`).join('')}</div>
  <form class="ask-form" id="ask-form"><textarea id="ask-input" rows="1" maxlength="1000" placeholder="Ask about Dean" aria-label="Your question"></textarea><button type="submit" id="ask-send">Send</button></form>
</section>
<script>
(function(){
  var ASK=${JSON.stringify({ endpoint: C.ask.endpoint, offline: C.ask.offline })};
  var launch=document.getElementById('ask-launch'), panel=document.getElementById('ask-panel'), log=document.getElementById('ask-log');
  var form=document.getElementById('ask-form'), input=document.getElementById('ask-input'), send=document.getElementById('ask-send');
  var rules=document.getElementById('ask-rules'), how=document.getElementById('ask-how'), starters=document.getElementById('ask-starters');
  var history=[]; var busy=false; var rulesLoaded=false;
  function add(kind,text){var d=document.createElement('div');d.className='ask-msg '+kind;d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight;return d;}
  function open(on){panel.setAttribute('data-open',on?'true':'false');launch.setAttribute('aria-expanded',on?'true':'false');if(on){if(!log.children.length&&!ASK.endpoint){add('note',ASK.offline);}input.focus();}}
  launch.addEventListener('click',function(){open(panel.getAttribute('data-open')!=='true');});
  document.getElementById('ask-close').addEventListener('click',function(){open(false);});
  how.addEventListener('click',function(){
    var on=rules.getAttribute('data-open')!=='true'; rules.setAttribute('data-open',on?'true':'false');
    if(on&&!rulesLoaded){rules.textContent='Loading the rules...';
      if(!ASK.endpoint){rules.textContent='Rules are published with the code: gallery/05-ask-this-resume/worker/src/rules.txt';rulesLoaded=true;return;}
      fetch(ASK.endpoint+'/prompt').then(function(r){return r.text();}).then(function(t){rules.textContent=t;rulesLoaded=true;}).catch(function(){rules.textContent='Could not load the rules right now. They are published with the code in the gallery folder.';});}
  });
  starters.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;input.value=b.textContent;form.requestSubmit?form.requestSubmit():send.click();});
  input.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit?form.requestSubmit():send.click();}});
  form.addEventListener('submit',function(e){
    e.preventDefault(); var q=input.value.trim(); if(!q||busy)return;
    if(!ASK.endpoint){add('user',q);add('note',ASK.offline);input.value='';return;}
    busy=true;send.disabled=true;add('user',q);input.value='';starters.style.display='none';
    var thinking=add('bot','...');
    var register=document.body.classList.contains('tech')?'tech':'plain';
    fetch(ASK.endpoint+'/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q,history:history.slice(-8),register:register})})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,status:r.status,body:j};});})
      .then(function(res){
        var text=(res.body&&res.body.answer)||'No answer came back. Email Dean at finkelstein.dean@gmail.com.';
        thinking.textContent=text;
        if(res.ok){history.push({role:'user',content:q});history.push({role:'assistant',content:text});}
      })
      .catch(function(){thinking.textContent='Could not reach the assistant. Email Dean at finkelstein.dean@gmail.com.';})
      .then(function(){busy=false;send.disabled=false;input.focus();});
  });
  if(location.hash==='#ask'){open(true);}
})();
</script>
<script type="application/json" id="md-plain">${jsonSafe(mdPlain)}</script>
<script type="application/json" id="md-tech">${jsonSafe(mdTech)}</script>
<script>
(function(){
  var body=document.body;
  var bt=document.getElementById('btn-tech');
  var bp=document.getElementById('btn-plain');
  var ba=document.getElementById('btn-ai');
  var bc=document.getElementById('btn-copy');
  var aiCount=document.querySelectorAll('.ai:not(.tile)').length;
  function setReg(reg){
    var tech=(reg==='tech');
    if(tech){body.classList.add('tech');}else{body.classList.remove('tech');}
    bt.setAttribute('aria-pressed',tech?'true':'false');
    bp.setAttribute('aria-pressed',tech?'false':'true');
  }
  function setAI(on){
    if(on){body.classList.add('ai');}else{body.classList.remove('ai');}
    ba.setAttribute('aria-pressed',on?'true':'false');
    ba.textContent=on?'Show everything':'Show the AI work ('+aiCount+')';
  }
  function copyText(text,done){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){done(true);},function(){done(fallback(text));});
    }else{done(fallback(text));}
  }
  function fallback(text){
    var ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');
    ta.style.position='fixed';ta.style.top='-1000px';document.body.appendChild(ta);ta.select();
    var ok=false;try{ok=document.execCommand('copy');}catch(e){ok=false;}
    document.body.removeChild(ta);return ok;
  }
  Array.prototype.forEach.call(document.querySelectorAll('.job-toggle'),function(b){
    b.addEventListener('click',function(){
      var open=!b.parentNode.classList.toggle('collapsed');
      b.setAttribute('aria-expanded',open?'true':'false');
      b.textContent=open?'Hide details':'Show details';
    });
  });
  bt.addEventListener('click',function(){setReg('tech');});
  bp.addEventListener('click',function(){setReg('plain');});
  ba.addEventListener('click',function(){setAI(!body.classList.contains('ai'));});
  bc.addEventListener('click',function(){
    var id=body.classList.contains('tech')?'md-tech':'md-plain';
    var text=JSON.parse(document.getElementById(id).textContent);
    var label=bc.textContent;
    copyText(text,function(ok){
      bc.textContent=ok?'Copied as Markdown':'Copy failed, select the page instead';
      setTimeout(function(){bc.textContent=label;},1800);
    });
  });
  setAI(false);
  if(location.hash==='#plain'){setReg('plain');}
  if(location.hash==='#ai'){setAI(true);}
})();
</script>
</body>
</html>
`;

// ---------------------------------------------------------------- link-preview card and favicon
// og-card.html is rendered to og-card.png (1200x630) with headless Chrome; see README.md. Same type, colors, and rule as the page.
const tagParts = C.tagline.t.split('|').map(s => s.trim());
const ogCard = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Link preview card</title>
<style>
html,body{margin:0}
body{width:1200px;height:630px;overflow:hidden;background:#f3f4f6;font-family:Calibri,Carlito,"Segoe UI",Arial,sans-serif;color:#1f2328}
.card{position:absolute;top:36px;right:56px;bottom:36px;left:56px;box-sizing:border-box;background:#fff;border-radius:14px;padding:52px 64px 48px;display:flex;flex-direction:column}
.url{align-self:flex-start;padding:4px 14px;border-radius:999px;background:#fff7ee;border:1px solid #f0d2b3;color:#7a4a12;font-family:ui-monospace,Consolas,"Liberation Mono",monospace;font-size:22px}
h1{font-size:92px;line-height:1;margin:30px 0 0;padding-bottom:20px;border-bottom:5px solid ${ACCENT}}
.tag{margin:24px 0 0;font-size:38px;font-weight:700;color:${ACCENT_TEXT}}
.tag2{margin:8px 0 0;font-size:32px;font-weight:700;color:#1f2328}
.more{margin-top:auto;font-size:25px;color:#5b6670}
</style>
</head>
<body><div class="card">
<div class="url">${esc(C.site.label)}</div>
<h1>${esc(C.name)}</h1>
<div class="tag">${esc(tagParts[0])}</div>
<div class="tag2">${tagParts.slice(1).map(esc).join(' &middot; ')}</div>
<div class="more">Resume with a source for each claim &middot; PDF and Word copies &middot; Gallery of ${shown.length} AI builds</div>
</div></body>
</html>
`;
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${ACCENT}"/><text x="32" y="42.5" text-anchor="middle" font-family="Calibri, Carlito, 'Segoe UI', Arial, sans-serif" font-size="29" font-weight="700" fill="#111">DF</text></svg>\n`;

const html = head + header + '<main>' + summarySec + resultsSec + skillsSec + aiSec + proofSec + gallerySec + expSec + certSec + eduSec + builtSec + '</main>' + footer;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'Dean Finkelstein - Resume.html'), html, 'utf8');
fs.writeFileSync(path.join(outDir, 'resume.json'), JSON.stringify(resumeJson, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(outDir, 'resume-plain.md'), mdPlain + '\n', 'utf8');
fs.writeFileSync(path.join(outDir, 'resume-technical.md'), mdTech + '\n', 'utf8');
fs.writeFileSync(path.join(outDir, 'og-card.html'), ogCard, 'utf8');
fs.writeFileSync(path.join(outDir, 'favicon.svg'), favicon, 'utf8');
// text dump of both registers for QA scans
const dump = [];
const walk = o => {
  if (o == null) return;
  if (typeof o === 'string') { dump.push(o); return; }
  if (Array.isArray(o)) { o.forEach(walk); return; }
  if (typeof o === 'object') { Object.values(o).forEach(walk); }
};
walk({ n: C.name, c: C.contact, a: C.availability, t: C.tagline, s: C.summary, h: C.highlights, k: C.skills, ai: C.aiPractice, gal: C.gallery, pr: C.proof, e: C.experience, ce: C.certifications, cn: C.certNote, ed: C.education, b: C.builtWith, d: C.disclosure });
fs.writeFileSync(path.join(outDir, 'web-resume-text.txt'), dump.join('\n'), 'utf8');
console.log('wrote Dean Finkelstein - Resume.html (' + html.length + ' chars), resume.json, two Markdown copies, og-card.html, favicon.svg, and web-resume-text.txt to ' + outDir);
