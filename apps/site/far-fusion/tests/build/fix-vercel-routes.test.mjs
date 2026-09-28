// The post-build patch that makes Vercel actually apply the adapter's
// "cache /_astro/* forever" rule, and the site-wide security headers with it.
// Routes after { handle: "filesystem" } never run for a file that exists, so
// both rules must sit in front of it.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { appFileUrl, appPath } from "../mail/support/paths.mjs";

const { fixRoutes, SECURITY_HEADERS } = await import(appFileUrl("scripts/fix-vercel-routes.mjs"));
const SCRIPT = appPath("scripts/fix-vercel-routes.mjs");

const IMMUTABLE = {
  src: "^/_astro/(.*)$",
  headers: { "cache-control": "public, max-age=31536000, immutable" },
  continue: true,
};

// What @astrojs/vercel 8.2.11 writes for this site: the filesystem handle first.
const adapterOutput = () => ({
  version: 3,
  routes: [
    { handle: "filesystem" },
    structuredClone(IMMUTABLE),
    { src: "^/_image/?$", dest: "_render" },
    { src: "^/api/public(?:/(.*?))?/?$", dest: "_render" },
    { src: "^/auth/complete/?$", dest: "_render" },
    { src: "/.*", dest: "/404.html", status: 404 },
  ],
});

const filesystemAt = (routes) => routes.findIndex((r) => r.handle === "filesystem");
const immutableAt = (routes) => routes.findIndex((r) => r.src === IMMUTABLE.src);
const headerRules = (routes) => routes.filter((r) => r.headers?.["X-Frame-Options"]);

test("the immutable /_astro rule is moved in front of the filesystem handle", () => {
  const { routes } = fixRoutes(adapterOutput());
  assert.ok(immutableAt(routes) !== -1, "the rule was lost");
  assert.ok(immutableAt(routes) < filesystemAt(routes), "the rule still sits after the filesystem handle");
  assert.deepEqual(routes[immutableAt(routes)], IMMUTABLE, "the rule itself was altered");
});

test("the security headers apply to everything, ahead of the filesystem handle", () => {
  const { routes } = fixRoutes(adapterOutput());
  const rules = headerRules(routes);
  assert.equal(rules.length, 1);
  const [rule] = rules;
  assert.deepEqual(rule.headers, {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  assert.deepEqual(rule.headers, { ...SECURITY_HEADERS });
  assert.equal(rule.continue, true, "a header rule without continue would end routing");
  assert.ok(new RegExp(rule.src).test("/events/detail"));
  assert.ok(new RegExp(rule.src).test("/_astro/client.abc123.js"));
  assert.ok(routes.indexOf(rule) < filesystemAt(routes));
});

test("every other route keeps its order after the filesystem handle", () => {
  const before = adapterOutput().routes.slice(2);
  const { routes } = fixRoutes(adapterOutput());
  assert.deepEqual(routes.slice(filesystemAt(routes) + 1), before);
});

test("a second run changes nothing", () => {
  const once = fixRoutes(adapterOutput());
  const twice = fixRoutes(structuredClone(once));
  assert.deepEqual(twice, once);
  assert.equal(headerRules(twice.routes).length, 1);
});

test("the input config is not modified in place", () => {
  const input = adapterOutput();
  const snapshot = structuredClone(input);
  fixRoutes(input);
  assert.deepEqual(input, snapshot);
});

test("an adapter that already orders the rule correctly is left alone", () => {
  const input = adapterOutput();
  input.routes = [structuredClone(IMMUTABLE), ...input.routes.filter((r) => r.src !== IMMUTABLE.src)];
  const { routes } = fixRoutes(input);
  assert.equal(immutableAt(routes), 0);
  assert.ok(filesystemAt(routes) > immutableAt(routes));
  assert.equal(headerRules(routes).length, 1);
});

test("output with no filesystem handle still gets the headers first", () => {
  const input = { version: 3, routes: [structuredClone(IMMUTABLE), { src: "^/api/(.*)$", dest: "_render" }] };
  const { routes } = fixRoutes(input);
  assert.equal(routes.indexOf(headerRules(routes)[0]), 0);
  assert.equal(immutableAt(routes), 1);
});

test("a missing /_astro rule fails loudly instead of deploying uncached assets", () => {
  const input = adapterOutput();
  input.routes = input.routes.filter((r) => r.src !== IMMUTABLE.src);
  assert.throws(() => fixRoutes(input), /immutable \/_astro rule/);
  assert.throws(() => fixRoutes({ version: 3 }), /no routes array/);
});

test("Vercel's own route validator accepts the patched routes", async (t) => {
  let normalizeRoutes;
  try {
    const fromAdapter = createRequire(createRequire(appPath("package.json")).resolve("@astrojs/vercel/package.json"));
    ({ normalizeRoutes } = fromAdapter("@vercel/routing-utils"));
  } catch {
    t.skip("@vercel/routing-utils is not installed");
    return;
  }
  const { routes } = fixRoutes(adapterOutput());
  const result = normalizeRoutes(routes);
  assert.equal(result.error, null, result.error?.message);
});

test("the command line patches a config.json on disk and exits non-zero on failure", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fix-vercel-routes-"));
  try {
    const file = path.join(dir, "config.json");
    fs.writeFileSync(file, JSON.stringify(adapterOutput(), null, "\t"));
    execFileSync(process.execPath, [SCRIPT, file], { stdio: "pipe" });
    const written = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.deepEqual(written, fixRoutes(adapterOutput()));

    const broken = adapterOutput();
    broken.routes = broken.routes.filter((r) => r.src !== IMMUTABLE.src);
    fs.writeFileSync(file, JSON.stringify(broken));
    assert.throws(
      () => execFileSync(process.execPath, [SCRIPT, file], { stdio: "pipe" }),
      (error) => error.status === 1 && /immutable \/_astro rule/.test(String(error.stderr))
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
