// One support address for customers: the shared constant, the pages that list
// it, and no trace of the mistyped domain the payment messages once carried.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { setTestEnv } from "../mail/support/env.mjs";
import { loadSource } from "../mail/support/load.mjs";
import { APP_ROOT, appPath } from "../mail/support/paths.mjs";

setTestEnv();
const { SUPPORT_EMAIL, supportMailto } = await loadSource("src/lib/contact.js");

// Written as a pattern so this file does not contain the address it hunts for.
// It also catches the double-a spelling, which no mailbox answers either.
const RETIRED = /support@ulsa+ham\.com/i;
const TEXT = new Set([".js", ".jsx", ".mjs", ".cjs", ".astro", ".css", ".html", ".json", ".txt", ".md", ".svg", ".xml"]);

function textFiles(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) textFiles(full, found);
    else if (TEXT.has(path.extname(entry.name).toLowerCase())) found.push(full);
  }
  return found;
}

test("customers are pointed at the mailbox the rest of the site lists", () => {
  assert.equal(SUPPORT_EMAIL, "ulsaham1@gmail.com");
  for (const page of ["index", "about", "terms", "privacy"]) {
    const source = fs.readFileSync(appPath(`src/pages/${page}.astro`), "utf8");
    assert.ok(source.includes(SUPPORT_EMAIL), `the ${page} page lists a different address`);
  }
});

test("the payment messages take the address from the shared constant", () => {
  // Both payment screens show a failed confirmation through VerifyFailed,
  // which links to the constant with the Payment ID as the subject.
  const panel = fs.readFileSync(appPath("src/components/VerifyFailed.jsx"), "utf8");
  assert.match(panel, /import \{ SUPPORT_EMAIL, supportMailto \} from "\.\.\/lib\/contact\.js";/);
  assert.match(panel, /href=\{supportMailto\(`Payment \$\{paymentId\}`\)\}/);
  assert.match(panel, />\{SUPPORT_EMAIL\}<\/a>/);
  for (const file of ["src/components/RegistrationForm.jsx", "src/components/AccountPage.jsx"]) {
    const source = fs.readFileSync(appPath(file), "utf8");
    assert.match(source, /import VerifyFailed from "\.\/VerifyFailed\.jsx";/, file);
    assert.match(source, /<VerifyFailed\b/, file);
    assert.ok(!source.includes(SUPPORT_EMAIL), `${file} spells out the support address instead of importing it`);
  }
  // The booking form's note about an unconfirmed earlier payment.
  const form = fs.readFileSync(appPath("src/components/RegistrationForm.jsx"), "utf8");
  assert.match(form, /import \{ SUPPORT_EMAIL \} from "\.\.\/lib\/contact\.js";/);
  assert.match(form, /contact \$\{SUPPORT_EMAIL\}/);
});

test("the support link fills in the subject", () => {
  assert.equal(supportMailto("Payment pay_ABC123"), "mailto:ulsaham1@gmail.com?subject=Payment%20pay_ABC123");
  assert.equal(supportMailto("a&b=c?"), "mailto:ulsaham1@gmail.com?subject=a%26b%3Dc%3F");
});

test("the retired support address appears nowhere in the site", () => {
  const files = ["src", "public", "scripts", "tests"].flatMap((dir) => textFiles(appPath(dir)));
  assert.ok(files.length > 50, "the scan found suspiciously few files");
  for (const file of files) {
    assert.ok(!RETIRED.test(fs.readFileSync(file, "utf8")), `${path.relative(APP_ROOT, file)} names the retired address`);
  }
});
