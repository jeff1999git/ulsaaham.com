// The early requests a page starts from its inline script, and how the islands
// pick them up. A path that differs from what an island asks for by a single
// character wastes the request and misses the edge cache, so the paths, the
// inline script and the policy are checked against each other here.
import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { setTestEnv } from "../mail/support/env.mjs";
import { loadSource } from "../mail/support/load.mjs";
import { appPath } from "../mail/support/paths.mjs";

setTestEnv();

const api = await loadSource("src/lib/api.js");
const pageData = await loadSource("src/lib/page-data.js");
const { edgePolicy } = await loadSource("src/lib/edge-cache.js");

const read = (rel) => fs.readFileSync(appPath(rel), "utf8");

// ─── A browser stand-in for api.js ───
/* global window -- the stand-in beforeEach puts on globalThis */
let calls = [];
let reply = () => new Response(JSON.stringify({ success: true, from: "network" }), { status: 200 });
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), init });
  return reply(url, init);
};
after(() => {
  globalThis.fetch = realFetch;
  delete globalThis.window;
});
beforeEach(() => {
  calls = [];
  globalThis.window = { __ulsPre: {} };
});

const settled = (value) => Promise.resolve(value);

test("list paths are written in the order the edge cache keeps", () => {
  assert.equal(api.eventsPath({ upcoming: true, limit: 8 }), "/events?page=1&limit=8&upcoming=true");
  assert.equal(api.eventsPath({ past: true, limit: 30 }), "/events?page=1&limit=30&past=true");
  assert.equal(api.eventsPath({ featured: true, limit: 12 }), "/events?page=1&limit=12&featured=true");
  assert.equal(
    api.eventsPath({ upcoming: true, featured: false, limit: 12, page: 2 }),
    "/events?page=2&limit=12&featured=false&upcoming=true"
  );
  // Unset flags are left out rather than written as false.
  assert.equal(api.eventsPath({ limit: 8, upcoming: false, past: undefined }), "/events?page=1&limit=8");
});

test("every page's early request is one the edge cache keeps", () => {
  assert.deepEqual(pageData.HOME_PREFETCH, [
    "/events?page=1&limit=8&upcoming=true",
    "/events?page=1&limit=30&past=true",
    "/brand-partners",
  ]);
  assert.deepEqual(pageData.EVENTS_PREFETCH, [
    "/events?page=1&limit=12&featured=true",
    "/events?page=1&limit=12&featured=false&upcoming=true",
    "/events?page=1&limit=8&past=true",
  ]);
  for (const full of [...pageData.HOME_PREFETCH, ...pageData.EVENTS_PREFETCH, "/events/onam-fest-2026"]) {
    const [pathname, query = ""] = full.split("?");
    const search = query ? `?${query}` : "";
    assert.ok(edgePolicy("GET", pathname.slice(1), search, 200, new Headers()), `${full} would not be cached`);
  }
});

test("the islands ask for exactly what their page prefetches", async () => {
  const asked = async (call) => {
    calls = [];
    globalThis.window = { __ulsPre: {} };
    await call();
    return calls.map((c) => c.url.replace(/^\/api\/public/, ""));
  };
  // Home: HomeEvents, PastEventsRunner and BrandPartners.
  assert.deepEqual(
    [
      ...(await asked(() => api.getEvents(pageData.HOME_UPCOMING))),
      ...(await asked(() => api.getEvents(pageData.HOME_PAST))),
      ...(await asked(() => api.getBrandPartners())),
    ],
    pageData.HOME_PREFETCH
  );
  // /events: the first page of each section.
  const sections = [pageData.EVENTS_FEATURED, pageData.EVENTS_UPCOMING, pageData.EVENTS_PAST];
  const firstPages = [];
  for (const query of sections) firstPages.push(...(await asked(() => api.getEvents({ ...query, page: 1 }))));
  assert.deepEqual(firstPages, pageData.EVENTS_PREFETCH);
  // The detail page.
  assert.deepEqual(await asked(() => api.getEvent("onam fest/2026")), ["/events/onam%20fest%2F2026"]);
});

test("the pages and islands use the shared list rather than their own copies", () => {
  assert.match(read("src/pages/index.astro"), /<ApiPrefetch paths=\{HOME_PREFETCH\} \/>/);
  assert.match(read("src/pages/events/index.astro"), /<ApiPrefetch slot="head" paths=\{EVENTS_PREFETCH\} \/>/);
  assert.match(read("src/pages/events/detail.astro"), /<ApiPrefetch slot="head" eventSlug \/>/);
  assert.match(read("src/components/HomeEvents.jsx"), /getEvents\(HOME_UPCOMING\)/);
  assert.match(read("src/components/PastEventsRunner.jsx"), /getEvents\(HOME_PAST\)/);
  assert.match(read("src/components/BrandPartners.jsx"), /getBrandPartners\(\)/);
  const list = read("src/components/EventsList.jsx");
  for (const name of ["EVENTS_FEATURED", "EVENTS_UPCOMING", "EVENTS_PAST"]) {
    assert.match(list, new RegExp(`query: ${name}\\b`), name);
  }
  assert.match(read("src/components/EventDetail.jsx"), /getEvent\(slug\)/);
});

// ─── The inline script, run as the browser would ───

function inlineScript() {
  const source = read("src/components/ApiPrefetch.astro");
  const match = source.match(/<script is:inline define:vars=\{\{ paths, eventSlug \}\}>([\s\S]*?)<\/script>/);
  assert.ok(match, "ApiPrefetch.astro no longer has the expected inline script");
  // define:vars declares each variable ahead of the script body.
  return new Function("window", "fetch", "location", "paths", "eventSlug", match[1]);
}

function runInline({ paths = [], eventSlug = false, search = "", respond }) {
  const win = {};
  const requested = [];
  const fakeFetch = (url) => {
    requested.push(url);
    return Promise.resolve().then(() => respond(url));
  };
  inlineScript()(win, fakeFetch, { search }, paths, eventSlug);
  return { store: win.__ulsPre, requested };
}

test("the inline script starts one request per path, keyed as api.js looks it up", async () => {
  const { store, requested } = runInline({
    paths: pageData.HOME_PREFETCH,
    respond: () => new Response(JSON.stringify({ success: true }), { status: 200 }),
  });
  assert.deepEqual(requested, pageData.HOME_PREFETCH.map((p) => "/api/public" + p));
  assert.deepEqual(Object.keys(store), pageData.HOME_PREFETCH);
  assert.deepEqual(await store["/brand-partners"], { ok: true, status: 200, data: { success: true } });
});

test("on the detail page it requests the event named in the address", async () => {
  const { store, requested } = runInline({
    eventSlug: true,
    search: "?slug=onam%20fest%2F2026&utm_source=wa",
    respond: () => new Response(JSON.stringify({ success: false, error: "Event not found" }), { status: 404 }),
  });
  assert.deepEqual(requested, ["/api/public/events/onam%20fest%2F2026"]);
  assert.deepEqual(await store["/events/onam%20fest%2F2026"], {
    ok: false,
    status: 404,
    data: { success: false, error: "Event not found" },
  });
  assert.deepEqual(runInline({ eventSlug: true, search: "", respond: () => null }).requested, []);
});

test("a rate-limited or broken early response is handed over as 429 or null", async () => {
  const { store } = runInline({
    paths: ["/a", "/b", "/c"],
    respond: (url) => {
      if (url.endsWith("/a")) return new Response("slow down", { status: 429 });
      if (url.endsWith("/b")) return new Response("<html>504</html>", { status: 504 });
      throw new TypeError("offline");
    },
  });
  assert.deepEqual(await store["/a"], { status: 429 });
  assert.equal(await store["/b"], null);
  assert.equal(await store["/c"], null);
});

// ─── api.js picking the results up ───

test("an island takes the early result once; the next call fetches afresh", async () => {
  const path = "/events?page=1&limit=8&upcoming=true";
  window.__ulsPre[path] = settled({ ok: true, status: 200, data: { success: true, from: "early" } });

  const first = await api.getEvents(pageData.HOME_UPCOMING);
  assert.deepEqual(first, { ok: true, status: 200, data: { success: true, from: "early" } });
  assert.equal(calls.length, 0);
  assert.equal(path in window.__ulsPre, false, "the early result was not removed");

  const second = await api.getEvents(pageData.HOME_UPCOMING);
  assert.equal(second.data.from, "network");
  assert.deepEqual(calls.map((c) => c.url), ["/api/public" + path]);
});

test("an early 429 reads like a live one", async () => {
  window.__ulsPre["/brand-partners"] = settled({ status: 429 });
  assert.deepEqual(await api.getBrandPartners(), {
    ok: false,
    status: 429,
    data: { success: false, error: "Too many requests. Please try again in a moment." },
  });
  assert.equal(calls.length, 0);
});

test("a failed early request is retried over the network", async () => {
  window.__ulsPre["/events/onam-fest-2026"] = settled(null);
  const result = await api.getEvent("onam-fest-2026");
  assert.equal(result.data.from, "network");
  assert.deepEqual(calls.map((c) => c.url), ["/api/public/events/onam-fest-2026"]);
});

test("fresh reads bypass both the early result and the edge cache", async () => {
  window.__ulsPre["/events/onam-fest-2026"] = settled({ ok: true, status: 200, data: { from: "early" } });
  const result = await api.getEvent("onam-fest-2026", { fresh: true });
  assert.equal(result.data.from, "network");
  assert.deepEqual(calls.map((c) => c.url), ["/api/public/events/onam-fest-2026?fresh=1"]);
  assert.equal(edgePolicy("GET", "events/onam-fest-2026", "?fresh=1", 200, new Headers()), null);
  assert.ok("/events/onam-fest-2026" in window.__ulsPre, "a fresh read used up the early result");
});

test("requests with their own options never take an early result", async () => {
  window.__ulsPre["/participants/my-tickets-by-user"] = settled({ ok: true, status: 200, data: { from: "early" } });
  const result = await api.getTicketCodesByIdentifier("9876543210");
  assert.equal(result.data.from, "network");
  assert.equal(calls[0].init.method, "POST");
});

test("without a window (server render) api.js just fetches", async () => {
  delete globalThis.window;
  const result = await api.getBrandPartners();
  assert.equal(result.data.from, "network");
});
