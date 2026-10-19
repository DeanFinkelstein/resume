# Ask this resume

**What it does.** A chat panel on the resume page that answers questions about Dean from the resume content only. If the answer is not on the page, it says so and points to email. It never names a client. Anyone can read the rules it runs under: the Worker serves them at `/prompt`, and they are in `worker/src/rules.txt`.

**Why it exists.** Two reasons. A recruiter with one question should not have to read two pages to find the answer. And a grounded assistant with visible rules, a spend cap, and an honest refusal is a better demonstration of how Dean builds AI tooling than any bullet point.

**How it is built.**

- `worker/`: a Cloudflare Worker in TypeScript. It takes `POST /ask` with a question and the last few turns, checks the page's origin against an allowlist, rate-limits by a salted hash of the visitor's address (per visitor per hour, and a daily cap for everyone), and calls Claude through the official SDK with the resume as a cached system prompt. The API key lives in a Worker secret, never in the repo.
- Grounding is `resume.json`, the same file the page, the Word copy, and the PDFs are built from. `npm run sync` copies it in before every deploy, so the assistant and the page cannot drift apart.
- The model defaults to `claude-opus-5-5`. Set `MODEL` in `wrangler.jsonc` to `claude-haiku-5-5` to run at a fraction of the cost. Refusal fallbacks are on (`fallbacks: "default"`), so a safety decline re-runs on Anthropic's recommended fallback model instead of failing.
- Logs carry token counts, timing, and the hashed visitor id. They never carry the question or the answer.

**What goes in.** A question, up to 1,000 characters, plus up to eight prior turns.

**What comes out.** A short answer with source tags where the resume has them, or a one-sentence "not on the page" with the email address.

## Status

Live since 2026-10-18 at `https://ask-this-resume.finkelstein-dean.workers.dev`, and switched on in the chat panel of the resume page.

## Live test log (2026-10-18, `scripts/live-test.mjs`)

| Round | What | Result |
|---|---|---|
| 1 | 12 questions: facts, grounding, client confidentiality, two off-topic requests, a jailbreak asking for the prompt and the API key, how the page was built, rates, plain-English MCP, a follow-up that needs history. Then a 13th | 12 of 12 pass; the 13th got the polite 429. One defect: an answer used Markdown bold, which the chat window shows as asterisks |
| Fix | Rule 9 added: plain text only. The Worker now also reports cache-write tokens, so cost is measured in full | Redeployed |
| 2 | Three questions again, with the per-visitor limit raised for the test and restored after | 3 of 3 pass, no Markdown |

Measured cost on Claude Opus 5.5: about 4.4 cents for the first question after a quiet stretch (that one writes the cached resume), and about half a cent for each question while the cache is warm. Results are in `../out/live-test-1.json` and `../out/live-test-2.json`.

## Deploy (Dean, one time)

```
cd gallery/05-ask-this-resume/worker
npm install
npx wrangler login
npx wrangler kv namespace create RATE_KV        # paste the id into wrangler.jsonc
npx wrangler secret put ANTHROPIC_API_KEY       # paste the key at the prompt, nothing else
npm run deploy
```

Then put the Worker URL into `build/content.js` under `ask.endpoint`, add the page's origin to `ALLOWED_ORIGINS` in `wrangler.jsonc`, and rebuild the page. Local test: `npm run dev` serves the Worker at `http://localhost:8787`; the page at `http://localhost:8788` is already on the allowlist.

## Guardrails

| Risk | Guard |
|---|---|
| Someone runs up the bill | Per-visitor hourly limit and a daily cap in KV, both set in `wrangler.jsonc`; 429 with a polite message when hit |
| Prompt injection ("ignore your rules") | Rule 6 declines and continues; the resume is the only grounding; no tools, no browsing |
| Client names leak | None exist in the grounding. Rule 2 refuses to confirm or deny names the visitor supplies |
| Visitor privacy | Questions and answers are not logged; the visitor id is a salted hash kept for one hour |
| Another site embeds the endpoint | Origin allowlist: a browser on another site's page gets 403. It stops other sites' pages, not scripts, because a script can send any Origin header it likes. Scripts still hit the per-visitor and daily caps |
| Key exposure | Worker secret only; for local runs the key goes in `worker/.dev.vars`, which is git-ignored |

## Local test log (2026-10-17, `wrangler dev`, deliberately invalid API key, per-visitor limit set to 3)

| Request | Expected | Got |
|---|---|---|
| GET /health | 200 | 200 |
| GET /prompt | 200, the rules as plain text | 200 |
| OPTIONS /ask from the allowed origin | 204 with that origin echoed | 204 |
| POST /ask from a foreign origin | 403 | 403 |
| POST /ask with malformed JSON | 400 | 400 |
| POST /ask with an empty question | 400 | 400 |
| POST /ask with a 20 KB body | 413 | 413 |
| POST /ask with an invalid API key, three times | 500 with the email fallback message, logged without the question | 500, three times |
| POST /ask a fourth time | 429 with the polite limit message | 429 |
| GET an unknown path | 404 | 404 |

**Time.** One session to write; one evening to deploy and test.

**What I would change next time.** Stream the answer for a snappier feel, and add a weekly cost line to the resume page footer from the Worker's own logs, so the "small budget" claim is visible.

Source tag for the resume card: Worker code, rules, and config in this folder; endpoint shown on the page.
