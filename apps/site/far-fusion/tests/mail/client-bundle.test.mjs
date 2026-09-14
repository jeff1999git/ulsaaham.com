// Nothing about the mail transport may reach a browser.
//
// Astro only substitutes private environment values in the server build, and
// the client build runs with a PUBLIC_ prefix, so a hit in here is a real
// defect rather than a style problem. Note the asymmetry between builds: a
// local build writes the values of this machine .env into the server chunks as
// literals, while a build on Vercel emits process.env references instead. Only
// the browser directories are scanned, and the server output of a local build
// should be deleted once it has been inspected.
//
// This file deliberately imports no loader and sets no environment, because it
// wants whatever values the run actually has.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { APP_ROOT, REPO_ROOT } from "./support/paths.mjs";

const DIRECTORIES = [
  path.join(APP_ROOT, "dist", "client"),
  path.join(APP_ROOT, ".vercel", "output", "static"),
  path.join(REPO_ROOT, ".vercel", "output", "static"),
];

const SCANNED = new Set([
  ".js", ".mjs", ".cjs", ".css", ".html", ".json", ".txt", ".map", ".webmanifest", ".svg", ".xml",
]);

// Names, not values: a browser asset should never even mention these.
const NAME_PATTERNS = [
  ["an SMTP variable name", /\bSMTP_(HOST|PORT|SECURE|USER|PASS)\b/],
  ["the OTP signing secret name", /\bOTP_SECRET\b/],
  ["a sender variable name", /\b(OTP|TICKET)_EMAIL_FROM\b/],
  ["the retired sender variable name", /\bEMAIL_FROM\b/],
  ["the backend handshake secret name", /\bPROXY_SHARED_SECRET\b/],
  ["the Google client secret name", /\bGOOGLE_CLIENT_SECRET\b/],
  ["the Brevo relay host", /smtp-relay\.brevo\.com/],
  ["the Brevo login domain", /@smtp-brevo\.com/],
  ["the mail library", /\bnodemailer\b/],
  ["a transport constructor", /createTransport\(/],
];

const VALUE_VARIABLES = ["SMTP_PASS", "SMTP_USER", "SMTP_HOST", "OTP_SECRET", "PROXY_SHARED_SECRET", "GOOGLE_CLIENT_SECRET"];

/** Only the variable name is ever reported, never the value it matched. */
function activeValuePatterns() {
  return VALUE_VARIABLES.filter((name) => (process.env[name] || "").length >= 8).map((name) => [
    "the value of " + name,
    process.env[name],
  ]);
}

function walk(directory, found = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, found);
    else if (SCANNED.has(path.extname(entry.name).toLowerCase())) found.push(full);
  }
  return found;
}

test("no mail credential reaches the browser bundle", (t) => {
  const present = DIRECTORIES.filter((directory) => fs.existsSync(directory));
  const values = activeValuePatterns();

  // A matcher that silently checks nothing would pass every time, so prove it
  // catches a planted value before trusting a clean result.
  const planted = "prefix SMTP_PASS=" + (values[0]?.[1] ?? "planted-value") + " suffix";
  assert.ok(
    NAME_PATTERNS.some(([, pattern]) => pattern.test(planted)),
    "the name matcher does not catch a planted value"
  );
  if (values.length) {
    assert.ok(planted.includes(values[0][1]), "the value matcher does not catch a planted value");
  }

  if (!present.length) {
    t.diagnostic("no build output found; run a build first for this check to mean anything");
    t.skip("no build output present");
    return;
  }

  let scanned = 0;
  let scripts = 0;

  for (const directory of present) {
    for (const file of walk(directory)) {
      const relative = path.relative(REPO_ROOT, file);
      const content = fs.readFileSync(file, "utf8");
      scanned += 1;
      if (/\.(js|mjs|cjs)$/i.test(file)) scripts += 1;

      for (const [label, pattern] of NAME_PATTERNS) {
        assert.ok(!pattern.test(content), relative + " contains " + label);
      }
      for (const [label, value] of values) {
        assert.ok(!content.includes(value), relative + " contains " + label);
      }
    }
  }

  t.diagnostic(`scanned ${scanned} files (${scripts} scripts) across ${present.length} directories`);
  t.diagnostic(`value checks active: ${values.map(([label]) => label).join(", ") || "none"}`);

  // The verification run sets this, so a scan that checked no values at all
  // cannot be mistaken for a clean bill of health.
  if (process.env.MAIL_SCAN_STRICT === "1") {
    assert.ok(scripts > 0, "strict mode: no script was scanned");
    assert.ok(values.length >= 3, "strict mode: fewer than three credential values were available to scan for");
  }
});
