// Google sign-in, start and callback, driven with the real handlers. Google
// itself is a stubbed fetch, so nothing here reaches the network.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { setTestEnv } from "../mail/support/env.mjs";
import { loadSource } from "../mail/support/load.mjs";
import { makeCookieJar } from "../mail/support/context.mjs";
import { appPath } from "../mail/support/paths.mjs";

setTestEnv({ GOOGLE_CLIENT_ID: "client-id.test", GOOGLE_CLIENT_SECRET: "client-secret-test" });

const { readGoogleResult } = await loadSource("src/lib/google-complete.js");

// Google's two endpoints. Each test says what they answer.
let googleReply = {};
const googleCalls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  googleCalls.push(String(url));
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  if (String(url).startsWith("https://oauth2.googleapis.com/token")) return json({ access_token: "token-test" });
  if (String(url).startsWith("https://www.googleapis.com/oauth2/v2/userinfo")) return json(googleReply.profile);
  throw new Error("unexpected fetch " + url);
};

const realConsoleError = console.error;
console.error = () => {};

after(() => {
  globalThis.fetch = realFetch;
  console.error = realConsoleError;
});

const PROFILE = {
  id: "10987654321",
  email: "guest@example.test",
  verified_email: true,
  name: "Guest </script><img src=x>",
  picture: "https://lh3.googleusercontent.test/a/pic",
};

function makeGetContext(url, cookies = makeCookieJar()) {
  return {
    cookies,
    request: new Request(url),
    redirect: (location, status = 302) => new Response(null, { status, headers: { Location: location } }),
  };
}

/** Starts a sign-in and returns what the browser would carry back. */
async function start(next = "/events/detail?slug=onam") {
  const { GET } = await loadSource("src/pages/api/auth/google.js");
  const jar = makeCookieJar();
  const response = await GET(
    makeGetContext(`https://www.ulsaaham.com/api/auth/google?next=${encodeURIComponent(next)}`, jar)
  );
  const location = new URL(response.headers.get("location"));
  return { jar, response, location, state: location.searchParams.get("state"), nonce: jar.last("g_oauth_nonce") };
}

async function callback({ query, cookies }) {
  const { GET } = await loadSource("src/pages/api/auth/google/callback.js");
  const jar = makeCookieJar(cookies);
  const response = await GET(
    makeGetContext(`https://www.ulsaaham.com/api/auth/google/callback?${new URLSearchParams(query)}`, jar)
  );
  return { jar, response, location: response.headers.get("location") };
}

const stateWith = (data) => Buffer.from(JSON.stringify(data)).toString("base64");

test("the start sets a nonce cookie that only the Google routes see, and puts it in the state", async () => {
  const { response, location, state, nonce } = await start();

  assert.equal(response.status, 302);
  assert.equal(location.origin + location.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(location.searchParams.get("redirect_uri"), "https://www.ulsaaham.com/api/auth/google/callback");

  assert.ok(nonce, "no nonce cookie was set");
  assert.match(nonce.value, /^[A-Za-z0-9_-]{22}$/, "the nonce is not 16 random bytes");
  assert.deepEqual(nonce.options, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 600,
    path: "/api/auth/google",
  });

  const data = JSON.parse(Buffer.from(state, "base64").toString());
  assert.deepEqual(data, { next: "/events/detail?slug=onam", nonce: nonce.value });

  const again = await start();
  assert.notEqual(again.nonce.value, nonce.value, "two sign-ins were given the same nonce");
});

test("the nonce cookie is Secure in production", async () => {
  setTestEnv({ NODE_ENV: "production", GOOGLE_CLIENT_ID: "client-id.test" });
  const { nonce } = await start();
  assert.equal(nonce.options.secure, true);
  setTestEnv({ GOOGLE_CLIENT_ID: "client-id.test", GOOGLE_CLIENT_SECRET: "client-secret-test" });
});

test("a callback this browser did not start is refused before the code is spent", async () => {
  const { state, nonce } = await start();
  const other = await start();
  googleReply = { profile: PROFILE };

  const cases = [
    ["no cookie", { code: "c", state }, {}],
    ["another sign-in's nonce", { code: "c", state }, { g_oauth_nonce: other.nonce.value }],
    ["a nonce of another length", { code: "c", state }, { g_oauth_nonce: nonce.value + "x" }],
    ["a state with no nonce", { code: "c", state: stateWith({ next: "/account" }) }, { g_oauth_nonce: nonce.value }],
    ["an empty nonce on both sides", { code: "c", state: stateWith({ nonce: "" }) }, { g_oauth_nonce: "" }],
    ["a state that is not JSON", { code: "c", state: "not-base64-json" }, { g_oauth_nonce: nonce.value }],
    ["no state", { code: "c" }, { g_oauth_nonce: nonce.value }],
  ];

  for (const [label, query, cookies] of cases) {
    const before = googleCalls.length;
    const { jar, location } = await callback({ query, cookies });
    assert.equal(location, "/login?error=google_state", `${label}: not refused`);
    assert.equal(googleCalls.length, before, `${label}: the code was exchanged anyway`);
    assert.equal(jar.last("google_auth_result"), undefined, `${label}: a sign-in result was handed out`);
    assert.ok(
      jar.deletes.some((entry) => entry.name === "g_oauth_nonce" && entry.options?.path === "/api/auth/google"),
      `${label}: the nonce cookie was not cleared on its own path`
    );
  }
});

test("a cancelled sign-in still clears the nonce", async () => {
  const { state, nonce } = await start();
  const { jar, location } = await callback({
    query: { error: "access_denied", state },
    cookies: { g_oauth_nonce: nonce.value },
  });
  assert.equal(location, "/login?error=google_denied");
  assert.ok(jar.deletes.some((entry) => entry.name === "g_oauth_nonce"));
});

test("an address Google has not verified is refused", async () => {
  for (const profile of [
    { ...PROFILE, verified_email: false },
    { ...PROFILE, verified_email: "true" },
    { ...PROFILE, verified_email: undefined },
    { ...PROFILE, email: "" },
    { ...PROFILE, email: undefined },
  ]) {
    const { state, nonce } = await start();
    googleReply = { profile };
    const { jar, location } = await callback({ query: { code: "c", state }, cookies: { g_oauth_nonce: nonce.value } });
    assert.equal(location, "/login?error=google_unverified", `accepted ${JSON.stringify(profile)}`);
    assert.equal(jar.last("google_auth_result"), undefined, "a sign-in result was handed out");
  }
});

test("a matching sign-in hands the profile to /auth/complete in a script-readable cookie", async () => {
  const { state, nonce } = await start("/events/detail?slug=onam#register");
  googleReply = { profile: PROFILE };

  const { jar, response, location } = await callback({
    query: { code: "c", state },
    cookies: { g_oauth_nonce: nonce.value },
  });

  assert.equal(response.status, 302);
  assert.equal(location, "/auth/complete?next=" + encodeURIComponent("/events/detail?slug=onam#register"));
  assert.ok(jar.deletes.some((entry) => entry.name === "g_oauth_nonce"), "the nonce outlived its use");

  const result = jar.last("google_auth_result");
  assert.ok(result, "no result cookie");
  assert.deepEqual(result.options, { httpOnly: false, secure: false, sameSite: "lax", maxAge: 60, path: "/" });
  assert.deepEqual(JSON.parse(result.value), {
    email: PROFILE.email,
    name: PROFILE.name,
    avatar: PROFILE.picture,
    googleId: PROFILE.id,
  });
});

test("the result cookie, as Astro writes it, reads back on the complete page", async () => {
  // Astro's own cookie writer, so a change in how it encodes values shows up
  // here rather than as a broken sign-in.
  const astroDir = path.dirname(createRequire(appPath("package.json")).resolve("astro/package.json"));
  const cookiesModule = path.join(astroDir, "dist", "core", "cookies", "cookies.js");
  assert.ok(fs.existsSync(cookiesModule), "Astro moved its cookie module; point this test at the new one");
  const { AstroCookies } = await import(pathToFileURL(cookiesModule).href);

  const { state, nonce } = await start();
  googleReply = { profile: PROFILE };
  const { jar } = await callback({ query: { code: "c", state }, cookies: { g_oauth_nonce: nonce.value } });
  const result = jar.last("google_auth_result");

  const astro = new AstroCookies(new Request("https://www.ulsaaham.com/api/auth/google/callback"));
  astro.set(result.name, result.value, result.options);
  const header = [...astro.headers()].find((line) => line.startsWith("google_auth_result="));
  assert.ok(header, "Astro wrote no result cookie");

  // What document.cookie shows for it: the name=value pair, nothing else.
  const pair = header.split(";")[0];
  assert.ok(/^google_auth_result=[!#-+\--:<-[\]-~]*$/.test(pair), "the value holds characters a cookie cannot");

  assert.deepEqual(readGoogleResult(`theme=dark; ${pair}; other=1`), {
    email: PROFILE.email,
    name: PROFILE.name,
    avatar: PROFILE.picture,
    googleId: PROFILE.id,
  });
});
