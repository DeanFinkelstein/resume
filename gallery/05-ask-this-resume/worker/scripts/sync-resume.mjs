// Copies the resume.json the page is built from into src/ so the Worker is grounded on the same facts.
import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '..', '..', '..', '..', 'resume.json'); // repo root
const dst = path.resolve(here, '..', 'src', 'resume.json');
if (!existsSync(src)) {
  console.error(`resume.json not found at ${src}. Build the resume page first (build/build-web-resume.js).`);
  process.exit(1);
}
copyFileSync(src, dst);
console.log(`synced ${src} -> ${dst}`);
