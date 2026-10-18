# Rebuilding the resume

Every line of the resume lives in `content.js`, once in Technical (`t`) and once in Plain English (`p`), with a source note (`src`) for each claim. Edit the text there, then rebuild:

```
npm install docx@9.5.1
node build-web-resume.js out
node build-resume.js out
```

- `build-web-resume.js` writes `Dean Finkelstein - Resume.html` (the web page with the Plain English | Technical switch, the Show-the-AI-work mode, the source tags, the AI tooling diagram, the How-this-page-was-built section, and the copy-as-Markdown button), plus `resume.json` (the same content for machines; keep it beside the page) and two Markdown copies. Open the page with `#technical` to start in Technical or `#ai` to start in AI mode. Items flagged `ai: true` in `content.js` light up in AI mode.
- `build-resume.js` writes `Dean Finkelstein - Resume.docx`, the plain Word copy (Technical, no source tags) for ATS uploads.

To make the PDFs, print the web page from Chrome (Letter, headers and footers off) once with each version switched on, or with headless Chrome:

```
chrome --headless=new --no-pdf-header-footer --print-to-pdf="out/plain.pdf" "file:///<path>/Dean Finkelstein - Resume.html"
chrome --headless=new --no-pdf-header-footer --print-to-pdf="out/technical.pdf" "file:///<path>/Dean Finkelstein - Resume.html#technical"
```

Before sending anything, run `python qa.py <file>` on the output. It flags em-dashes, the avoid-list words, and client names. Rules the content follows: no em-dashes, none of the avoid-list words, every quote verbatim, every number sourced, no client names or client contacts.

To retarget for a posting, change the tagline, the summary, and the order of Selected Results first.
