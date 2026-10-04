// Loading Razorpay's checkout script (src/lib/razorpay.js): one download however
// many screens ask, and a failed or stalled one is dropped so the next tap
// starts afresh. The page is a stand-in; no script is fetched.
import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { setTestEnv } from "../mail/support/env.mjs";
import { loadSource } from "../mail/support/load.mjs";

setTestEnv();

/** A page with a body that records the scripts added to it. */
function fakePage() {
  const scripts = [];
  globalThis.window = {};
  globalThis.document = {
    createElement: (tag) => ({
      tag,
      removed: false,
      remove() {
        this.removed = true;
      },
    }),
    body: { appendChild: (el) => scripts.push(el) },
  };
  return scripts;
}

afterEach(() => {
  delete globalThis.window;
  delete globalThis.document;
});

test("calls made while the script loads share one download", async () => {
  const scripts = fakePage();
  const { loadRazorpay, LOAD_TIMEOUT_MS } = await loadSource("src/lib/razorpay.js");
  assert.equal(LOAD_TIMEOUT_MS, 15000);

  const first = loadRazorpay(1000);
  const second = loadRazorpay(1000);
  assert.equal(first, second);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, "https://checkout.razorpay.com/v1/checkout.js");
  assert.equal(scripts[0].async, true);

  globalThis.window.Razorpay = function Razorpay() {};
  scripts[0].onload();
  assert.equal(await first, true);
  assert.equal(await loadRazorpay(1000), true);
  assert.equal(scripts.length, 1, "a loaded script was requested again");
  assert.equal(scripts[0].removed, false);
});

test("a script that fails is removed, and the next call tries again", async () => {
  const scripts = fakePage();
  const { loadRazorpay } = await loadSource("src/lib/razorpay.js");

  const failed = loadRazorpay(1000);
  scripts[0].onerror();
  assert.equal(await failed, false);
  assert.equal(scripts[0].removed, true);

  const retry = loadRazorpay(1000);
  assert.equal(scripts.length, 2, "the retry reused the failed download");
  globalThis.window.Razorpay = function Razorpay() {};
  scripts[1].onload();
  assert.equal(await retry, true);
});

test("a script that loads without defining Razorpay counts as failed", async () => {
  const scripts = fakePage();
  const { loadRazorpay } = await loadSource("src/lib/razorpay.js");
  const loading = loadRazorpay(1000);
  scripts[0].onload();
  assert.equal(await loading, false);
  assert.equal(scripts[0].removed, true);
});

test("a download that stalls gives up after the timeout and is dropped", async () => {
  const scripts = fakePage();
  const { loadRazorpay } = await loadSource("src/lib/razorpay.js");
  const started = Date.now();
  assert.equal(await loadRazorpay(30), false);
  assert.ok(Date.now() - started < 5000);
  assert.equal(scripts[0].removed, true);
  assert.equal(scripts[0].onload, null, "a late load could still settle the attempt");

  loadRazorpay(1000);
  assert.equal(scripts.length, 2);
  scripts[1].onerror();
});

test("nothing is added when Razorpay is already there, or on the server", async () => {
  const scripts = fakePage();
  globalThis.window.Razorpay = function Razorpay() {};
  const { loadRazorpay } = await loadSource("src/lib/razorpay.js");
  assert.equal(await loadRazorpay(), true);
  assert.equal(scripts.length, 0);

  delete globalThis.window;
  const server = await loadSource("src/lib/razorpay.js");
  assert.equal(await server.loadRazorpay(), false);
});
