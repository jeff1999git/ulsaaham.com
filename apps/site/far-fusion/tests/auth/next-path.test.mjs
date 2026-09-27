// The post-sign-in redirect target. It arrives in a query string and ends up
// both in window.location.replace and inside an inline script, so it must only
// ever be a path on this site, and one that holds no markup.
import test from "node:test";
import assert from "node:assert/strict";

import { appFileUrl } from "../mail/support/paths.mjs";

const { safeNextPath } = await import(appFileUrl("src/lib/next-path.js"));

// What Astro's define:vars does to a value before it lands in the page
// (astro/dist/runtime/server/render/util.js). Note the case-sensitive escape.
const defineVar = (value) => JSON.stringify(value).replace(/<\/script>/g, "\\x3C/script>");

test("anything that leaves the site falls back to the account page", () => {
  const hostile = [
    undefined,
    null,
    42,
    "",
    "account",
    "javascript:alert(document.domain)",
    "JavaScript:alert(1)",
    "https://evil.example/phish",
    "//evil.example",
    "/\\evil.example",
    "/\n/evil.example",
    "/\t/evil.example",
    "\\\\evil.example",
    "data:text/html,<script>alert(1)</script>",
    // Dot segments collapse to a protocol-relative URL after parsing.
    "/..//evil.example",
    "/.//evil.example",
    "/%2e%2e//evil.example",
    "/%2E%2E//evil.example",
    "/a/..//evil.example",
    "/..///evil.example",
    "/..\\/evil.example",
  ];
  for (const value of hostile) {
    assert.equal(safeNextPath(value), "/account", `accepted ${JSON.stringify(value)}`);
  }
});

test("whatever comes out stays on the site and carries no markup", () => {
  // Every sequence of up to four of these pieces, so a bypass nobody listed
  // above is still caught.
  const pieces = [
    "/", "//", "\\", ".", "..", "%2e", "%2E", "%2f", "%5c", "\t", "\n",
    "evil.example", "@", ":", "javascript:", "?", "#", "<", "</SCRIPT>", " ",
  ];
  const site = "https://www.ulsaaham.com";
  let checked = 0;

  const visit = (prefix, depth) => {
    const result = safeNextPath(prefix);
    checked += 1;
    assert.ok(
      result.startsWith("/") && !/^\/[\/\\]/.test(result) && new URL(result, site).origin === site,
      `${JSON.stringify(prefix)} escaped the site as ${JSON.stringify(result)}`
    );
    assert.ok(!/[<>"]/.test(result), `${JSON.stringify(prefix)} kept markup: ${JSON.stringify(result)}`);
    if (depth === 4) return;
    for (const piece of pieces) visit(prefix + piece, depth + 1);
  };
  visit("", 0);

  assert.ok(checked > 150000, "the search space shrank");
});

test("a caller can choose the fallback", () => {
  assert.equal(safeNextPath("//evil.example", "/events"), "/events");
});

test("paths on the site survive, query and fragment included", () => {
  assert.equal(safeNextPath("/account"), "/account");
  assert.equal(safeNextPath("/events/detail?slug=spring-fest#register"), "/events/detail?slug=spring-fest#register");
  // Percent-encoded characters stay encoded, so this is still a path here.
  assert.equal(safeNextPath("/%0a/evil.example"), "/%0a/evil.example");
});

test("markup in a path comes back percent-encoded", () => {
  const values = [
    "/</SCRIPT><script>alert(1)</script>",
    "/events?q=</ScRiPt><img src=x onerror=alert(1)>",
    '/x#"><svg onload=alert(1)>',
  ];
  for (const value of values) {
    const result = safeNextPath(value);
    assert.ok(result.startsWith("/") && !result.startsWith("//"), `left the site: ${result}`);
    assert.ok(!/[<>"]/.test(result), `markup survived: ${result}`);
  }
});

test("nothing that reaches define:vars can close the inline script", () => {
  const values = [
    "/</SCRIPT><script>alert(1)</script>",
    "/</script ><script>alert(1)</script>",
    "/?a=</sCrIpT>",
  ];
  for (const value of values) {
    // Without the helper, the raw value breaks out of the script element.
    assert.ok(/<\/script/i.test(defineVar(value)), "the fixture no longer demonstrates the breakout");
    assert.ok(!/<\/script/i.test(defineVar(safeNextPath(value))), `breakout survived for ${value}`);
  }

  // The Google profile goes through the same door; its "<" is escaped and
  // restored by JSON.parse on the page.
  const profile = { name: "Eve</SCRIPT><script>alert(1)</script>", email: "eve@example.test" };
  const userJson = JSON.stringify(profile).replace(/</g, "\\u003c");
  assert.ok(!/<\/script/i.test(defineVar(userJson)));
  assert.deepEqual(JSON.parse(userJson), profile);
});
