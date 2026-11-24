import "server-only";

// Simple in-memory limit on login attempts, to slow down password guessing.
// It lives in the server's memory: fine for one server; with several servers or serverless,
// move it to a shared store (e.g. a database table or Redis).

const attempts = new Map<string, { count: number; resetAt: number }>();

/** Returns true when `key` has used up its `limit` within `windowMs`. Counts this attempt. */
export function tooManyAttempts(key: string, limit = 10, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    if (attempts.size > 10_000) for (const [k, v] of attempts) if (v.resetAt < now) attempts.delete(k);
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

export function clearAttempts(key: string) {
  attempts.delete(key);
}
