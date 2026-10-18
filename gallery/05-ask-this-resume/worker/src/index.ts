// Ask this resume: a small Worker that answers questions about Dean from the resume content only.
// POST /ask   {question, history?, register?}  -> {answer, model, usage}
// GET  /prompt -> the rules the assistant runs under (plain text), so anyone can read them
// GET  /health -> {ok: true}
import Anthropic from '@anthropic-ai/sdk';
import rules from './rules.txt';
import resumeJson from './resume.json';
import { groundingText, type Resume } from './ground';

const resume = resumeJson as unknown as Resume;
const GROUNDING = `${rules}\n\n${groundingText(resume)}`; // frozen at build time, so the prompt cache holds

const MAX_BODY_BYTES = 16_000;
const MAX_QUESTION_CHARS = 1_000;
const MAX_HISTORY_TURNS = 8;
const MAX_TURN_CHARS = 2_000;

interface AskBody {
  question?: unknown;
  history?: unknown;
  register?: unknown;
}

type Turn = { role: 'user' | 'assistant'; content: string };

function allowedOrigins(env: Env): string[] {
  return env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
}

function corsHeaders(origin: string, env: Env): Record<string, string> {
  const ok = allowedOrigins(env).includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function parseHistory(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return [];
  const turns: Turn[] = [];
  for (const item of raw.slice(-MAX_HISTORY_TURNS)) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if ((role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim()) {
      turns.push({ role, content: content.slice(0, MAX_TURN_CHARS) });
    }
  }
  // The API requires the first message to be from the user and roles to make sense in sequence.
  while (turns.length && turns[0].role !== 'user') turns.shift();
  return turns;
}

// KV-backed counters: one per visitor per hour, one for everyone per UTC day.
async function overLimit(env: Env, ipHash: string): Promise<{ limited: boolean; retryAfter: number; reason?: string }> {
  const now = new Date();
  const hour = `${now.toISOString().slice(0, 13)}`; // YYYY-MM-DDTHH
  const day = now.toISOString().slice(0, 10);
  const perIp = Number(env.PER_IP_PER_HOUR) || 12;
  const daily = Number(env.DAILY_CAP) || 300;

  const ipKey = `ip:${ipHash}:${hour}`;
  const dayKey = `day:${day}`;
  const [ipCount, dayCount] = await Promise.all([env.RATE_KV.get(ipKey), env.RATE_KV.get(dayKey)]);
  const ipN = Number(ipCount ?? '0');
  const dayN = Number(dayCount ?? '0');
  if (dayN >= daily) return { limited: true, retryAfter: 3600, reason: 'daily cap' };
  if (ipN >= perIp) return { limited: true, retryAfter: 900, reason: 'per visitor' };
  await Promise.all([
    env.RATE_KV.put(ipKey, String(ipN + 1), { expirationTtl: 3600 }),
    env.RATE_KV.put(dayKey, String(dayN + 1), { expirationTtl: 172800 }),
  ]);
  return { limited: false, retryAfter: 0 };
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') ?? '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (url.pathname === '/health') return json({ ok: true }, 200, cors);
    if (url.pathname === '/prompt' && request.method === 'GET') {
      return new Response(rules, { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300', ...cors } });
    }
    if (url.pathname !== '/ask' || request.method !== 'POST') return json({ error: 'not found' }, 404, cors);
    if (!allowedOrigins(env).includes(origin)) return json({ error: 'origin not allowed' }, 403, cors);

    const declared = Number(request.headers.get('content-length') ?? '0');
    if (declared > MAX_BODY_BYTES) return json({ error: 'request too large' }, 413, cors);

    let body: AskBody;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY_BYTES) return json({ error: 'request too large' }, 413, cors);
      body = JSON.parse(text) as AskBody;
    } catch {
      return json({ error: 'body must be JSON' }, 400, cors);
    }
    const question = typeof body.question === 'string' ? body.question.trim().slice(0, MAX_QUESTION_CHARS) : '';
    if (!question) return json({ error: 'question is required' }, 400, cors);
    const register = body.register === 'tech' ? 'Technical' : 'Plain English';
    const history = parseHistory(body.history);

    if (!env.ANTHROPIC_API_KEY) {
      console.error(JSON.stringify({ event: 'ask_error', reason: 'ANTHROPIC_API_KEY is not set' }));
      return json({ error: 'not configured', answer: 'The assistant is not switched on yet. Email Dean at finkelstein.dean@gmail.com.' }, 503, cors);
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const ipHash = (await sha256Hex(`${env.IP_SALT}:${ip}`)).slice(0, 24);
    const limit = await overLimit(env, ipHash);
    if (limit.limited) {
      return json(
        { error: 'limit', answer: `This assistant has a small budget and it is used up for now (${limit.reason}). Email Dean at finkelstein.dean@gmail.com and he will answer in person.` },
        429, { 'retry-after': String(limit.retryAfter), ...cors },
      );
    }

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const messages: Anthropic.Beta.BetaMessageParam[] = [
      ...history,
      { role: 'user', content: `(The reader is viewing the ${register} version of the page.)\n\n${question}` },
    ];

    const started = Date.now();
    try {
      const response = await client.beta.messages.create({
        model: env.MODEL || 'claude-opus-5-5',
        max_tokens: 700,
        system: [{ type: 'text', text: GROUNDING, cache_control: { type: 'ephemeral' } }],
        messages,
        output_config: { effort: 'low' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      });

      let answer: string;
      if (response.stop_reason === 'refusal') {
        answer = 'That one is outside what this assistant will answer. Email Dean at finkelstein.dean@gmail.com.';
      } else {
        answer = response.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
          .map(b => b.text)
          .join('\n')
          .trim();
        if (!answer) answer = 'No answer came back. Try again, or email Dean at finkelstein.dean@gmail.com.';
      }

      const usage = {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cached: response.usage.cache_read_input_tokens ?? 0,
        cacheWrite: response.usage.cache_creation_input_tokens ?? 0,
      };
      // Structured log without the question or the answer: visitors' words stay out of the logs.
      ctx.waitUntil(Promise.resolve().then(() => console.log(JSON.stringify({
        event: 'ask', ms: Date.now() - started, model: response.model, stop: response.stop_reason, ...usage, visitor: ipHash,
      }))));
      return json({ answer, model: response.model, usage }, 200, cors);
    } catch (error) {
      let status = 502;
      let message = 'The assistant is unavailable right now. Email Dean at finkelstein.dean@gmail.com.';
      if (error instanceof Anthropic.RateLimitError) { status = 503; message = 'The assistant is busy. Try again in a minute.'; }
      else if (error instanceof Anthropic.AuthenticationError) { status = 500; message = 'The assistant is misconfigured right now. Email Dean at finkelstein.dean@gmail.com.'; }
      else if (error instanceof Anthropic.APIError) { status = 502; }
      console.error(JSON.stringify({ event: 'ask_error', ms: Date.now() - started, name: error instanceof Error ? error.name : 'unknown', status: error instanceof Anthropic.APIError ? error.status : undefined }));
      return json({ error: 'upstream', answer: message }, status, cors);
    }
  },
} satisfies ExportedHandler<Env>;
