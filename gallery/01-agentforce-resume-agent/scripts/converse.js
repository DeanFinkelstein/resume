#!/usr/bin/env node
// Runs every test case in the spec as its own conversation with the published agent, through the Agent API
// (the same API Agentforce Builder's preview uses), and saves what the agent said and which actions it ran.
// Grading against the expected outcome is a separate, recorded step: see out/TEST-LOG.md.
//
// Usage: node scripts/converse.js --org <alias> [--spec specs/Resume_Agent-testSpec.yaml] [--only 1,4,9] [--timeout 120]
'use strict';
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { Org } = require('@salesforce/core');
const { ProductionAgent } = require('@salesforce/agents');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const ORG = flag('org');
if (!ORG) { console.error('Usage: node scripts/converse.js --org <alias> [--spec path] [--only 1,4,9] [--timeout 120]'); process.exit(2); }
const root = path.resolve(__dirname, '..');
const specPath = path.resolve(root, flag('spec', 'specs/Resume_Agent-testSpec.yaml'));
const only = flag('only') ? new Set(flag('only').split(',').map(Number)) : null;
const TIMEOUT_MS = Number(flag('timeout', 120)) * 1000;
const outDir = path.join(root, 'out');
fs.mkdirSync(outDir, { recursive: true });

const spec = YAML.parse(fs.readFileSync(specPath, 'utf8'));

// The library falls back to hosts this machine may not reach and retries quietly. Never wait forever.
function withTimeout(promise, label) {
  let t;
  return Promise.race([
    promise.finally(() => clearTimeout(t)),
    new Promise((_, reject) => { t = setTimeout(() => reject(new Error(`${label} timed out after ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS); }),
  ]);
}

// Summarize a plan trace: topic, each action with its inputs, and Salesforce's own checks on the answer
// (groundedness, instruction adherence, task resolution, safety).
function summarizeTrace(trace) {
  const steps = Array.isArray(trace && trace.plan) ? trace.plan : [];
  const first = s => String(s || '').trim().split(/\s+/)[0] || null;
  const topics = [...new Set(steps.filter(s => s.type === 'UpdateTopicStep' && s.topic).map(s => s.topic).concat(trace && trace.topic ? [trace.topic] : []))];
  const actions = steps.filter(s => s.type === 'FunctionStep' && s.function).map(s => ({
    name: s.function.name,
    input: s.function.input,
    status: s.function.output && s.function.output.__action_execution_status__,
  }));
  const evalStep = steps.find(s => s.type === 'OutputEvaluationStep');
  const guard = steps.find(s => s.type === 'GuardrailsStep');
  const reply = steps.find(s => s.type === 'PlannerResponseStep');
  return {
    topics,
    actions,
    groundedness: evalStep ? { category: evalStep.category, reason: evalStep.reason } : null,
    instructionAdherence: guard ? first(guard.instructionAdherence) : null,
    taskResolution: guard ? first(guard.taskResolution) : null,
    contentSafe: reply ? reply.isContentSafe : null,
  };
}

(async () => {
  const org = await Org.create({ aliasOrUsername: ORG });
  const connection = org.getConnection();
  const cases = spec.testCases.map((c, i) => ({ n: i + 1, ...c })).filter(c => !only || only.has(c.n));
  const results = [];
  console.error(`Running ${cases.length} conversation(s) with ${spec.subjectName} in ${ORG}`);
  for (const c of cases) {
    const agent = new ProductionAgent({ connection, apiNameOrId: spec.subjectName });
    const started = Date.now();
    const rec = { n: c.n, utterance: c.utterance, expectedTopic: c.expectedTopic, expectedActions: c.expectedActions, expectedOutcome: c.expectedOutcome };
    try {
      const session = await withTimeout(agent.preview.start(), 'start session');
      rec.welcome = (session.messages || []).map(m => m.message).join(' ');
      const reply = await withTimeout(agent.preview.send(c.utterance), 'send message');
      const msgs = reply.messages || [];
      rec.response = msgs.map(m => m.message).filter(Boolean).join('\n');
      rec.messageTypes = msgs.map(m => m.type);
      const planId = msgs[0] && msgs[0].planId;
      if (planId) {
        const trace = await withTimeout(agent.getTrace(planId), 'fetch trace').catch(e => ({ error: e.message }));
        rec.trace = trace && trace.error ? { error: trace.error } : summarizeTrace(trace);
        if (trace && !trace.error) fs.writeFileSync(path.join(outDir, `trace-${String(c.n).padStart(2, '0')}.json`), JSON.stringify(trace, null, 2) + '\n', 'utf8');
      }
      await withTimeout(agent.preview.end('UserRequest'), 'end session').catch(() => undefined);
    } catch (e) {
      rec.error = String(e && e.message ? e.message : e).slice(0, 600);
      try { await agent.preview.end('UserRequest'); } catch (_) { /* session may never have started */ }
    }
    rec.seconds = +((Date.now() - started) / 1000).toFixed(1);
    results.push(rec);
    console.error(`  ${String(c.n).padStart(2)} ${rec.error ? 'ERROR ' + rec.error.slice(0, 160) : 'ok'} (${rec.seconds}s)`);
    if (rec.error && /timed out|404|not found/i.test(rec.error) && c === cases[0]) {
      console.error('First conversation failed; stopping instead of repeating the same failure.');
      break;
    }
  }
  const out = { agent: spec.subjectName, org: ORG, run: new Date().toISOString(), results };
  fs.writeFileSync(path.join(outDir, 'conversations.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.error(`Wrote ${path.join(outDir, 'conversations.json')}`);
})().catch(e => { console.error('converse failed:', e.message); process.exit(1); });
