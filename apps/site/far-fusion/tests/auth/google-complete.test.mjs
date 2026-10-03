// The last step of Google sign-in, which runs in the browser on the static
// /auth/complete page, and the local account store it writes. A stand-in
// localStorage, document and location are enough; nothing here needs a build.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { appFileUrl, appPath } from "../mail/support/paths.mjs";

function makeStorage(initial = {}) {
  const items = new Map(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
  return {
    failWrites: false,
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem(key, value) {
      if (this.failWrites) throw new Error("QuotaExceededError");
      items.set(key, String(value));
    },
    removeItem: (key) => items.delete(key),
    read: (key) => (items.has(key) ? JSON.parse(items.get(key)) : undefined),
  };
}

let storage;
const useStorage = (initial) => {
  storage = makeStorage(initial);
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true, writable: true });
};
beforeEach(() => useStorage());

const { completeGoogleSignIn, readGoogleResult, RESULT_COOKIE } = await import(appFileUrl("src/lib/google-complete.js"));
const { setUser, clearUser, getKnownAccount, getUser } = await import(appFileUrl("src/lib/auth.js"));

function makeDocument(cookie = "") {
  const writes = [];
  return {
    writes,
    get cookie() {
      return cookie;
    },
    set cookie(value) {
      writes.push(value);
    },
  };
}

const at = (search = "", protocol = "https:") => ({ search, protocol });

const PROFILE = {
  email: "guest@example.test",
  name: "Guest",
  avatar: "https://lh3.googleusercontent.test/a/pic",
  googleId: "10987654321",
};

// The callback's JSON, percent-encoded once, which is how Astro writes it.
const resultCookie = (value) => `${RESULT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}`;

const CLEAR = "google_auth_result=; Max-Age=0; path=/; SameSite=Lax";

test("with no result cookie the visitor goes back to the login page", () => {
  const doc = makeDocument("theme=dark");
  assert.equal(completeGoogleSignIn(doc, at("?next=/account")), "/login?error=no_auth_result");
  assert.deepEqual(doc.writes, [CLEAR + "; Secure"]);
  assert.equal(getUser(), null, "someone was signed in without a result");
});

test("a result signs the visitor in, clears the cookie and goes to the page they came from", () => {
  const doc = makeDocument(`theme=dark; ${resultCookie(PROFILE)}`);
  const target = completeGoogleSignIn(doc, at("?next=" + encodeURIComponent("/events/detail?slug=onam#register")));

  assert.equal(target, "/events/detail?slug=onam#register");
  assert.deepEqual(doc.writes, [CLEAR + "; Secure"], "the cookie was not cleared on the path it was set on");
  assert.deepEqual(storage.read("ulsaham_user"), { tickets: [], ...PROFILE });
  assert.deepEqual(storage.read("ulsaham_accounts"), { "guest@example.test": { hasGoogle: true } });
});

test("the cookie is cleared without Secure on plain http, as in local development", () => {
  const doc = makeDocument(resultCookie(PROFILE));
  completeGoogleSignIn(doc, at("", "http:"));
  assert.deepEqual(doc.writes, [CLEAR]);
});

test("the destination is always a path on this site", () => {
  for (const next of ["//evil.example", "https://evil.example/", "javascript:alert(1)", "/\\evil.example", ""]) {
    const doc = makeDocument(resultCookie(PROFILE));
    const target = completeGoogleSignIn(doc, at("?next=" + encodeURIComponent(next)));
    assert.equal(target, "/account", `left the site for ${JSON.stringify(next)}`);
  }
  const markup = completeGoogleSignIn(makeDocument(resultCookie(PROFILE)), at("?next=" + encodeURIComponent("/x?q=</script><b>")));
  assert.ok(!/[<>"]/.test(markup), "markup survived into the destination");
});

test("signing in again keeps what this device holds for the same person", () => {
  setUser({ email: "Guest@Example.test", name: "Old name", phone: "9876543210", age: 31, tickets: [{ ticketCode: "UE-A-1" }] });

  completeGoogleSignIn(makeDocument(resultCookie(PROFILE)), at());
  const user = storage.read("ulsaham_user");
  assert.equal(user.phone, "9876543210", "the phone was dropped");
  assert.equal(user.age, 31, "the age was dropped");
  assert.deepEqual(user.tickets, [{ ticketCode: "UE-A-1" }], "the saved tickets were dropped");
  assert.equal(user.name, "Guest", "the Google name did not apply");
  assert.equal(user.googleId, PROFILE.googleId);
});

test("a different person signing in on the same device starts clean", () => {
  setUser({ email: "someone@example.test", name: "Someone", phone: "9876543210", age: 31, tickets: [{ ticketCode: "UE-A-1" }] });

  completeGoogleSignIn(makeDocument(resultCookie(PROFILE)), at());
  assert.deepEqual(storage.read("ulsaham_user"), { tickets: [], ...PROFILE });
});

test("after logout only the Google flag is left, older stored profiles included", () => {
  useStorage({
    // What an older version left behind: a profile per address.
    ulsaham_accounts: {
      "old-google@example.test": { name: "Old", phone: "9000000000", age: 40, hasGoogle: true, googleId: "1" },
      "old-otp@example.test": { name: "Otp", phone: "9111111111", age: 22, passwordHash: "x", hasGoogle: false },
    },
  });

  // Never handed out, even before anything is rewritten.
  assert.deepEqual(getKnownAccount("Old-Google@example.test"), { hasGoogle: true });
  assert.equal(getKnownAccount("old-otp@example.test"), null);

  setUser({ email: "otp@example.test", name: "Otp user", phone: "9222222222", age: 25 });
  completeGoogleSignIn(makeDocument(resultCookie(PROFILE)), at());
  setUser({ ...getUser(), phone: "9333333333", age: 29 });
  clearUser();

  assert.equal(storage.read("ulsaham_user"), undefined, "the signed-in user survived logout");
  assert.deepEqual(storage.read("ulsaham_accounts"), {
    "old-google@example.test": { hasGoogle: true },
    "guest@example.test": { hasGoogle: true },
  });

  // Back through Google after the logout: nothing personal is waiting.
  completeGoogleSignIn(makeDocument(resultCookie(PROFILE)), at());
  assert.deepEqual(storage.read("ulsaham_user"), { tickets: [], ...PROFILE });
});

test("an address that signed in only by email code leaves nothing after logout", () => {
  setUser({ email: "otp@example.test", name: "Otp user", phone: "9222222222", age: 25 });
  clearUser();
  assert.deepEqual(storage.read("ulsaham_accounts"), {});
  assert.equal(getKnownAccount("otp@example.test"), null);
});

test("only the profile fields, and only as text, are taken from the cookie", () => {
  const hostile = {
    ...PROFILE,
    name: '<img src=x onerror="alert(1)">',
    phone: "planted",
    tickets: [{ ticketCode: "UE-PLANTED-1" }],
    googleId: { toString: null },
    avatar: 42,
  };
  const profile = readGoogleResult(resultCookie(hostile));
  assert.deepEqual(profile, { email: PROFILE.email, name: hostile.name });

  completeGoogleSignIn(makeDocument(resultCookie(hostile)), at());
  const user = storage.read("ulsaham_user");
  assert.equal(user.phone, undefined);
  assert.deepEqual(user.tickets, []);
  // Kept as the literal string; the page never writes it into markup.
  assert.equal(user.name, hostile.name);
});

test("a damaged or empty result is treated as no result", () => {
  for (const cookie of [
    `${RESULT_COOKIE}=%7Bnot-json`,
    `${RESULT_COOKIE}=`,
    `${RESULT_COOKIE}=%E0%A4%A`,
    resultCookie({ name: "No address" }),
    resultCookie({ ...PROFILE, email: "" }),
    resultCookie(null),
    resultCookie("guest@example.test"),
    `x${RESULT_COOKIE}=${encodeURIComponent(JSON.stringify(PROFILE))}`,
  ]) {
    useStorage();
    const doc = makeDocument(cookie);
    assert.equal(completeGoogleSignIn(doc, at()), "/login?error=no_auth_result", `accepted ${cookie}`);
    assert.equal(doc.writes.length, 1, "the cookie was not cleared");
    assert.equal(getUser(), null);
  }
});

test("blocked storage sends the visitor back with an error instead of half signing in", () => {
  storage.failWrites = true;
  const doc = makeDocument(resultCookie(PROFILE));
  assert.equal(completeGoogleSignIn(doc, at("?next=/account")), "/login?error=auth_failed");
  assert.equal(doc.writes.length, 1, "the cookie was not cleared");
});

test("the complete page is static and puts nothing from the cookie into the HTML", () => {
  const page = fs.readFileSync(appPath("src/pages/auth/complete.astro"), "utf8");
  assert.match(page, /export const prerender = true;/);
  assert.ok(!/Astro\.cookies/.test(page), "the page reads the cookie on the server again");
  assert.ok(!/define:vars|set:html|is:inline/.test(page), "the page writes values into its markup or an inline script");
  assert.match(page, /import \{ completeGoogleSignIn \} from "..\/..\/lib\/google-complete.js";/);
});
