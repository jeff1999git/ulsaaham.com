// Where the site's server code reaches the admin panel. An unset BACKEND_URL
// must never point a development run at production, and the variable should
// work whether or not it carries the /api/public path.
import test, { after } from "node:test";
import assert from "node:assert/strict";

import { setTestEnv } from "../mail/support/env.mjs";
import { loadSource } from "../mail/support/load.mjs";

const warnings = [];
const realWarn = console.warn;
console.warn = (...args) => warnings.push(args.map(String).join(" "));
after(() => {
  console.warn = realWarn;
});

async function backendUrlWith(env) {
  setTestEnv(env);
  const { BACKEND_URL } = await loadSource("src/lib/backend.js");
  return BACKEND_URL;
}

test("a production build with no BACKEND_URL uses the live admin panel", async () => {
  assert.equal(
    await backendUrlWith({ NODE_ENV: "production" }),
    "https://ulsaham-admin-panel.vercel.app/api/public"
  );
});

test("anything else with no BACKEND_URL uses a local admin panel, and says so", async () => {
  const before = warnings.length;
  assert.equal(await backendUrlWith({}), "http://localhost:3000/api/public");
  assert.ok(warnings.slice(before).some((line) => line.includes("BACKEND_URL")), "no warning was printed");
});

test("a bare origin gets the public API path", async () => {
  assert.equal(
    await backendUrlWith({ BACKEND_URL: "https://admin.example.test" }),
    "https://admin.example.test/api/public"
  );
  assert.equal(
    await backendUrlWith({ BACKEND_URL: "http://localhost:3000/" }),
    "http://localhost:3000/api/public"
  );
});

test("a full URL is kept, without trailing slashes", async () => {
  assert.equal(
    await backendUrlWith({ BACKEND_URL: "https://admin.example.test/api/public//", NODE_ENV: "production" }),
    "https://admin.example.test/api/public"
  );
});
