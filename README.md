# Dean Finkelstein: resume and AI tooling gallery

Live page: **[deanfinkelstein.github.io/resume](https://deanfinkelstein.github.io/resume/)**

This repo holds Dean Finkelstein's resume as a web page, the PDF and Word copies built from the same source, and a gallery of five AI builds. Dean is a Salesforce Managed Services team lead. Each gallery item has its code or source files, a README that says what it does and how it was tested, and proof from a real run. The Salesforce builds ran in a Developer Edition org.

## A 60-second tour

1. **[Agentforce resume agent](gallery/01-agentforce-resume-agent/).** An Agentforce service agent written in Agent Script, with four Apex actions and their tests, that answers questions about Dean from data in the org and saves a message for him as a Lead. Watch the 75-second `demo.mp4` at the top of its README, then read `TEST-LOG.md`: a 16-case test plan run against the live agent four times, and what each run caught.
2. **[Ask this resume](gallery/05-ask-this-resume/).** The chat button on the resume page. A Cloudflare Worker in TypeScript calls Claude with `resume.json` as its only grounding, under rules anyone can read (`worker/src/rules.txt`, also served at `/prompt`). The README's guardrails table and live test log are the parts to read.
3. **[Org audit to tasks](gallery/02-org-audit-to-tasks/).** A read-only org audit that writes findings, shapes them into prioritized tasks with acceptance criteria, and creates them as GitHub issues once a person approves the list. `out/findings.md` and `out/issues-preview.md` are the output of the run.
4. **[Pre-refresh risk scan](gallery/03-pre-refresh-risk-scan/).** Lists everything a sandbox refresh would wipe or break, with an owner column and the manual checks the API cannot see. `out/refresh-risk-checklist.md` is the redacted checklist from the run.
5. **[Adopting AI safely in a Salesforce shop](gallery/04-adopting-ai-safely/).** A one-page briefing for an IT lead: who can log in, where the data goes, and what it costs. `BRIEFING.pdf` is the page; the facts are checked against eight sources listed at its foot.

## How the build works

- `build/content.js` holds every line of the resume twice, once in Technical terms (`t`) and once in Plain English (`p`), with a source (`src`) for each claim.
- `node build/build-web-resume.js out` writes the web page, `resume.json` (the same content for machines), two Markdown copies, the favicon, and the HTML for the link-preview card (rendered to `og-card.png` with headless Chrome).
- `node build/build-resume.js out` writes the Word copy for applicant tracking systems. It needs the `docx` package (9.5.1), which is installed separately for now.
- The two PDFs are printed from the web page with headless Chrome, once per version. Each must fit on two Letter pages.
- `index.html` is a copy of `Dean Finkelstein - Resume.html`, so GitHub Pages serves the page at the root.
- `build/qa.py` is run on every output before it is published. It flags em-dashes and en-dashes, a list of filler words, and client names, reads PDFs and Word files as well as text, and exits 1 on any hit. The client name list is a local file that is never committed, so without it the scan exits 2 instead of passing.
- `resume.json` also feeds the chat Worker's grounding (`npm run sync` in the Worker folder) and the Agentforce agent's seed data (`scripts/seed.js`).

The exact commands are in [build/README.md](build/README.md).

## Ground rules

- No client names, client contacts, or client data anywhere. Functional descriptors only.
- Nothing in the gallery runs against a client or employer org. The Salesforce builds use a Developer Edition org.
- Every number has a source and every quote is verbatim.
- Drafted with Claude Code under these rules.

## Files at the root

| File | What it is |
|---|---|
| `index.html`, `Dean Finkelstein - Resume.html` | The web page (the same file twice) |
| `Dean Finkelstein - Resume (Technical).pdf`, `Dean Finkelstein - Resume (Plain English).pdf` | The two printed versions |
| `Dean Finkelstein - Resume.docx` | The Word copy |
| `resume.json` | The resume as structured data |
| `og-card.png`, `favicon.svg` | The link-preview image and the browser tab icon |
| `_config.yml` | Names the site on the Markdown pages GitHub Pages renders, such as the gallery READMEs |
