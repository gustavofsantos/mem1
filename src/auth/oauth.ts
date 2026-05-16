// Pluggable identity check for Cloudflare Workers OAuth mode.
// This is the one function a self-hoster forks to change who is allowed in.
//
// Called after @cloudflare/workers-oauth-provider completes the OAuth flow
// and resolves an identity profile from the upstream provider (e.g. GitHub, Google).

export type IdentityProfile = {
  email?: string
  login?: string  // GitHub username
  sub?: string    // OIDC subject
}

// Replace the condition here with whatever identifies you.
// Examples:
//   return profile.email === "you@example.com"
//   return profile.login === "your-github-handle"
export function isAuthorizedUser(profile: IdentityProfile, env: Record<string, any>): boolean {
  const allowedEmail = env["MEM1_ALLOWED_EMAIL"]
  if (allowedEmail && profile.email) return profile.email === allowedEmail
  return false
}
