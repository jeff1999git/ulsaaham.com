// Best-effort in-memory rate limiting for the site's own API routes.
//
// State lives in one serverless instance, so a determined attacker spread
// across many cold starts gets more than the stated limit. It still stops the
// cases that matter here — one client hammering an endpoint, and repeated
// sends of the same message — without adding a Redis dependency. The
// authoritative limits for booking and payment stay in the admin panel, which
// rate-limits on Upstash per visitor IP.

const buckets = new Map();
const MAX_KEYS = 10000;

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;

function sweep(now) {
  for (const [key, entry] of buckets) {
    if (now >= entry.resetAt) buckets.delete(key);
  }
  // Still oversized after dropping expired entries: start clean rather than
  // grow without bound.
  if (buckets.size > MAX_KEYS) buckets.clear();
}

/**
 * Consume one slot for `key`. Fixed window: the window starts at the first
 * call and resets once it elapses.
 */
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    if (buckets.size >= MAX_KEYS) sweep(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, retryAfter: 0 };
}

/** Give a consumed slot back when the work it guarded did not happen. */
export function releaseLimit(key) {
  const entry = buckets.get(key);
  if (!entry) return;
  if (entry.count <= 1) buckets.delete(key);
  else entry.count -= 1;
}

export function getClientIp(context) {
  try {
    if (context?.clientAddress) return context.clientAddress;
  } catch {
    // Not available in every runtime — fall through to the header.
  }
  const forwarded = context?.request?.headers?.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "";
}
