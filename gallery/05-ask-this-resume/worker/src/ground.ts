// Turns resume.json (the same file the resume page is built from) into the grounding text for the assistant.
// Both registers are included so the assistant can answer at the reader's level.

type Pair = { t: string; p: string; src?: string; ai?: boolean };
type Skill = Pair & { label: Pair };
type Job = { company: string; note: Pair; dates: string; roles: string; src?: string; bullets: Pair[] };
type Cred = { name: string; date: string; id?: string };

export interface Resume {
  generated: string;
  name: string;
  contact: string[];
  availability: string;
  tagline: Pair;
  summary: Pair & { src: string };
  highlights: Pair[];
  skills: Skill[];
  aiPractice: { heading: Pair; intro: Pair; items: Pair[]; src: string };
  experience: Job[];
  certifications: Cred[];
  certNote: Pair & { src: string };
  education: { text: string; src: string }[];
  builtWith: { heading: string; body: Pair; pipeline: string[] };
  disclosure: Pair;
  gallery?: { title: Pair; what: Pair; proof: string; href: string; video?: { src: string; caption: string } }[];
}

function render(r: Resume, reg: 't' | 'p'): string {
  const g = (o: Pair) => o[reg];
  const L: string[] = [];
  L.push(`# ${r.name}`, g(r.tagline), r.contact.join(' | '), r.availability, '');
  L.push('## Summary', g(r.summary), `Sources: ${r.summary.src}`, '');
  L.push('## Selected results');
  for (const h of r.highlights) L.push(`- ${g(h)} (source: ${h.src ?? 'resume'})`);
  L.push('', '## Core skills');
  for (const s of r.skills) L.push(`- ${g(s.label)}: ${g(s)}`);
  L.push('', `## ${g(r.aiPractice.heading)}`, g(r.aiPractice.intro));
  for (const i of r.aiPractice.items) L.push(`- ${g(i)}`);
  L.push(`Source: ${r.aiPractice.src}`, '');
  if (r.gallery?.length) {
    L.push('## Gallery (built from scratch in a practice Salesforce org)');
    for (const a of r.gallery) L.push(`- ${g(a.title)}: ${g(a.what)} (${a.proof})${a.video ? ` Demo video on the page: ${a.video.caption}` : ''}`);
    L.push('');
  }
  L.push('## Experience');
  for (const j of r.experience) {
    L.push(`### ${j.company} (${g(j.note)}), ${j.dates}`, `${j.roles}${j.src ? ` (${j.src})` : ''}`);
    for (const b of j.bullets) L.push(`- ${g(b)}${b.src ? ` (source: ${b.src})` : ''}`);
    L.push('');
  }
  L.push('## Certifications');
  for (const c of r.certifications) L.push(`- ${c.name}, ${c.date}${reg === 't' && c.id ? `, credential ID ${c.id}` : ''}`);
  L.push(g(r.certNote), '', '## Education');
  for (const e of r.education) L.push(`- ${e.text} (${e.src})`);
  L.push('', `## ${r.builtWith.heading}`, g(r.builtWith.body), '', g(r.disclosure));
  return L.join('\n');
}

export function groundingText(r: Resume): string {
  return [
    '=== TECHNICAL VERSION ===',
    render(r, 't'),
    '',
    '=== PLAIN ENGLISH VERSION ===',
    render(r, 'p'),
    '',
    `Resume data generated ${r.generated}. Client names are left off on purpose.`,
  ].join('\n');
}
