// Builds Dean's conventional resume twice from one content source:
//   1. Dean Finkelstein - Resume.docx  (docx-js, editable, ATS-safe)
//   2. resume-print.html               (HTML twin, printed to PDF by headless Chrome)
// Usage: node build-resume.js <outDir>
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, TabStopType, AlignmentType, BorderStyle,
  LevelFormat, HeadingLevel,
} = require('docx');

const outDir = process.argv[2] || '.';

// ---------------------------------------------------------------- content
const R = require('./content').T;

// ---------------------------------------------------------------- docx
const ACCENT = 'E69138';
const INK = '1F2328';
const MUTED = '5B6670';
const FONT = 'Calibri';
const PAGE_W = 12240, PAGE_H = 15840, MARGIN = 792; // US Letter, 0.55in margins
const CONTENT_W = PAGE_W - 2 * MARGIN; // 10512

const run = (text, opts = {}) => new TextRun({ text, font: FONT, color: INK, size: 20, ...opts });

function heading(text) {
  return new Paragraph({
    spacing: { before: 150, after: 50 },
    border: { bottom: { color: ACCENT, space: 2, style: BorderStyle.SINGLE, size: 8 } },
    children: [run(text.toUpperCase(), { bold: true, size: 21, color: INK, characterSpacing: 20 })],
    keepNext: true,
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    keepLines: true,
    spacing: { after: 30, line: 252 },
    children: [run(text, opts)],
  });
}

function labelLine(label, text) {
  return new Paragraph({
    spacing: { after: 20, line: 252 },
    children: [run(label + ': ', { bold: true }), run(text)],
  });
}

function jobHeader(job) {
  return [
    new Paragraph({
      spacing: { before: 90, after: 10 },
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
      keepNext: true,
      children: [
        run(job.company, { bold: true, size: 22 }),
        run('  ·  ' + job.note, { color: MUTED }),
        run('\t' + job.dates, { color: MUTED }),
      ],
    }),
    new Paragraph({
      spacing: { after: 50 },
      keepNext: true,
      children: [run(job.roles, { italics: true })],
    }),
  ];
}

const children = [];
// header
children.push(new Paragraph({
  spacing: { after: 20 },
  children: [run(R.name, { bold: true, size: 44, color: INK })],
}));
children.push(new Paragraph({
  spacing: { after: 40 },
  children: [run(R.tagline, { size: 22, color: ACCENT, bold: true })],
}));
children.push(new Paragraph({
  spacing: { after: 20 },
  children: [run(R.contact.join('  ·  '), { color: MUTED })],
}));
children.push(new Paragraph({
  spacing: { after: 60 },
  border: { bottom: { color: ACCENT, space: 4, style: BorderStyle.SINGLE, size: 12 } },
  children: [run(R.availability, { bold: true })],
}));
// summary
children.push(heading('Summary'));
children.push(new Paragraph({ spacing: { after: 40, line: 252 }, children: [run(R.summary)] }));
// highlights
children.push(heading('Selected Results'));
R.highlights.forEach(h => children.push(bullet(h)));
// skills
children.push(heading('Core Skills'));
R.skills.forEach(([l, t]) => children.push(labelLine(l, t)));
// experience
children.push(heading('Experience'));
R.experience.forEach(job => {
  jobHeader(job).forEach(p => children.push(p));
  job.bullets.forEach(b => children.push(bullet(b)));
});
// certifications
children.push(heading('Certifications'));
children.push(new Paragraph({ spacing: { after: 30, line: 252 }, children: [run(R.certifications.join('  ·  '))] }));
children.push(new Paragraph({ spacing: { before: 40, after: 40 }, children: [run(R.certNote)] }));
// education
children.push(heading('Education'));
R.education.forEach(e => children.push(bullet(e)));
// quotes (rendered only if any remain)
if (R.quotes.length) children.push(heading('What Clients and Leadership Say'));
R.quotes.forEach(([q, who]) => {
  children.push(new Paragraph({
    spacing: { after: 6, line: 252 },
    indent: { left: 240 },
    border: { left: { color: ACCENT, space: 8, style: BorderStyle.SINGLE, size: 12 } },
    children: [run(q, { italics: true })],
  }));
  children.push(new Paragraph({
    spacing: { after: 70 },
    indent: { left: 240 },
    border: { left: { color: ACCENT, space: 8, style: BorderStyle.SINGLE, size: 12 } },
    children: [run(who, { color: MUTED, size: 19 })],
  }));
});

const doc = new Document({
  creator: 'Dean Finkelstein',
  title: 'Dean Finkelstein - Resume',
  description: 'Salesforce Managed Services Team Lead, 8x Salesforce Certified',
  styles: {
    default: { document: { run: { font: FONT, size: 20, color: INK } } },
  },
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 340, hanging: 220 } }, run: { color: ACCENT } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
    },
    children,
  }],
});

// ---------------------------------------------------------------- html twin
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Dean Finkelstein - Resume</title>
<style>
@page{size:Letter;margin:0.55in}
html,body{margin:0;padding:0;background:#fff;color:#${INK};font-family:Calibri,Carlito,"Segoe UI",Arial,sans-serif;font-size:10pt;line-height:1.22}
h1{font-size:22pt;margin:0 0 1pt;line-height:1.1}
.tag{color:#${ACCENT};font-weight:700;font-size:11pt;margin:0 0 2pt}
.contact{color:#${MUTED};margin:0 0 1pt}
.avail{font-weight:700;margin:0 0 4pt;padding-bottom:4pt;border-bottom:1.5pt solid #${ACCENT}}
h2{font-size:10pt;letter-spacing:1px;text-transform:uppercase;margin:7pt 0 2pt;padding-bottom:1pt;border-bottom:1pt solid #${ACCENT};break-after:avoid}
p{margin:0 0 3pt}
ul{margin:0 0 2pt;padding-left:17pt}
li{margin:0 0 1.5pt;padding-left:0;break-inside:avoid}
li::marker{color:#${ACCENT}}
.job{display:flex;justify-content:space-between;align-items:baseline;margin:4.5pt 0 0.5pt;break-after:avoid}
.job b{font-size:11pt}
.job .note,.job .dates{color:#${MUTED}}
.roles{font-style:italic;margin:0 0 2.5pt;break-after:avoid}
.skill b{font-weight:700}
.q{border-left:1.5pt solid #${ACCENT};padding-left:8pt;margin:0 0 3pt}
.q .who{color:#${MUTED};font-size:9.5pt}
.cert{margin:2pt 0 2pt}
</style></head><body>
<h1>${esc(R.name)}</h1>
<p class="tag">${esc(R.tagline)}</p>
<p class="contact">${esc(R.contact.join('  ·  '))}</p>
<p class="avail">${esc(R.availability)}</p>
<h2>Summary</h2>
<p>${esc(R.summary)}</p>
<h2>Selected Results</h2>
<ul>${R.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
<h2>Core Skills</h2>
${R.skills.map(([l, t]) => `<p class="skill"><b>${esc(l)}:</b> ${esc(t)}</p>`).join('')}
<h2>Experience</h2>
${R.experience.map(job => `
<div class="job"><span><b>${esc(job.company)}</b> <span class="note">· ${esc(job.note)}</span></span><span class="dates">${esc(job.dates)}</span></div>
<p class="roles">${esc(job.roles)}</p>
<ul>${job.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`).join('')}
<h2>Certifications</h2>
<p>${esc(R.certifications.join('  ·  '))}</p>
<p class="cert">${esc(R.certNote)}</p>
<h2>Education</h2>
<ul>${R.education.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
${R.quotes.length ? '<h2>What Clients and Leadership Say</h2>' : ''}
${R.quotes.map(([q, who]) => `<div class="q"><p><i>${esc(q)}</i></p><p class="who">${esc(who)}</p></div>`).join('')}
</body></html>`;

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(outDir, 'Dean Finkelstein - Resume.docx'), buf);
  fs.writeFileSync(path.join(outDir, 'resume-print.html'), html, 'utf8');
  // plain-text dump for QA scans
  const txt = [R.name, R.tagline, R.contact.join(' '), R.availability, R.summary, ...R.highlights,
    ...R.skills.map(s => s.join(': ')),
    ...R.experience.flatMap(j => [j.company, j.note, j.dates, j.roles, ...j.bullets]),
    ...R.certifications, R.certNote, ...R.education, ...R.quotes.flat()].join('\n');
  fs.writeFileSync(path.join(outDir, 'resume-text.txt'), txt, 'utf8');
  console.log('wrote docx (' + buf.length + ' bytes), html twin, and text dump to ' + outDir);
})();
