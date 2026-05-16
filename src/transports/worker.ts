// Cloudflare Workers transport — stub.
// Implement after local transports are stable.
//
// Will use:
//   @cloudflare/workers-oauth-provider  — OAuth 2.0 + PKCE
//   @libsql/client/web                  — Turso HTTP API (no native modules)
//   src/auth/oauth.ts                   — pluggable identity check (the one file to fork)
//
// wrangler.toml will bind TURSO_URL and TURSO_AUTH_TOKEN as secrets.

export default {
  async fetch(_request: Request): Promise<Response> {
    return new Response("not implemented", { status: 501 })
  },
}
