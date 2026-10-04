// The decisions the payment screens make, kept out of the components so the
// tests can run them: when a Razorpay order may be used again, when a payment
// confirmation is worth asking for again, and what a refused booking means for
// the form.

// The admin panel limits how many orders one buyer creates an hour, and
// Razorpay accepts several attempts on one order. So Pay reuses the order it
// made for exactly the same request within this long, and a closed payment
// window costs nothing.
export const ORDER_REUSE_MS = 15 * 60 * 1000;

/** The key an order is kept under: the event and the exact request body. */
export const orderKey = (slug, body) => JSON.stringify([slug, body]);

/** What a screen keeps of an order it created, for reusableOrder. */
export const keepOrder = (key, order, now = Date.now()) => ({ key, order, at: now });

/** The saved order when it was made for this key less than 15 minutes ago, else null. */
export function reusableOrder(saved, key, now = Date.now()) {
  return saved && saved.key === key && now - saved.at < ORDER_REUSE_MS ? saved.order : null;
}

// Confirming a payment is safe to repeat: the admin panel answers an order it
// has already recorded with the same booking. A lost connection or timeout
// (status 0) and a server error are asked again after 1, 3 and 6 seconds.
export const VERIFY_RETRY_DELAYS_MS = [1000, 3000, 6000];
const RETRY_STATUSES = new Set([0, 500, 502, 503, 504]);

export const shouldRetryVerify = (status) => RETRY_STATUSES.has(status);

/**
 * An answer that asking again will not change: the payment, its order, the
 * event or the phone was refused. A rate limit is not one, and neither is a
 * server error.
 */
export const isFinalAnswer = (status) => status >= 400 && status < 500 && status !== 429;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Runs `attempt` until it succeeds, gives an answer not worth retrying, or the delays run out. */
export async function verifyWithRetry(attempt, { delays = VERIFY_RETRY_DELAYS_MS, wait = sleep } = {}) {
  let result = await attempt();
  for (const delay of delays) {
    if (result.ok || !shouldRetryVerify(result.status)) break;
    await wait(delay);
    result = await attempt();
  }
  return result;
}

const NOT_CONFIRMED = "Your payment went through, but we could not confirm your booking yet.";

/** What a failed confirmation says: the admin panel's own words, unless no answer arrived. */
export function verifyFailureMessage(result) {
  return (result?.status && result.data?.error) || NOT_CONFIRMED;
}

/**
 * What the booking form does with a refused order or registration:
 *   coupon  - the applied code is no longer accepted; drop it.
 *   fields  - back to the form, with the server's field errors.
 *   stale   - the event changed (closed, full, free or paid); reload it.
 *   message - show the message.
 */
export function bookingErrorAction({ status, data } = {}, { hasCode = false } = {}) {
  const message = data?.error || null;
  if (data?.code === "COUPON_INVALID" || (status === 404 && hasCode && data?.code !== "EVENT_NOT_FOUND")) {
    return { kind: "coupon", message };
  }
  if (status === 400 && data?.fieldErrors) return { kind: "fields", fieldErrors: data.fieldErrors, message };
  if (status === 410 || status === 400) return { kind: "stale", message };
  return { kind: "message", message };
}

/** An id for one free booking submit; the same submit retried keeps it, so it books once. */
export function newRequestId() {
  try {
    return crypto.randomUUID();
  } catch {
    // Only secure pages have randomUUID, and older phones lack it.
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
