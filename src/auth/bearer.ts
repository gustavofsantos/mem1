export function validateBearer(authHeader: string | null, expected: string): boolean {
  if (!authHeader) return false
  const [scheme, token] = authHeader.split(" ")
  return scheme === "Bearer" && token === expected
}
