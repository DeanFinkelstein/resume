# Adopting AI safely in a Salesforce shop

A one-page briefing for the IT lead who has not decided yet. Written by Dean Finkelstein. Facts checked against the sources at the end on 2026-10-17; the terms changed twice this year, so check the dates before you rely on a number.

## Three questions decide it

Every AI rollout I have been part of came down to the same three questions. Who can log in. Where the data goes. What it costs. Answer them in that order and the rest is scheduling.

## 1. Who can log in

**Identity first.** On Claude's Enterprise plan, access runs through your single sign-on, domain capture brings every account on your email domain under your control, and SCIM creates and removes accounts as your identity provider does. Team plans have SSO; the admin provisioning and audit tooling is the Enterprise tier. Pick the plan by the controls you need, not the price.

**Connections into Salesforce run through OAuth, not shared passwords.** When Claude, Claude Code, or any tool reaches into your org, it does so through a Salesforce Connected App. The person approves specific scopes, Salesforce enforces that person's own profile and permission sets, and you can see and revoke every token under Connected Apps OAuth Usage. The AI never sees more than the signed-in person could see. Keep it that way: no integration user with Modify All for a chat tool.

**Experiment in a sandbox or a Developer Edition org.** Nothing touches production until the pattern is understood.

## 2. Where the data goes

| What you use | What happens to the data | What to set |
|---|---|---|
| Consumer Claude (Free, Pro, Max) | Consumer terms, with their own training and retention rules | Not for client data. Keep it off the approved list. |
| Claude Team and Enterprise | Not used to train models by default. Chats stay in the product until someone deletes them; a deleted chat leaves backend storage within 30 days. Enterprise admins can set custom retention. | Set retention before the first seat is issued. Turn on audit logs. |
| Claude API (and Claude Code through the API) | Inputs and outputs are deleted within 30 days of receipt or generation. Zero data retention is available by agreement, per organization, for eligible APIs. Four Covered Models (Claude Fable 5.1, Claude Mythos 5.1, Claude Fable 5, Claude Mythos 5) require 30-day retention and are not under zero retention unless Anthropic authorizes it. | Check your setting under Privacy Controls, Data retention period. Ask for zero retention if your data class needs it, and know which models that rules out. |
| Agentforce | The Einstein Trust Layer sits between the agent and the model: secure data retrieval and dynamic grounding, zero-retention agreements with the model providers (the provider does not keep the prompt, the customer data, or the response), toxicity detection on prompts and responses, and an audit trail that logs each step. Data masking for large language models is currently disabled for agents, though it still runs for embedded features such as Einstein Service Replies. | Design agents so they do not depend on masking. Decide who reviews the audit trail and how often. |

Two notes that matter in regulated work. HIPAA readiness covers the Claude API, enabled from the Console with Anthropic's standard agreement, and does not cover Claude Code or the Console interface itself. Under every arrangement, including zero retention, Anthropic keeps safety classifier results to enforce its usage policy, and content flagged as a violation can be kept for up to two years.

Since October 2025, Claude is also one of the foundation models available inside Agentforce, reached through Amazon Bedrock inside the Salesforce trust boundary. That is the route for teams whose data is not allowed to leave that boundary.

## 3. What it costs

| Plan | Price as published on 2026-10-17 | Includes |
|---|---|---|
| Pro | $20 per month, or $17 per month billed annually | Claude Code. Personal use. |
| Max | From $100 per month | Claude Code. Heavy personal use. |
| Team, Standard seat | $20 per seat per month billed annually, $25 monthly | Claude Code, SSO |
| Team, Premium seat | $100 per seat per month billed annually, $125 monthly | Claude Code, SSO, higher limits |
| Enterprise | $20 per seat per month billed annually, 20-seat minimum, plus usage billed at API rates | SSO, domain capture, SCIM, audit logs, compliance API, custom retention, spend caps by organization and by user |
| API | Usage-based, by model and tokens | Your own applications and agents |

Agentforce is metered separately by Salesforce. Get the current credit terms from your account executive and put a monthly cap on the pilot.

## The rollout I would run

1. **Pick the plan by the data it will touch, not by the headcount.** Client data means Team or Enterprise, never a personal plan.
2. **Turn on SSO and set retention before the first seat goes out.** Retroactive is painful.
3. **Write the two-line rule for what may be pasted.** Anything in the CRM, yes. Anything under a client NDA, only through the approved plan with retention set. Everyone can repeat two lines.
4. **Connect through a Connected App with the narrowest scopes that work, and review OAuth usage monthly.**
5. **Start with one pilot group in a sandbox, with a spend cap, for thirty days.** Measure one thing: hours saved on a task you already track.
6. **Teach one habit: have the assistant ask its questions before it acts.** It is the single biggest difference between tools that help and tools that make confident mistakes.
7. **Put a quarterly review on the calendar.** Covered Models and the masking status both changed this year. Your rules should move with them.

## Sources, checked 2026-10-17

- Anthropic, How long do you store my organization's data (commercial retention policy, updated July 1, 2026): https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data
- Anthropic, API and data retention (zero data retention scope, Covered Models, HIPAA readiness): https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
- Anthropic, zero data retention products and exceptions: https://privacy.claude.com/en/articles/8956058-i-have-a-commercial-account-how-do-you-handle-my-data
- Anthropic, Claude pricing page (plan prices and inclusions as shown): https://claude.com/pricing
- Anthropic, Claude Enterprise, now available self-serve (February 12, 2026; SSO, domain capture, SCIM, audit logs, compliance API, custom retention, spend caps, no training by default): https://claude.com/resources/articles/self-serve-enterprise
- Salesforce Trailhead, Meet the Einstein Trust Layer (components, masking disabled for agents): https://trailhead.salesforce.com/content/learn/modules/the-einstein-trust-layer/meet-the-einstein-trust-layer
- Salesforce Trailhead, Secure agents with the Einstein Trust Layer (zero-retention agreements with model providers, audit logging): https://trailhead.salesforce.com/content/learn/modules/conversational-marketing-fundamentals-for-marketing-cloud-next/secure-agents-with-the-einstein-trust-layer
- Anthropic and Salesforce partnership expansion, October 14, 2025 (Claude in Agentforce through Amazon Bedrock inside the Salesforce trust boundary): https://seekingalpha.com/pr/20264410-anthropic-and-salesforce-expand-strategic-partnership-to-deliver-trusted-ai-for-regulated
