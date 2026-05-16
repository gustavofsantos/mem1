import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { OAuthProvider, type OAuthHelpers } from "@cloudflare/workers-oauth-provider"
import { isAuthorizedUser, type IdentityProfile } from "../auth/oauth.ts"
import { applySchema, createStorage } from "../core/db.ts"
import { registerTools } from "../core/tools.ts"

// Types from @cloudflare/workers-types
interface KVNamespace {
  get(key: string, options?: { type: "text" | "json" | "arrayBuffer" | "stream" }): Promise<any>
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expiration?: number; expirationTtl?: number; metadata?: any }): Promise<void>
  delete(key: string): Promise<void>
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string; expiration?: number; metadata?: any }[]; list_complete: boolean; cursor?: string }>
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void
  passThroughOnException(): void
  props?: any // Injected by OAuthProvider in ApiHandler
}

type Env = {
  OAUTH_KV: KVNamespace
  OAUTH_PROVIDER: OAuthHelpers
  TURSO_URL: string
  TURSO_AUTH_TOKEN: string
  MEM1_ALLOWED_EMAIL?: string
}

// MCP state is global per-worker-instance (isolate)
let transport: WebStandardStreamableHTTPServerTransport | undefined
let server: McpServer | undefined

async function getMcpServer(env: Env) {
  if (server) return { server, transport: transport! }

  const db = createStorage(env.TURSO_URL, env.TURSO_AUTH_TOKEN)
  await applySchema(db)

  server = new McpServer({ name: "mem1", version: "0.1.0" })
  registerTools(server, db)

  transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  })
  await server.connect(transport)

  return { server, transport }
}

const oauth = new OAuthProvider<Env>({
  apiRoute: "/mcp",
  tokenEndpoint: "/oauth/token",
  authorizeEndpoint: "/authorize",
  
  apiHandler: {
    async fetch(request: Request, env: Env, ctx: ExecutionContext) {
      const { transport } = await getMcpServer(env)
      return transport.handleRequest(request)
    }
  },

  defaultHandler: {
    async fetch(request: Request, env: Env, ctx: ExecutionContext) {
      const url = new URL(request.url)

      if (url.pathname === "/authorize") {
        const oauthReqInfo = await env.OAUTH_PROVIDER.parseAuthRequest(request)
        
        const profile: IdentityProfile = {
          email: env.MEM1_ALLOWED_EMAIL
        }

        if (!isAuthorizedUser(profile, env)) {
          return new Response("Unauthorized", { status: 401 })
        }

        const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
          request: oauthReqInfo,
          userId: profile.email || "default",
          scope: ["mcp"],
          props: { email: profile.email },
          metadata: { login_at: new Date().toISOString() }
        })

        return Response.redirect(redirectTo, 302)
      }

      return new Response("Not Found", { status: 404 })
    }
  }
})

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return oauth.fetch(request, env, ctx)
  }
}
