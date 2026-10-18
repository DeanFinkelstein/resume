// Secrets are set with `wrangler secret put`, so they are not in wrangler.jsonc and `wrangler types` cannot see them.
// This merges the one secret into the generated Env. Everything else in Env comes from the generated file.
interface Env {
  ANTHROPIC_API_KEY: string;
}
