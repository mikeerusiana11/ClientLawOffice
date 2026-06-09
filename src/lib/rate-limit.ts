// In-memory rate limiter — works per-process. On serverless platforms with
// multiple instances each instance tracks its own window, which still provides
// meaningful friction against single-source abuse.
const store = new Map<string, { count: number; resetAt: number }>();

function pruneExpired(now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

let lastPrune = 0;
const PRUNE_INTERVAL = 60_000;

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 * @param key        Unique key (e.g. "chat:1.2.3.4")
 * @param max        Maximum requests allowed in the window
 * @param windowMs   Window length in milliseconds
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();

  if (now - lastPrune > PRUNE_INTERVAL) {
    pruneExpired(now);
    lastPrune = now;
  }

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;

  entry.count++;
  return true;
}

/** Extracts the caller IP from Vercel / standard proxy headers. */
export function getIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
