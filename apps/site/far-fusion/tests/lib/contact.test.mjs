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
const { SUPPORT_EMAIL } = await loadSource("src/lib/contact.js");

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
  for (const file of ["src/components/RegistrationForm.jsx", "src/components/AccountPage.jsx"]) {
    const source = fs.readFileSync(appPath(file), "utf8");
    assert.match(source, /import \{ SUPPORT_EMAIL \} from "\.\.\/lib\/contact\.js";/, file);
    assert.match(source, /contact \$\{SUPPORT_EMAIL\}/, file);
  }
});

test("the retired support address appears nowhere in the site", () => {
  const files = ["src", "public", "scripts", "tests"].flatMap((dir) => textFiles(appPath(dir)));
  assert.ok(files.length > 50, "the scan found suspiciously few files");
  for (const file of files) {
    assert.ok(!RETIRED.test(fs.readFileSync(file, "utf8")), `${path.relative(APP_ROOT, file)} names the retired address`);
  }
});
