// A payment this page may never hear the end of. It is written just before the
// Razorpay window opens and read again when the booking form loads, when the
// window is closed and when the tab comes back into view, so a ticket paid for
// in a UPI app, or in a tab the phone reloaded, still turns up here.
//
// { slug, orderId, phone, total, createdAt, email?, paymentId?, checkedAt? }
// paymentId is added once Razorpay reports the payment, checkedAt once a full
// round of checks has found no booking for it.
export const PENDING_KEY = "ulsaham_pending_payment";

// How long after opening the payment window a missing answer is looked for,
// and how long the record is kept at all.
export const RECOVER_FOR_MS = 30 * 60 * 1000;
export const KEEP_FOR_MS = 24 * 60 * 60 * 1000;

// Storage can be missing or refuse access (private mode, blocked site data);
// the payment then simply goes unrecorded.
function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function load(store) {
  try {
    return JSON.parse(store?.getItem(PENDING_KEY) || "null");
  } catch {
    return null;
  }
}

export function savePendingPayment(record, store = storage()) {
  try {
    store?.setItem(PENDING_KEY, JSON.stringify(record));
  } catch {
    /* storage full or blocked */
  }
}

/** Removes the record; given an order id, only when the record is that order's. */
export function clearPendingPayment(orderId, store = storage()) {
  try {
    if (orderId && load(store)?.orderId !== orderId) return;
    store?.removeItem(PENDING_KEY);
  } catch {
    /* blocked */
  }
}

/** The stored record, or null. One that is malformed or more than a day old is removed. */
export function readPendingPayment(now = Date.now(), store = storage()) {
  const record = load(store);
  if (!record) return null;
  const wellFormed =
    typeof record.slug === "string" &&
    typeof record.orderId === "string" &&
    typeof record.phone === "string" &&
    Number.isFinite(record.createdAt);
  if (!wellFormed || now - record.createdAt > KEEP_FOR_MS) {
    clearPendingPayment(undefined, store);
    return null;
  }
  return record;
}

/** Adds fields to the record for this order; a record for another order is left alone. */
export function updatePendingPayment(orderId, fields, store = storage()) {
  const record = readPendingPayment(Date.now(), store);
  if (record?.orderId === orderId) savePendingPayment({ ...record, ...fields }, store);
}

/** Whether the record belongs to this event and is recent enough to look for. */
export function isRecoverable(record, slug, now = Date.now()) {
  return !!record && record.slug === slug && now - record.createdAt < RECOVER_FOR_MS;
}
