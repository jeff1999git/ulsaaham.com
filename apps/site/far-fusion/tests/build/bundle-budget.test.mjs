// What each page makes the browser download before it works: the static import
// closure of every island (component and renderer) and module script, summed
// as gzip. One stray static import can bring a 100 KB library back onto a page
// that was slimmed, and nothing else would notice.
//
// The build checks run only after a build, and only when asked:
//   bun run build && BUNDLE_CHECK=1 node --test tests/build/
// They do not key on CI, because Vercel sets CI in every build and the plain
// test run would then fail before any output exists. The walker's own checks
// below need no build and always run.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

import { APP_ROOT, REPO_ROOT } from "../mail/support/paths.mjs";

// gzip -9 bytes of JS per page, about 5% above the build they were set from
// (measured on 2026-10-03, in the comments). A page with no budget fails, so a
// new page gets one on purpose.
const BUDGETS = {
  "/index.html": 74_500, // 71,134
  "/events/index.html": 71_000, // 67,635
  "/events/detail/index.html": 87_500, // 83,087
  "/account/index.html": 83_500, // 79,405
  "/login/index.html": 68_500, // 65,162
  "/auth/complete/index.html": 1_300, // 1,246 (static since S5)
  "/about/index.html": 1_000, // 940
  "/privacy/index.html": 1_000, // 940
  "/terms/index.html": 1_000, // 940
  "/404.html": 1_000, // 0
};

// jsPDF is only needed when a participation card is downloaded, so it must
// arrive through import(), never up front. /events/detail and /account are the
// pages that use it; no page may carry it.
const PDF_MARKER = /%PDF-|jsPDF/;
const PDF_CHUNK = /jspdf/i;

const OUTPUTS = [
  path.join(APP_ROOT, ".vercel", "output", "static"),
  path.join(REPO_ROOT, ".vercel", "output", "static"),
];

// Static edges only: `import x from "./a.js"`, `import "./a.js"` and
// `export * from "./a.js"`. An import("./a.js") call is lazy and not followed.
const STATIC_IMPORT = /(?:^|[;\n}])\s*(?:import|export)\s*(?:[^"'();]*?from\s*)?["']([^"']+\.js)["']/g;
const ISLAND_URL = /\b(?:component-url|renderer-url|before-hydration-url)="([^"]+)"/g;
const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;

function pagesIn(staticDir, dir = staticDir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "_astro") pagesIn(staticDir, full, found);
    } else if (entry.name.endsWith(".html")) {
      found.push("/" + path.relative(staticDir, full).split(path.sep).join("/"));
    }
  }
  return found.sort();
}

/** Site-absolute or relative .js specifiers in `code`, resolved to files. */
function importsOf(code, staticDir, fromFile) {
  const files = [];
  for (const [, spec] of code.matchAll(STATIC_IMPORT)) {
    if (spec.startsWith("/")) files.push(path.join(staticDir, spec));
    else if (spec.startsWith(".")) files.push(path.resolve(path.dirname(fromFile), spec));
  }
  return files;
}

/** The files a page loads up front, and any it names that do not exist. */
function pageClosure(staticDir, page) {
  const htmlFile = path.join(staticDir, page);
  const html = fs.readFileSync(htmlFile, "utf8");

  const entries = [];
  for (const [, url] of html.matchAll(ISLAND_URL)) {
    if (url.startsWith("/")) entries.push(path.join(staticDir, url));
  }
  for (const [, attrs, body] of html.matchAll(SCRIPT_TAG)) {
    if (!/\btype=["']?module\b/.test(attrs)) continue;
    const src = attrs.match(/\bsrc=["']([^"']+)["']/)?.[1];
    if (src) {
      if (src.startsWith("/")) entries.push(path.join(staticDir, src));
    } else {
      entries.push(...importsOf(body, staticDir, htmlFile));
    }
  }

  const files = new Set();
  const missing = new Set();
  const stack = entries.filter((file) => file.endsWith(".js"));
  while (stack.length) {
    const file = stack.pop();
    if (files.has(file) || missing.has(file)) continue;
    if (!fs.existsSync(file)) {
      missing.add(file);
      continue;
    }
    files.add(file);
    stack.push(...importsOf(fs.readFileSync(file, "utf8"), staticDir, file));
  }
  return { files: [...files].sort(), missing: [...missing].sort() };
}

const gzipSize = (file) => zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length;

/** Every budget or jsPDF problem in one build, as readable lines. */
function bundleProblems(staticDir, budgets) {
  const problems = [];
  const report = {};
  const pages = pagesIn(staticDir);
  const name = (file) => path.relative(staticDir, file).split(path.sep).join("/");

  for (const page of Object.keys(budgets)) {
    if (!pages.includes(page)) problems.push(`${page} has a budget but was not built`);
  }

  for (const page of pages) {
    const { files, missing } = pageClosure(staticDir, page);
    const gz = files.reduce((sum, file) => sum + gzipSize(file), 0);
    report[page] = { files: files.length, gz };

    for (const file of missing) problems.push(`${page} loads ${name(file)}, which is not in the build`);
    for (const file of files) {
      if (PDF_CHUNK.test(path.basename(file)) || PDF_MARKER.test(fs.readFileSync(file, "latin1"))) {
        problems.push(`${page} loads jsPDF up front, through ${name(file)}`);
      }
    }
    if (!(page in budgets)) problems.push(`${page} has no budget (${gz} B gzip of JS today)`);
    else if (gz > budgets[page]) problems.push(`${page} loads ${gz} B gzip of JS, over its ${budgets[page]} B budget`);
  }
  return { problems, report };
}

// ─── The walker, against a small fixture build ───

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-budget-"));
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  }
  return dir;
}

const ISLAND = (component) =>
  `<astro-island uid="a" component-url="/_astro/${component}" component-export="default" renderer-url="/_astro/client.js" client="load"></astro-island>`;

const FIXTURE = {
  "index.html": `<html><body>${ISLAND("Page.js")}<script type="module" src="/_astro/nav.js"></script>` +
    `<script type="module">import"/_astro/inline-dep.js";document.title="x";</script>` +
    `<script>import("/_astro/classic.js")</script></body></html>`,
  "_astro/Page.js": `import{j as e}from"./jsx.js";import"./side.js";const p=()=>import("./card-pdf.js");export{p};`,
  "_astro/client.js": `export*from"./shared.js";`,
  "_astro/jsx.js": "export const j=1;",
  "_astro/side.js": "window.side=1;",
  "_astro/shared.js": "export const s=1;",
  "_astro/nav.js": "document.body;",
  "_astro/inline-dep.js": "export{};",
  "_astro/classic.js": "export{};",
  "_astro/card-pdf.js": `const m=()=>import("./jspdf.es.min.abc.js");export{m};`,
  "_astro/jspdf.es.min.abc.js": "const h='%PDF-1.3';class jsPDF{}export{jsPDF};",
};

test("the walker follows static imports from islands and module scripts, and not import()", (t) => {
  const dir = fixture(FIXTURE);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const { files, missing } = pageClosure(dir, "/index.html");
  assert.deepEqual(
    files.map((file) => path.basename(file)),
    ["Page.js", "client.js", "inline-dep.js", "jsx.js", "nav.js", "shared.js", "side.js"]
  );
  assert.deepEqual(missing, []);

  const { problems } = bundleProblems(dir, { "/index.html": 10_000 });
  assert.deepEqual(problems, [], "a lazy jsPDF counted against the page");
});

test("the checks catch a static jsPDF, a page over budget, a page without one and a missing file", (t) => {
  const dir = fixture({
    ...FIXTURE,
    // The participation card imported straight into the page, as it once was.
    "_astro/Page.js": `import{j as e}from"./jsx.js";import{jsPDF as d}from"./jspdf.es.min.abc.js";import"./gone.js";export{d};`,
    "extra/index.html": `<html><body>${ISLAND("Page.js")}</body></html>`,
  });
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const { problems } = bundleProblems(dir, { "/index.html": 50, "/missing/index.html": 1_000 });
  const has = (pattern) => problems.some((line) => pattern.test(line));
  assert.ok(has(/^\/index\.html loads jsPDF up front, through _astro\/jspdf\.es\.min\.abc\.js$/), problems.join("\n"));
  assert.ok(has(/^\/index\.html loads \d+ B gzip of JS, over its 50 B budget$/), problems.join("\n"));
  assert.ok(has(/^\/extra\/index\.html has no budget/), problems.join("\n"));
  assert.ok(has(/^\/missing\/index\.html has a budget but was not built$/), problems.join("\n"));
  assert.ok(has(/^\/index\.html loads _astro\/gone\.js, which is not in the build$/), problems.join("\n"));
});

// ─── The real build ───

test(
  "every page stays within its script budget, and none loads jsPDF up front",
  { skip: process.env.BUNDLE_CHECK !== "1" && "set BUNDLE_CHECK=1 after a build to run this" },
  (t) => {
    const staticDir = OUTPUTS.find((dir) => fs.existsSync(dir));
    assert.ok(staticDir, "no build output in .vercel/output/static; run `bun run build` first");

    const { problems, report } = bundleProblems(staticDir, BUDGETS);
    t.diagnostic(`checked ${path.relative(REPO_ROOT, staticDir)}`);
    for (const [page, { files, gz }] of Object.entries(report)) {
      const budget = BUDGETS[page] ? ` of ${BUDGETS[page]}` : "";
      t.diagnostic(`${page}: ${gz} B gzip${budget} in ${files} files`);
    }
    assert.deepEqual(problems, []);
  }
);
