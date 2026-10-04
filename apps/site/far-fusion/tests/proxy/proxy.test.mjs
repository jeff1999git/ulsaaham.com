// The /api/public proxy and the edge-cache policy it applies. The CDN may keep
// only the exact public reads the site's own pages make, and only their 200s;
// every write, lookup and error goes to the admin panel each time. Only the
// site's own endpoints, methods and request headers are relayed. The admin
// panel is a stub, so nothing here reaches the network.
import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { setTestEnv } from "../mail/support/env.mjs";
import { loadSource } from "../mail/support/load.mjs";

const BACKEND = "https://admin.example.test/api/public";
const ENV = setTestEnv({ BACKEND_URL: BACKEND, NODE_ENV: "production" });

const { edgePolicy, cacheHeaders, PROFILES } = await loadSource("src/lib/edge-cache.js");
const { ALL } = await loadSource("src/pages/api/public/[...path].js");

// ─── The admin panel stub ───
let reply = () => new Response(JSON.stringify({ success: true }), { status: 200, headers: { "content-type": "application/json" } });
let calls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  return reply(url, init);
};

const realTimeout = AbortSignal.timeout;
after(() => {
  globalThis.fetch = realFetch;
  AbortSignal.timeout = realTimeout;
});
beforeEach(() => {
  calls = [];
  AbortSignal.timeout = realTimeout;
});

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

// A request as Astro hands it over: the path decoded once from the URL.
function proxy(pathAndQuery, { method = "GET", headers = {}, body, route = ALL } = {}) {
  const url = new URL("https://www.ulsaaham.com/api/public/" + pathAndQuery);
  const path = decodeURI(url.pathname.slice("/api/public/".length));
  return route({
    clientAddress: "203.0.113.10",
    params: { path },
    request: new Request(url, { method, headers, body }),
  });
}

// The route with a path no URL would produce. A client can still get one
// there: the Vercel entrypoint routes by the x-astro-path header when present.
function proxyParams(path, { method = "GET", body } = {}) {
  return ALL({
    clientAddress: "203.0.113.10",
    params: { path },
    request: new Request("https://www.ulsaaham.com/api/public/events", { method, body }),
  });
}

function captureConsole(method) {
  const lines = [];
  const real = console[method];
  console[method] = (...args) => lines.push(args.map(String).join(" "));
  return { lines, restore: () => { console[method] = real; } };
}

const NO_STORE = { "cache-control": "no-store" };
const noHeaders = new Headers();

// ─── The policy table ───

test("each page's canonical read gets its profile", () => {
  const cases = [
    ["events", "?page=1&limit=8&upcoming=true", "LIVE"],
    ["events", "?page=1&limit=12&featured=true", "LIVE"],
    ["events", "?page=1&limit=12&featured=false&upcoming=true", "LIVE"],
    ["events", "?page=2&limit=12&featured=false&upcoming=true", "LIVE"],
    ["events", "?page=1&limit=30&past=true", "PAST"],
    ["events", "?page=3&limit=8&past=true", "PAST"],
    ["events/onam-fest-2026", "", "DETAIL"],
    ["brand-partners", "", "PARTNERS"],
  ];
  for (const [path, search, profile] of cases) {
    assert.equal(edgePolicy("GET", path, search, 200, noHeaders), profile, `${path}${search}`);
  }
});

test("the lifetimes are the agreed ones", () => {
  assert.deepEqual(PROFILES, {
    LIVE: { maxAge: 60, swr: 240 },
    PAST: { maxAge: 600, swr: 3000 },
    DETAIL: { maxAge: 15, swr: 45 },
    PARTNERS: { maxAge: 300, swr: 3300 },
  });
  // Booking state on cards and the detail page is never more than 5 minutes old.
  assert.ok(PROFILES.LIVE.maxAge + PROFILES.LIVE.swr <= 300);
  assert.ok(PROFILES.DETAIL.maxAge + PROFILES.DETAIL.swr <= 60);
});

test("anything but a GET 200 is never stored", () => {
  for (const status of [201, 204, 301, 304, 400, 401, 403, 404, 410, 429, 500, 502, 503, 504]) {
    assert.equal(edgePolicy("GET", "events", "?page=1&limit=8&upcoming=true", status, noHeaders), null, `status ${status}`);
    assert.equal(edgePolicy("GET", "events/onam-fest-2026", "", status, noHeaders), null, `detail status ${status}`);
  }
  for (const method of ["HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    assert.equal(edgePolicy(method, "events", "?page=1&limit=8&upcoming=true", 200, noHeaders), null, method);
    assert.equal(edgePolicy(method, "brand-partners", "", 200, noHeaders), null, method);
  }
});

test("lookups, writes and unknown paths are never stored", () => {
  const paths = [
    ["participants/check", "?ticketCode=UE-DANCE-ABC123"],
    ["participants/check", ""],
    ["participants/my-tickets", ""],
    ["participants/my-tickets-by-user", ""],
    ["events/onam-fest-2026/register", ""],
    ["events/onam-fest-2026/payment/order", ""],
    ["events/onam-fest-2026/apply-coupon", ""],
    ["events/..", ""],
    ["events/.", ""],
    ["events/a%2F..", ""],
    ["events/a\\b", ""],
    ["events/", ""],
    ["", ""],
    ["settings", ""],
  ];
  for (const [path, search] of paths) {
    assert.equal(edgePolicy("GET", path, search, 200, noHeaders), null, `${path}${search}`);
  }
});

test("a query the site does not write is passed through", () => {
  const searches = [
    "",
    "?page=1",
    "?limit=8&page=1&upcoming=true",
    "?page=1&limit=8&upcoming=true&fresh=1",
    "?page=1&limit=8&upcoming=1",
    "?page=1&limit=8&past=true&upcoming=true",
    "?page=1&limit=8&upcoming=true&featured=true",
    "?page=0&limit=8&upcoming=true",
    "?page=01&limit=8&upcoming=true",
    "?page=1&limit=99999&upcoming=true",
    "?page=1&limit=8&upcoming=false",
    "?page=1&limit=8&upcoming=true&",
    "?page=1&limit=8&upcoming=true&x_astro_path=/api/public/events/other",
  ];
  for (const search of searches) {
    assert.equal(edgePolicy("GET", "events", search, 200, noHeaders), null, search || "(empty)");
  }
  assert.equal(edgePolicy("GET", "events/onam-fest-2026", "?fresh=1", 200, noHeaders), null);
  assert.equal(edgePolicy("GET", "brand-partners", "?page=1", 200, noHeaders), null);
});

test("a request that re-routes the function is never stored under its URL", () => {
  const rerouted = new Headers({ "x-astro-path": "/api/public/participants/check?ticketCode=UE-DANCE-ABC123" });
  assert.equal(edgePolicy("GET", "events/onam-fest-2026", "", 200, rerouted), null);
  assert.equal(edgePolicy("GET", "events", "?page=1&limit=8&upcoming=true", 200, rerouted), null);
  assert.equal(edgePolicy("GET", "brand-partners", "", 200, rerouted), null);
});

test("stored responses keep browsers out; everything else is no-store", () => {
  assert.deepEqual(cacheHeaders(null), NO_STORE);
  assert.deepEqual(cacheHeaders("LIVE"), {
    "cache-control": "public, max-age=0, must-revalidate",
    "vercel-cdn-cache-control": "max-age=60, stale-while-revalidate=240",
  });
  assert.equal(cacheHeaders("PAST")["vercel-cdn-cache-control"], "max-age=600, stale-while-revalidate=3000");
  assert.equal(cacheHeaders("DETAIL")["vercel-cdn-cache-control"], "max-age=15, stale-while-revalidate=45");
  assert.equal(cacheHeaders("PARTNERS")["vercel-cdn-cache-control"], "max-age=300, stale-while-revalidate=3300");
});

// ─── The route ───

test("a list read goes to the same path on the admin panel and is stored", async () => {
  const body = { success: true, data: { events: [{ id: "e1", name: "Onam ₹ Fest" }], totalPages: 1 } };
  const raw = JSON.stringify(body);
  reply = () => new Response(raw, { status: 200, headers: { "content-type": "application/json; charset=utf-8", "set-cookie": "a=b" } });

  const res = await proxy("events?page=1&limit=8&upcoming=true");

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${BACKEND}/events?page=1&limit=8&upcoming=true`);
  assert.equal(calls[0].init.method, "GET");
  assert.equal(res.status, 200);
  assert.equal(await res.text(), raw, "the body changed on the way through");
  assert.deepEqual(Object.fromEntries(res.headers), {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=0, must-revalidate",
    "vercel-cdn-cache-control": "max-age=60, stale-while-revalidate=240",
  });
});

test("detail, past and partner reads get their own lifetimes", async () => {
  reply = () => json({ success: true });
  const cases = [
    ["events/onam-fest-2026", "max-age=15, stale-while-revalidate=45", `${BACKEND}/events/onam-fest-2026`],
    ["events?page=1&limit=30&past=true", "max-age=600, stale-while-revalidate=3000", `${BACKEND}/events?page=1&limit=30&past=true`],
    ["brand-partners", "max-age=300, stale-while-revalidate=3300", `${BACKEND}/brand-partners`],
  ];
  for (const [path, rule, target] of cases) {
    calls = [];
    const res = await proxy(path);
    assert.equal(calls[0].url, target);
    assert.equal(res.headers.get("vercel-cdn-cache-control"), rule, path);
  }
});

test("a ticket lookup is passed through untouched and never stored", async () => {
  const raw = JSON.stringify({ success: true, data: { ticketCode: "UE-DANCE-ABC123", participantName: "Ravi" } });
  reply = () => new Response(raw, { status: 200, headers: { "content-type": "application/json" } });

  const res = await proxy("participants/check?ticketCode=UE-DANCE-ABC123");

  assert.equal(calls[0].url, `${BACKEND}/participants/check?ticketCode=UE-DANCE-ABC123`);
  assert.equal(await res.text(), raw);
  assert.deepEqual(Object.fromEntries(res.headers), { "content-type": "application/json", ...NO_STORE });
});

test("errors keep their status and body and are never stored", async () => {
  for (const status of [404, 410, 429, 500, 503]) {
    const raw = JSON.stringify({ success: false, error: `status ${status}` });
    reply = () => new Response(raw, { status, headers: { "content-type": "application/json" } });
    const res = await proxy("events/onam-fest-2026");
    assert.equal(res.status, status);
    assert.equal(await res.text(), raw);
    assert.equal(res.headers.get("cache-control"), "no-store", `status ${status}`);
    assert.equal(res.headers.get("vercel-cdn-cache-control"), null, `status ${status}`);
  }
});

test("a 200 that is not JSON is passed through but never stored", async () => {
  // e.g. a login page the fetch reached by following a redirect.
  for (const type of ["text/html; charset=utf-8", null]) {
    const raw = "<!doctype html><title>Sign in</title>";
    // Bytes, so a missing content-type stays missing.
    reply = () => new Response(new TextEncoder().encode(raw), { status: 200, headers: type ? { "content-type": type } : {} });
    const res = await proxy("events?page=1&limit=8&upcoming=true");
    assert.equal(res.status, 200);
    assert.equal(await res.text(), raw);
    assert.equal(res.headers.get("cache-control"), "no-store", String(type));
    assert.equal(res.headers.get("vercel-cdn-cache-control"), null, String(type));
  }
});

test("a non-canonical or re-routed read is passed through but not stored", async () => {
  reply = () => json({ success: true });

  let res = await proxy("events/onam-fest-2026?fresh=1");
  assert.equal(calls[0].url, `${BACKEND}/events/onam-fest-2026?fresh=1`);
  assert.equal(res.headers.get("cache-control"), "no-store");

  res = await proxy("events/onam-fest-2026", { headers: { "x-astro-path": "/api/public/events/other" } });
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("vercel-cdn-cache-control"), null);
});

test("reads drop the visitor's origin headers and validators, and relay the visitor IP", async () => {
  reply = () => json({ success: true });
  await proxy("events/onam-fest-2026", {
    headers: {
      origin: "https://www.ulsaaham.com",
      referer: "https://www.ulsaaham.com/events",
      "if-none-match": '"abc"',
      "if-modified-since": "Tue, 01 Sep 2026 00:00:00 GMT",
      accept: "application/json",
    },
  });
  const sent = new Headers(calls[0].init.headers);
  for (const name of ["origin", "referer", "if-none-match", "if-modified-since"]) {
    assert.equal(sent.get(name), null, `${name} was forwarded`);
  }
  assert.equal(sent.get("accept"), "application/json");
  assert.equal(sent.get("x-client-ip"), "203.0.113.10");
  assert.equal(sent.get("x-proxy-key"), ENV.PROXY_SHARED_SECRET);
  assert.ok(calls[0].init.signal instanceof AbortSignal, "the read has no timeout");
});

test("HEAD is answered without a body and never stored", async () => {
  reply = () => new Response(null, { status: 200, headers: { "content-type": "application/json" } });
  const res = await proxy("events?page=1&limit=8&upcoming=true", { method: "HEAD" });
  assert.equal(calls[0].init.method, "HEAD");
  assert.equal(res.status, 200);
  assert.equal(res.body, null);
  assert.equal(res.headers.get("cache-control"), "no-store");
});

test("an empty-bodied upstream status passes through", async () => {
  reply = () => new Response(null, { status: 204 });
  const res = await proxy("brand-partners");
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("cache-control"), "no-store");
});

function fakeTimeout() {
  const seen = [];
  AbortSignal.timeout = (ms) => {
    seen.push(ms);
    const controller = new AbortController();
    setTimeout(() => controller.abort(new DOMException("The operation timed out.", "TimeoutError")), 5);
    return controller.signal;
  };
  return seen;
}

test("a read the admin panel does not answer in 8 s ends in a JSON 504", async () => {
  const seen = fakeTimeout();
  reply = (_url, init) =>
    new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(init.signal.reason)));

  const res = await proxy("events/onam-fest-2026");

  assert.deepEqual(seen, [8000]);
  assert.equal(res.status, 504);
  assert.deepEqual(Object.fromEntries(res.headers), { "content-type": "application/json", ...NO_STORE });
  assert.deepEqual(await res.json(), { success: false, error: "The server took too long to respond. Please try again." });
});

test("the timeout also covers a body that stalls", async () => {
  fakeTimeout();
  reply = (_url, init) => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"success":'));
        init.signal.addEventListener("abort", () => controller.error(init.signal.reason));
      },
    });
    return new Response(stream, { status: 200, headers: { "content-type": "application/json" } });
  };

  const res = await proxy("events?page=1&limit=8&upcoming=true");
  assert.equal(res.status, 504);
  assert.equal(res.headers.get("cache-control"), "no-store");
});

test("an unreachable admin panel gives the same 503 as before", async () => {
  reply = () => { throw new TypeError("fetch failed"); };
  for (const method of ["GET", "POST"]) {
    const res = await proxy("events/onam-fest-2026", { method, body: method === "POST" ? "{}" : undefined });
    assert.equal(res.status, 503, method);
    assert.deepEqual(Object.fromEntries(res.headers), { "content-type": "application/json", ...NO_STORE });
    assert.equal(
      await res.text(),
      JSON.stringify({ success: false, error: "Service temporarily unavailable. Please try again." })
    );
  }
});

// ─── Writes ───

/** Records each timeout asked for, and lets it run as normal. */
function watchTimeouts() {
  const seen = [];
  AbortSignal.timeout = (ms) => {
    seen.push(ms);
    return realTimeout.call(AbortSignal, ms);
  };
  return seen;
}

test("a write is sent as the exact bytes, with a 25 s limit, and never stored", async () => {
  const seen = watchTimeouts();
  const sentBody = JSON.stringify({ name: "Ravi ₹ മലയാളം 🎟", phone: "9876543210", numberOfParticipants: 2 });
  let received;
  reply = async (_url, init) => {
    received = new Uint8Array(await new Response(init.body).arrayBuffer());
    return new Response('{"success":true,"data":{"ticketCode":"UE-X"}}', {
      status: 201,
      headers: { "content-type": "application/json", "vercel-cdn-cache-control": "max-age=999" },
    });
  };

  const res = await proxy("events/onam-fest-2026/register", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://www.ulsaaham.com", cookie: "a=b" },
    body: sentBody,
  });

  const { url, init } = calls[0];
  assert.equal(url, `${BACKEND}/events/onam-fest-2026/register`);
  assert.equal(init.method, "POST");
  assert.ok(init.body instanceof ArrayBuffer, "the body was not read in full before sending");
  assert.equal(init.duplex, undefined, "the body is still streamed");
  assert.deepEqual(received, new TextEncoder().encode(sentBody), "the body bytes changed on the way through");
  assert.ok(init.signal instanceof AbortSignal, "the write has no timeout");
  assert.deepEqual(seen, [25000]);
  const sent = new Headers(init.headers);
  assert.equal(sent.get("origin"), null);
  assert.equal(sent.get("cookie"), null, "the visitor's cookies reached the admin panel");
  assert.equal(sent.get("x-client-ip"), "203.0.113.10");

  assert.equal(res.status, 201);
  assert.equal(await res.text(), '{"success":true,"data":{"ticketCode":"UE-X"}}');
  assert.deepEqual(Object.fromEntries(res.headers), { "content-type": "application/json", ...NO_STORE });
});

test("only four request headers reach the admin panel, plus the proxy's own handshake", async () => {
  reply = () => json({ success: true });
  const visitor = {
    "content-type": "application/json",
    accept: "application/json",
    "accept-language": "ml-IN,en;q=0.8",
    "user-agent": "TestPhone/1.0",
    cookie: "otp_session=abc; google_auth_result=xyz",
    authorization: "Bearer stolen",
    "x-client-ip": "10.9.8.7",
    "x-proxy-key": "guessed-key",
    "x-forwarded-for": "10.9.8.7",
    "accept-encoding": "zstd",
    origin: "https://www.ulsaaham.com",
    referer: "https://www.ulsaaham.com/events/detail",
    "if-none-match": '"abc"',
  };

  for (const [method, path] of [["GET", "events/onam-fest-2026"], ["POST", "events/onam-fest-2026/payment/verify"]]) {
    calls = [];
    await proxy(path, { method, headers: visitor, body: method === "POST" ? "{}" : undefined });
    const sent = new Headers(calls[0].init.headers);
    assert.deepEqual(
      [...sent.keys()].sort(),
      ["accept", "accept-language", "content-type", "user-agent", "x-client-ip", "x-proxy-key"],
      method
    );
    assert.equal(sent.get("x-client-ip"), "203.0.113.10", `${method}: the visitor chose the relayed IP`);
    assert.equal(sent.get("x-proxy-key"), ENV.PROXY_SHARED_SECRET, `${method}: the visitor chose the proxy key`);
    assert.equal(sent.get("user-agent"), "TestPhone/1.0");
    assert.equal(sent.get("accept-language"), "ml-IN,en;q=0.8");
  }
});

test("without the secret no visitor handshake gets through, and production says so once", async () => {
  setTestEnv({ BACKEND_URL: BACKEND, NODE_ENV: "production", PROXY_SHARED_SECRET: undefined });
  const route = (await loadSource("src/pages/api/public/[...path].js")).ALL;
  const warn = captureConsole("warn");
  reply = () => json({ success: true });

  try {
    for (let i = 0; i < 3; i += 1) {
      calls = [];
      await proxy("events/onam-fest-2026/payment/order", {
        route,
        method: "POST",
        headers: { "content-type": "application/json", "x-client-ip": "10.9.8.7", "x-proxy-key": "guessed-key", cookie: "a=b" },
        body: "{}",
      });
      const sent = new Headers(calls[0].init.headers);
      for (const name of ["x-client-ip", "x-proxy-key", "cookie"]) {
        assert.equal(sent.get(name), null, `the visitor's ${name} was relayed`);
      }
    }
    const notes = warn.lines.filter((line) => line.includes("PROXY_SHARED_SECRET"));
    assert.equal(notes.length, 1, "the missing secret was not reported exactly once");
  } finally {
    warn.restore();
    setTestEnv(ENV);
  }

  // A local build runs without the secret on purpose and stays quiet.
  setTestEnv({ BACKEND_URL: BACKEND, PROXY_SHARED_SECRET: undefined });
  const local = (await loadSource("src/pages/api/public/[...path].js")).ALL;
  const quiet = captureConsole("warn");
  try {
    await proxy("brand-partners", { route: local });
    assert.equal(quiet.lines.filter((line) => line.includes("PROXY_SHARED_SECRET")).length, 0);
  } finally {
    quiet.restore();
    setTestEnv(ENV);
  }
});

test("every endpoint the site uses is relayed to the same path", async () => {
  reply = () => json({ success: true });
  const cases = [
    ["GET", "events?page=1&limit=8&upcoming=true"],
    ["GET", "events/onam-fest-2026"],
    ["GET", "events/onam-fest-2026?fresh=1"],
    ["GET", "brand-partners"],
    ["GET", "participants/check?ticketCode=UE-DANCE-ABC123"],
    ["POST", "events/onam-fest-2026/register"],
    ["POST", "events/onam-fest-2026/apply-coupon"],
    ["POST", "events/onam-fest-2026/payment/order"],
    ["POST", "events/onam-fest-2026/payment/verify"],
    ["POST", "events/onam-fest-2026/payment/status"],
    ["POST", "participants/my-tickets"],
    ["POST", "participants/my-tickets-by-user"],
  ];
  for (const [method, path] of cases) {
    calls = [];
    const res = await proxy(path, { method, body: method === "POST" ? "{}" : undefined });
    assert.equal(res.status, 200, `${method} ${path}`);
    assert.equal(calls.length, 1, `${method} ${path} did not reach the admin panel`);
    assert.equal(calls[0].url, `${BACKEND}/${path}`);
  }
});

test("a path the site does not use is refused without asking the admin panel", async () => {
  reply = () => json({ success: true });
  const paths = [
    "",
    "settings",
    "admin/upload",
    "auth/session",
    "participants",
    "participants/update",
    "participants/check/extra",
    "events/",
    "events/onam-fest-2026/delete",
    "events/onam-fest-2026/payment",
    "events/onam-fest-2026/payment/refund",
    "events/onam-fest-2026/register/x",
    "events/Onam-Fest",
    "events/onam_fest",
    "events/onam.fest",
    "brand-partners/1",
  ];
  for (const path of paths) {
    for (const method of ["GET", "POST"]) {
      calls = [];
      const res = await proxy(path, { method, body: method === "POST" ? "{}" : undefined });
      assert.equal(res.status, 404, `${method} /${path}`);
      assert.equal(calls.length, 0, `${method} /${path} reached the admin panel`);
      assert.deepEqual(await res.json(), { success: false, error: "Not found." });
      assert.equal(res.headers.get("cache-control"), "no-store");
    }
  }
});

test("encoded, dot and backslash paths never reach the admin panel", async () => {
  reply = () => json({ success: true });

  // A single-encoded dot segment is resolved by the URL parser before any
  // routing, so such a request never names this route at all.
  assert.equal(new URL("https://www.ulsaaham.com/api/public/%2e%2e/admin/upload").pathname, "/api/admin/upload");

  // Real request URLs, decoded once on the way in as Astro does.
  const urls = [
    "%252e%252e/admin/upload",
    "events/%252e%252e/%252e%252e/admin/upload",
    "events/onam-fest-2026/%252e%252e/register",
    "events/onam%2Ffest-2026",
    "events/onam%252Ffest",
    "events%5C..%5Cadmin%5Cupload",
    "events/onam-fest-2026%5Cregister",
  ];
  for (const path of urls) {
    for (const method of ["GET", "POST"]) {
      calls = [];
      const res = await proxy(path, { method, body: method === "POST" ? "{}" : undefined });
      assert.equal(res.status, 404, `${method} ${path}`);
      assert.equal(calls.length, 0, `${method} ${path} reached the admin panel`);
    }
  }

  // Paths handed to the route directly.
  const params = [
    "..",
    "../admin/upload",
    "events/..",
    "events/../../admin/upload",
    "events/onam-fest-2026/..",
    "events/..%2f..%2fadmin",
    "%2e%2e/admin/upload",
    "events\\..\\admin",
    "events/onam-fest-2026\\register",
  ];
  for (const path of params) {
    calls = [];
    const res = await proxyParams(path, { method: "POST", body: "{}" });
    assert.equal(res.status, 404, path);
    assert.equal(calls.length, 0, `${path} reached the admin panel`);
  }
});

test("only GET, HEAD, POST and OPTIONS are relayed", async () => {
  reply = () => json({ success: true });
  for (const method of ["PUT", "PATCH", "DELETE", "PROPFIND"]) {
    calls = [];
    const res = await proxy("events/onam-fest-2026/register", { method, body: method === "DELETE" ? undefined : "{}" });
    assert.equal(res.status, 405, method);
    assert.equal(res.headers.get("allow"), "GET, HEAD, POST, OPTIONS");
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(calls.length, 0, `${method} reached the admin panel`);
  }

  reply = () => new Response(null, { status: 204 });
  calls = [];
  const res = await proxy("events/onam-fest-2026/payment/order", { method: "OPTIONS" });
  assert.equal(calls[0].init.method, "OPTIONS");
  assert.equal(calls[0].init.body, undefined);
  assert.equal(res.status, 204);
  assert.equal(res.body, null);
});

test("write answers keep their status, body and Retry-After, and are never stored", async () => {
  for (const status of [200, 201, 400, 404, 409, 410, 429, 500, 502, 503, 504]) {
    const raw = JSON.stringify({ success: status < 300, error: `status ${status}`, code: "SOME_CODE" });
    const wait = status === 429 || status === 503 ? { "retry-after": "120" } : {};
    reply = () => new Response(raw, { status, headers: { "content-type": "application/json", ...wait } });

    const res = await proxy("events/onam-fest-2026/payment/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(res.status, status);
    assert.equal(await res.text(), raw, `status ${status}`);
    assert.deepEqual(
      Object.fromEntries(res.headers),
      { "content-type": "application/json", ...NO_STORE, ...wait },
      `status ${status}`
    );
  }
});

test("a read's Retry-After reaches the browser too", async () => {
  reply = () => json({ success: false, error: "slow down" }, 429, { "retry-after": "30" });
  const res = await proxy("events/onam-fest-2026");
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("retry-after"), "30");
  assert.equal(res.headers.get("cache-control"), "no-store");
});

test("a write the admin panel does not answer in 25 s ends in a JSON 504", async () => {
  const seen = fakeTimeout();
  reply = (_url, init) =>
    new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(init.signal.reason)));

  const res = await proxy("events/onam-fest-2026/payment/verify", { method: "POST", body: "{}" });

  assert.deepEqual(seen, [25000]);
  assert.equal(res.status, 504);
  assert.deepEqual(Object.fromEntries(res.headers), { "content-type": "application/json", ...NO_STORE });
  assert.deepEqual(await res.json(), { success: false, error: "The server took too long to respond. Please try again." });

  // An answer whose body stalls runs into the same limit.
  fakeTimeout();
  reply = (_url, init) => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"success":'));
        init.signal.addEventListener("abort", () => controller.error(init.signal.reason));
      },
    });
    return new Response(stream, { status: 201, headers: { "content-type": "application/json" } });
  };
  const stalled = await proxy("events/onam-fest-2026/register", { method: "POST", body: "{}" });
  assert.equal(stalled.status, 504);
});

test("a platform error page on a write becomes JSON with the same status", async () => {
  const cases = [
    [502, "text/html; charset=utf-8", "<html>Bad gateway</html>", /temporarily unavailable/i],
    [503, "text/html", "<html>Unavailable</html>", /temporarily unavailable/i],
    [504, "text/html", "<html>Gateway timeout</html>", /took too long/i],
    [500, "text/plain", "Internal Server Error", /temporarily unavailable/i],
    [404, "text/html", "<!doctype html><title>404</title>", /not found/i],
    [429, "text/plain", "slow down", /too many requests/i],
    [413, null, "Payload Too Large", /could not be completed/i],
  ];
  for (const [status, type, raw, pattern] of cases) {
    const headers = type ? { "content-type": type } : {};
    if (status === 429) headers["retry-after"] = "60";
    // Bytes, so a missing content-type stays missing.
    reply = () => new Response(new TextEncoder().encode(raw), { status, headers });

    const res = await proxy("events/onam-fest-2026/payment/order", { method: "POST", body: "{}" });
    assert.equal(res.status, status);
    assert.equal(res.headers.get("content-type"), "application/json", `status ${status}`);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.headers.get("retry-after"), status === 429 ? "60" : null);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, pattern, `status ${status}`);
  }

  // A success that is not JSON is passed through as it came.
  reply = () => new Response("<html>ok</html>", { status: 200, headers: { "content-type": "text/html" } });
  const ok = await proxy("events/onam-fest-2026/register", { method: "POST", body: "{}" });
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("content-type"), "text/html");
  assert.equal(await ok.text(), "<html>ok</html>");
});

test("a BACKEND_URL that leaves /api/public refuses everything without a request", async () => {
  setTestEnv({ BACKEND_URL: "https://admin.example.test/other", NODE_ENV: "production" });
  const route = (await loadSource("src/pages/api/public/[...path].js")).ALL;
  const errors = captureConsole("error");
  reply = () => json({ success: true });

  try {
    for (const [method, path] of [["GET", "events/onam-fest-2026"], ["POST", "events/onam-fest-2026/register"]]) {
      calls = [];
      const res = await proxy(path, { route, method, body: method === "POST" ? "{}" : undefined });
      assert.equal(res.status, 503, method);
      assert.equal(calls.length, 0, `${method} was sent outside /api/public`);
      assert.deepEqual(await res.json(), { success: false, error: "Service temporarily unavailable. Please try again." });
    }
    assert.equal(errors.lines.filter((line) => line.includes("BACKEND_URL")).length, 1, "the misconfiguration was not reported once");
  } finally {
    errors.restore();
    setTestEnv(ENV);
  }
});
