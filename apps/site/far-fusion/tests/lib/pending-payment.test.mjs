// The record of a payment the booking form may never hear back about
// (src/lib/pending-payment.js): what is kept, for how long, and which visits
// look for its booking. Storage is a stand-in Map; nothing touches a browser.
import test from "node:test";
import assert from "node:assert/strict";

import { setTestEnv } from "../mail/support/env.mjs";
import { loadSource } from "../mail/support/load.mjs";

setTestEnv();
const pending = await loadSource("src/lib/pending-payment.js");
const { PENDING_KEY, RECOVER_FOR_MS, KEEP_FOR_MS } = pending;

/** localStorage as far as the module uses it. */
function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

const NOW = Date.UTC(2026, 9, 4, 12, 0, 0);
const RECORD = { slug: "onam-fest", orderId: "order_ABC123", phone: "9876543210", total: 1180, createdAt: NOW };

test("the key, the half hour it is looked for and the day it is kept", () => {
  assert.equal(PENDING_KEY, "ulsaham_pending_payment");
  assert.equal(RECOVER_FOR_MS, 30 * 60 * 1000);
  assert.equal(KEEP_FOR_MS, 24 * 60 * 60 * 1000);
});

test("a saved record reads back as written", () => {
  const store = memoryStorage();
  pending.savePendingPayment(RECORD, store);
  assert.deepEqual(JSON.parse(store.map.get(PENDING_KEY)), RECORD);
  assert.deepEqual(pending.readPendingPayment(NOW + 1000, store), RECORD);
});

test("a record more than a day old, or malformed, is dropped on read", () => {
  const store = memoryStorage();
  pending.savePendingPayment(RECORD, store);
  assert.deepEqual(pending.readPendingPayment(NOW + KEEP_FOR_MS, store), RECORD);
  assert.equal(pending.readPendingPayment(NOW + KEEP_FOR_MS + 1, store), null);
  assert.equal(store.map.has(PENDING_KEY), false);

  for (const bad of ["{not json", JSON.stringify({ ...RECORD, orderId: 42 }), JSON.stringify({ ...RECORD, createdAt: "today" }), "null"]) {
    const broken = memoryStorage({ [PENDING_KEY]: bad });
    assert.equal(pending.readPendingPayment(NOW, broken), null, bad);
  }
  const noPhone = memoryStorage({ [PENDING_KEY]: JSON.stringify({ ...RECORD, phone: undefined }) });
  assert.equal(pending.readPendingPayment(NOW, noPhone), null);
  assert.equal(noPhone.map.has(PENDING_KEY), false);
});

test("the Payment ID is added to the record of its own order only", () => {
  const store = memoryStorage();
  pending.savePendingPayment({ ...RECORD, createdAt: Date.now() }, store);
  pending.updatePendingPayment("order_OTHER", { paymentId: "pay_X" }, store);
  assert.equal(pending.readPendingPayment(Date.now(), store).paymentId, undefined);
  pending.updatePendingPayment(RECORD.orderId, { paymentId: "pay_X" }, store);
  const updated = pending.readPendingPayment(Date.now(), store);
  assert.equal(updated.paymentId, "pay_X");
  assert.equal(updated.orderId, RECORD.orderId);
});

test("clearing names the order, so an answer for an old payment keeps a newer one", () => {
  const store = memoryStorage();
  pending.savePendingPayment(RECORD, store);
  pending.clearPendingPayment("order_OLD", store);
  assert.ok(store.map.has(PENDING_KEY));
  pending.clearPendingPayment(RECORD.orderId, store);
  assert.equal(store.map.has(PENDING_KEY), false);

  pending.savePendingPayment(RECORD, store);
  pending.clearPendingPayment(undefined, store);
  assert.equal(store.map.has(PENDING_KEY), false);
});

test("only this event's record, under half an hour old, is looked for", () => {
  assert.equal(pending.isRecoverable(RECORD, "onam-fest", NOW), true);
  assert.equal(pending.isRecoverable(RECORD, "onam-fest", NOW + RECOVER_FOR_MS - 1), true);
  assert.equal(pending.isRecoverable(RECORD, "onam-fest", NOW + RECOVER_FOR_MS), false);
  assert.equal(pending.isRecoverable(RECORD, "another-event", NOW), false);
  assert.equal(pending.isRecoverable(null, "onam-fest", NOW), false);
});

test("storage that is missing or refuses access is not an error", () => {
  const refusing = {
    getItem() { throw new Error("SecurityError"); },
    setItem() { throw new Error("QuotaExceededError"); },
    removeItem() { throw new Error("SecurityError"); },
  };
  assert.doesNotThrow(() => pending.savePendingPayment(RECORD, refusing));
  assert.equal(pending.readPendingPayment(NOW, refusing), null);
  assert.doesNotThrow(() => pending.clearPendingPayment(RECORD.orderId, refusing));
  assert.doesNotThrow(() => pending.updatePendingPayment(RECORD.orderId, { paymentId: "pay_X" }, refusing));

  // Under node there is no localStorage at all.
  assert.doesNotThrow(() => pending.savePendingPayment(RECORD));
  assert.equal(pending.readPendingPayment(), null);
});
