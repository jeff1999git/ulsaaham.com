// The `astro dev` proxy may read from the production admin panel but must never
// write to it. The last test drives Vite's real proxy middleware against a local
// stand-in for the admin panel, so nothing here reaches the network.
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { appFileUrl } from "../mail/support/paths.mjs";

const { readOnlyBypass, readOnlyProxy } = await import(appFileUrl("scripts/dev-proxy.mjs"));

function fakeResponse() {
  return {
    status: null,
    headers: null,
    body: null,
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
      return this;
    },
    end(body) {
      this.body = body;
    },
  };
}

test("reads are left to the proxy", () => {
  for (const method of ["GET", "HEAD"]) {
    const res = fakeResponse();
    assert.equal(readOnlyBypass({ method, url: "/api/public/events" }, res), undefined);
    assert.equal(res.status, null, `${method} was answered locally`);
  }
});

test("every other method is answered locally with a JSON 403", () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const res = fakeResponse();
    const url = "/api/public/events/demo/payment/order";
    // A string tells Vite the request was handled; the ended response stops it.
    assert.equal(readOnlyBypass({ method, url }, res), url);
    assert.equal(res.status, 403);
    assert.match(res.headers["Content-Type"], /^application\/json/);
    assert.equal(res.headers["Content-Length"], Buffer.byteLength(res.body));
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.ok(body.error.includes(method), "the message does not name the refused method");
  }
});

test("the proxy options keep the target and carry the guard", () => {
  const options = readOnlyProxy("https://admin.example.test");
  assert.equal(options.target, "https://admin.example.test");
  assert.equal(options.changeOrigin, true);
  assert.equal(options.bypass, readOnlyBypass);
});

test("through Vite's proxy, GET and HEAD reach the upstream and writes never do", async (t) => {
  let createServer;
  try {
    ({ createServer } = await import("vite"));
  } catch {
    t.skip("vite is not installed");
    return;
  }

  const seen = [];
  const upstream = http.createServer((req, res) => {
    seen.push(`${req.method} ${req.url}`);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(req.method === "HEAD" ? undefined : JSON.stringify({ success: true }));
  });
  await new Promise((resolve) => upstream.listen(0, "127.0.0.1", resolve));

  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dev-proxy-"));
  const server = await createServer({
    configFile: false,
    root,
    logLevel: "silent",
    clearScreen: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    server: {
      host: "127.0.0.1",
      port: 0,
      hmr: false,
      watch: null,
      proxy: { "/api/public": readOnlyProxy(`http://127.0.0.1:${upstream.address().port}`) },
    },
  });

  try {
    await server.listen();
    const base = `http://127.0.0.1:${server.httpServer.address().port}`;

    assert.equal((await fetch(`${base}/api/public/events?limit=1`)).status, 200);
    assert.equal((await fetch(`${base}/api/public/events?limit=1`, { method: "HEAD" })).status, 200);

    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      const res = await fetch(`${base}/api/public/events/demo/register`, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Test", phone: "9999999999" }),
      });
      assert.equal(res.status, 403, `${method} was not refused`);
      assert.match(res.headers.get("content-type"), /^application\/json/);
      assert.equal((await res.json()).success, false);
    }

    assert.deepEqual(seen, ["GET /api/public/events?limit=1", "HEAD /api/public/events?limit=1"]);
  } finally {
    await server.close();
    await new Promise((resolve) => upstream.close(resolve));
    fs.rmSync(root, { recursive: true, force: true });
  }
});
