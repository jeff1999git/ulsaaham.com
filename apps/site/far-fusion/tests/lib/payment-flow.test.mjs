// The payment screens' decisions (src/lib/payment-flow.js): when an order is
// reused, which confirmation answers are asked again and how often, what the
// verify-failed panel says, and what a refused booking does to the form.
import test from "node:test";
import assert from "node:assert/strict";

import { setTestEnv } from "../mail/support/env.mjs";
import { loadSource } from "../mail/support/load.mjs";

setTestEnv();
const flow = await loadSource("src/lib/payment-flow.js");

const answer = (status, data = {}) => ({ ok: status >= 200 && status < 300, status, data });
const LOST = answer(0, { success: false, error: "Network error. Please try again." });

test("an order is reused for the same request within 15 minutes, and only then", () => {
  const body = { name: "Ravi", phone: "9876543210", age: 30, numberOfParticipants: 2 };
  const key = flow.orderKey("onam-fest", body);
  const order = { orderId: "order_1", amount: 118000 };
  const saved = flow.keepOrder(key, order, 1_000_000);
  assert.deepEqual(saved, { key, order, at: 1_000_000 });
  assert.ok(Math.abs(flow.keepOrder(key, order).at - Date.now()) < 1000, "kept without a time");

  assert.equal(flow.ORDER_REUSE_MS, 15 * 60 * 1000);
  assert.equal(flow.reusableOrder(saved, key, 1_000_000 + flow.ORDER_REUSE_MS - 1), order);
  assert.equal(flow.reusableOrder(saved, key, 1_000_000 + flow.ORDER_REUSE_MS), null);
  assert.equal(flow.reusableOrder(null, key, 1_000_000), null);

  // Any change to the request, a coupon included, or another event is a new key.
  for (const other of [
    flow.orderKey("onam-fest", { ...body, numberOfParticipants: 3 }),
    flow.orderKey("onam-fest", { ...body, couponCode: "EARLY" }),
    flow.orderKey("onam-fest", { ...body, email: "ravi@example.test" }),
    flow.orderKey("vishu-night", body),
  ]) {
    assert.notEqual(other, key);
    assert.equal(flow.reusableOrder(saved, other, 1_000_000), null);
  }
  assert.equal(flow.orderKey("onam-fest", { ...body }), key);
});

test("lost answers and server errors are retried; refusals and rate limits are not", () => {
  for (const status of [0, 500, 502, 503, 504]) assert.equal(flow.shouldRetryVerify(status), true, String(status));
  for (const status of [200, 201, 400, 404, 409, 410, 429]) assert.equal(flow.shouldRetryVerify(status), false, String(status));

  // A final answer ends the pending record; a rate limit or an outage does not.
  for (const status of [400, 404, 409]) assert.equal(flow.isFinalAnswer(status), true, String(status));
  for (const status of [0, 200, 429, 500, 502]) assert.equal(flow.isFinalAnswer(status), false, String(status));
});

test("verify is tried four times in all, 1, 3 and 6 seconds apart", async () => {
  assert.deepEqual(flow.VERIFY_RETRY_DELAYS_MS, [1000, 3000, 6000]);
  const waits = [];
  let calls = 0;
  const result = await flow.verifyWithRetry(
    async () => {
      calls += 1;
      return answer(500, { success: false, error: "Registration failed.", code: "REGISTRATION_FAILED" });
    },
    { wait: async (ms) => waits.push(ms) }
  );
  assert.equal(calls, 4);
  assert.deepEqual(waits, [1000, 3000, 6000]);
  assert.equal(result.status, 500);
});

test("verify stops at the first success or the first answer not worth repeating", async () => {
  const run = async (replies) => {
    const waits = [];
    let i = 0;
    const result = await flow.verifyWithRetry(async () => replies[i++], { wait: async (ms) => waits.push(ms) });
    return { result, calls: i, waits };
  };

  const recovered = await run([LOST, answer(502), answer(201, { success: true, data: { ticketCode: "UE-1" } })]);
  assert.equal(recovered.calls, 3);
  assert.deepEqual(recovered.waits, [1000, 3000]);
  assert.equal(recovered.result.status, 201);

  const refused = await run([LOST, answer(409, { success: false, code: "PHONE_ALREADY_REGISTERED" })]);
  assert.equal(refused.calls, 2);
  assert.equal(refused.result.status, 409);

  const first = await run([answer(200, { success: true })]);
  assert.equal(first.calls, 1);
  assert.deepEqual(first.waits, []);
});

test("verify waits for real when no wait is given", async () => {
  // Zero-length delays keep this quick while running the default timer path.
  let calls = 0;
  const result = await flow.verifyWithRetry(async () => (++calls < 3 ? LOST : answer(201)), { delays: [0, 0, 0] });
  assert.equal(calls, 3);
  assert.equal(result.status, 201);
});

test("the verify-failed panel shows the server's words, or a fallback when none arrived", () => {
  const server = "Payment received but this phone number already has a booking on this event. Please contact support with your payment ID.";
  assert.equal(flow.verifyFailureMessage(answer(409, { success: false, error: server })), server);
  assert.equal(flow.verifyFailureMessage(answer(429, { success: false, error: "Too many attempts. Please wait before trying again." })), "Too many attempts. Please wait before trying again.");
  // A lost connection's message is the browser's, not the server's.
  const fallback = flow.verifyFailureMessage(LOST);
  assert.match(fallback, /payment went through/i);
  assert.equal(flow.verifyFailureMessage(answer(502, {})), fallback);
  assert.equal(flow.verifyFailureMessage(undefined), fallback);
});

test("a refused booking maps to what the form does next", () => {
  const act = (status, data, hasCode = false) => flow.bookingErrorAction(answer(status, { success: false, ...data }), { hasCode });

  // The code is dropped on the server's COUPON_INVALID, or a bare 404 while one is applied.
  assert.deepEqual(act(404, { error: "Invalid coupon code", code: "COUPON_INVALID" }, true), { kind: "coupon", message: "Invalid coupon code" });
  assert.deepEqual(act(400, { error: "Invalid or fully-used code", code: "COUPON_INVALID" }, true), { kind: "coupon", message: "Invalid or fully-used code" });
  assert.equal(act(404, { error: "Ticket not found" }, true).kind, "coupon");
  assert.equal(act(404, { error: "Event not found", code: "EVENT_NOT_FOUND" }, true).kind, "message");
  assert.equal(act(404, { error: "Event not found" }).kind, "message");

  const fieldErrors = { phone: ["Phone number must be exactly 10 digits"] };
  assert.deepEqual(act(400, { error: "Validation failed", fieldErrors }), { kind: "fields", fieldErrors, message: "Validation failed" });

  // Closed, full, free-or-paid and too-low totals: reload the event and show why.
  assert.deepEqual(act(410, { error: "Event is full" }), { kind: "stale", message: "Event is full" });
  assert.equal(act(400, { error: "This is a free event — use the register endpoint" }).kind, "stale");
  assert.equal(act(400, { error: "The total must be at least ₹1.", code: "AMOUNT_TOO_LOW" }).kind, "stale");

  assert.deepEqual(act(409, { error: "This phone number already has a booking for this event.", code: "PHONE_ALREADY_REGISTERED" }), {
    kind: "message",
    message: "This phone number already has a booking for this event.",
  });
  assert.equal(act(502, { error: "The payment gateway is busy. Please try again.", code: "GATEWAY_UNAVAILABLE" }).kind, "message");
  assert.equal(act(429, { error: "Too many attempts." }).kind, "message");
  assert.deepEqual(flow.bookingErrorAction(LOST), { kind: "message", message: "Network error. Please try again." });
  assert.deepEqual(flow.bookingErrorAction(), { kind: "message", message: null });
});

test("request ids are unique and in the form the admin panel accepts", () => {
  const ids = new Set(Array.from({ length: 50 }, () => flow.newRequestId()));
  assert.equal(ids.size, 50);
  for (const id of ids) assert.match(id, /^[A-Za-z0-9-]{8,64}$/);

  // Without crypto.randomUUID (an insecure page, an older phone).
  const real = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", { value: {}, configurable: true, writable: true });
  try {
    const fallback = flow.newRequestId();
    assert.match(fallback, /^[A-Za-z0-9-]{8,64}$/);
    assert.notEqual(fallback, flow.newRequestId());
  } finally {
    Object.defineProperty(globalThis, "crypto", real);
  }
});
