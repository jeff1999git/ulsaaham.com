// The browser side of booking and payment calls (src/lib/api.js): where each
// one goes, what it sends, how long it waits, and what a lost or slow answer
// looks like to the payment screens. fetch is a stub; nothing leaves the process.
import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { setTestEnv } from "../mail/support/env.mjs";
import { loadSource } from "../mail/support/load.mjs";

setTestEnv();
const api = await loadSource("src/lib/api.js");

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const OK = () => json({ success: true });

let calls = [];
let reply = OK;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), init, body: typeof init.body === "string" ? JSON.parse(init.body) : init.body });
  return reply(url, init);
};

const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;
after(() => {
  globalThis.fetch = realFetch;
  globalThis.setTimeout = realSetTimeout;
  globalThis.clearTimeout = realClearTimeout;
});
beforeEach(() => {
  calls = [];
  reply = OK;
  globalThis.setTimeout = realSetTimeout;
  globalThis.clearTimeout = realClearTimeout;
});

/** A server that never answers: the request ends only when it is aborted. */
const hang = (_url, init) =>
  new Promise((_resolve, reject) => {
    const aborted = () => reject(new DOMException("The operation was aborted.", "AbortError"));
    if (init.signal?.aborted) aborted();
    else init.signal?.addEventListener("abort", aborted);
  });

const LOST = { ok: false, status: 0, data: { success: false, error: "Network error. Please try again." } };

test("a ticket email names the booking and the address only, and outlives the page", async () => {
  const result = await api.sendTicketEmail({ ticketCode: "UE-ONAM-ABC123", email: "a@example.test", paymentId: "pay_X" });

  assert.equal(calls[0].url, "/api/send-ticket");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.keepalive, true, "the send is cancelled when the visitor leaves");
  assert.deepEqual(calls[0].body, { ticketCode: "UE-ONAM-ABC123", email: "a@example.test" });
  assert.deepEqual(result, { ok: true, status: 200, data: { success: true } });
});

test("the payment status check posts the order and phone for its event", async () => {
  reply = () => json({ success: true, pending: true });
  const pending = await api.getPaymentStatus("onam fest", { orderId: "order_ABC123", phone: "9876543210" });

  assert.equal(calls[0].url, "/api/public/events/onam%20fest/payment/status");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers["Content-Type"], "application/json");
  assert.deepEqual(calls[0].body, { orderId: "order_ABC123", phone: "9876543210" });
  assert.deepEqual(pending, { ok: true, status: 200, data: { success: true, pending: true } });

  reply = () => json({ success: true, data: { ticketCode: "UE-ONAM-ABC123" } });
  const found = await api.getPaymentStatus("onam-fest", { orderId: "order_ABC123", phone: "9876543210" });
  assert.equal(found.data.data.ticketCode, "UE-ONAM-ABC123");

  reply = () => json({ success: false, error: "Event not found", code: "EVENT_NOT_FOUND" }, 404);
  assert.deepEqual(await api.getPaymentStatus("gone", { orderId: "o", phone: "9876543210" }), {
    ok: false,
    status: 404,
    data: { success: false, error: "Event not found", code: "EVENT_NOT_FOUND" },
  });
});

test("order, verify and status wait 25 s, 20 s and 10 s by default, and leave no timer behind", async () => {
  const set = [];
  const cleared = new Set();
  globalThis.setTimeout = (fn, ms, ...rest) => {
    const id = realSetTimeout(fn, ms, ...rest);
    set.push({ id, ms });
    return id;
  };
  globalThis.clearTimeout = (id) => {
    cleared.add(id);
    return realClearTimeout(id);
  };

  await api.createPaymentOrder("onam", { phone: "9876543210" });
  await api.verifyPayment("onam", { razorpay_order_id: "order_1" });
  await api.getPaymentStatus("onam", { orderId: "order_1", phone: "9876543210" });

  assert.deepEqual(set.map((t) => t.ms), [25000, 20000, 10000]);
  assert.ok(set.every((t) => cleared.has(t.id)), "a deadline outlived its request");
  assert.equal(api.ORDER_TIMEOUT_MS, 25000);
  assert.equal(api.VERIFY_TIMEOUT_MS, 20000);
  for (const call of calls) assert.ok(call.init.signal, `${call.url} has no deadline`);
});

test("a payment call that runs out of time reads as a lost connection", async () => {
  reply = hang;
  const started = Date.now();
  assert.deepEqual(await api.createPaymentOrder("onam", {}, { timeoutMs: 30 }), LOST);
  assert.deepEqual(await api.verifyPayment("onam", {}, { timeoutMs: 30 }), LOST);
  assert.deepEqual(await api.getPaymentStatus("onam", { orderId: "o", phone: "9876543210" }, { timeoutMs: 30 }), LOST);
  assert.ok(Date.now() - started < 5000, "the deadline did not end the requests");
});

test("the caller can cancel a payment call", async () => {
  reply = hang;
  const controller = new AbortController();
  const pending = api.verifyPayment("onam", {}, { signal: controller.signal });
  controller.abort();
  assert.deepEqual(await pending, LOST);

  const spent = new AbortController();
  spent.abort();
  assert.deepEqual(await api.createPaymentOrder("onam", {}, { signal: spent.signal }), LOST);
});

test("the server's own error and code reach the payment screens", async () => {
  const answer = { success: false, error: "The payment gateway is busy. Please try again.", code: "GATEWAY_UNAVAILABLE" };
  reply = () => json(answer, 502);
  assert.deepEqual(await api.verifyPayment("onam", {}), { ok: false, status: 502, data: answer });
  assert.deepEqual(await api.createPaymentOrder("onam", {}), { ok: false, status: 502, data: answer });

  // An answer that is not JSON reads as a lost connection.
  reply = () => new Response("<html>oops</html>", { status: 200, headers: { "content-type": "text/html" } });
  assert.deepEqual(await api.verifyPayment("onam", {}), LOST);
  reply = () => {
    throw new TypeError("Failed to fetch");
  };
  assert.deepEqual(await api.registerForEvent("onam", {}), LOST);
});

test("a free booking carries its request id when it has one", async () => {
  await api.registerForEvent("onam-fest", { name: "Ravi", phone: "9876543210" }, { requestId: "req-1234abcd" });
  await api.registerForEvent("onam-fest", { name: "Ravi", phone: "9876543210" });

  assert.equal(calls[0].url, "/api/public/events/onam-fest/register");
  assert.deepEqual(calls[0].body, { name: "Ravi", phone: "9876543210", requestId: "req-1234abcd" });
  assert.deepEqual(calls[1].body, { name: "Ravi", phone: "9876543210" });
  // Free bookings keep today's open-ended wait.
  assert.equal(calls[0].init.signal, undefined);
});

test("each call keeps its own words for a rate limit", async () => {
  reply = () => json({ success: false, error: "from the server" }, 429);
  const cases = [
    [() => api.registerForEvent("onam", {}), "Too many requests. Please try again later."],
    [() => api.validateCode("onam", "CODE"), "Too many requests. Please try again later."],
    [() => api.fetchMyTickets(["UE-1"]), "Too many requests. Please try again later."],
    [() => api.createPaymentOrder("onam", {}), "Too many attempts. Please wait before trying again."],
    [() => api.verifyPayment("onam", {}), "Too many attempts. Please wait before trying again."],
    [() => api.getPaymentStatus("onam", { orderId: "o", phone: "9876543210" }), "Too many requests. Please try again in a moment."],
  ];
  for (const [call, error] of cases) {
    assert.deepEqual(await call(), { ok: false, status: 429, data: { success: false, error } });
  }
  assert.deepEqual(
    calls.map((c) => c.url),
    [
      "/api/public/events/onam/register",
      "/api/public/events/onam/apply-coupon",
      "/api/public/participants/my-tickets",
      "/api/public/events/onam/payment/order",
      "/api/public/events/onam/payment/verify",
      "/api/public/events/onam/payment/status",
    ]
  );
  assert.deepEqual(calls[1].body, { couponCode: "CODE" });
  assert.deepEqual(calls[2].body, { ticketCodes: ["UE-1"] });
});
