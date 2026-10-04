// The event fields the site reads, against the fields the admin panel sends.
//
// The admin panel builds both public event payloads from allow-lists (the list
// select and toPublicEvent), copied into public-event.json. A field the site
// reads that is not on its list arrives undefined, and that fails quietly: no
// endTime and an ended event still shows Book, no isFull or bookingOpen and a
// full or closed event looks bookable, no registeredCount and the detail page
// shows "NaN spots". So when this fails, add the field to the admin panel and
// to public-event.json in the same change, or stop reading it here.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { APP_ROOT, appPath } from "../mail/support/paths.mjs";

const CONTRACT = JSON.parse(fs.readFileSync(new URL("./public-event.json", import.meta.url), "utf8"));

// Where each payload is read, and the names it goes by there. "posters[]"
// stands for posters[i]. Only a bare name counts, so ticket.event (the event a
// booking carries, from a different endpoint) is not matched.
const CONSUMERS = {
  list: {
    "src/components/EventsList.jsx": ["ev"],
    "src/components/HomeEvents.jsx": ["ev"],
    "src/components/EventCard.jsx": ["event"],
    "src/components/PastEventsRunner.jsx": ["ev", "e"],
    "src/components/PastEventsCoverflow.jsx": ["ev", "posters[]"],
  },
  detail: {
    "src/components/EventDetail.jsx": ["event"],
    "src/components/RegistrationForm.jsx": ["event"],
    // RepayPanel's event, fetched with getEvent.
    "src/components/AccountPage.jsx": ["event"],
  },
};

// Helpers handed a whole event. What they read counts for every consumer that
// imports them, directly or through another helper.
const HELPERS = {
  "src/lib/event-time.js": ["event"],
  "src/lib/event-status.js": ["event"],
};

const read = (rel) => fs.readFileSync(appPath(rel), "utf8");
const appRel = (file) => path.relative(APP_ROOT, file).split(path.sep).join("/");

// Blank out comments but keep line numbers. "://" in a URL is not a comment.
const stripComments = (code) =>
  code
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/gm, "$1");

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const lineAt = (code, index) => code.slice(0, index).split("\n").length;

/** Every property read off the given names, as { field, line }. */
function readsOf(source, names) {
  const code = stripComments(source);
  const reads = [];
  for (const name of names) {
    const base = name.endsWith("[]") ? `${escape(name.slice(0, -2))}\\[[^\\]]*\\]` : escape(name);
    const bare = `(?<![\\w$.])${base}`;
    const patterns = [
      new RegExp(`${bare}\\??\\.([A-Za-z_$][\\w$]*)`, "g"),
      new RegExp(`${bare}\\??\\.?\\[\\s*["'\`]([^"'\`]+)["'\`]\\s*\\]`, "g"),
    ];
    for (const pattern of patterns) {
      for (const match of code.matchAll(pattern)) reads.push({ field: match[1], line: lineAt(code, match.index) });
    }
    // const { a, b: c, d = 1 } = event
    for (const match of code.matchAll(new RegExp(`\\{([^{}]*)\\}\\s*=\\s*${bare}\\b(?!\\s*\\??[.[])`, "g"))) {
      for (const part of match[1].split(",")) {
        const field = part.trim().match(/^([A-Za-z_$][\w$]*)/)?.[1];
        if (field) reads.push({ field, line: lineAt(code, match.index) });
      }
    }
  }
  return reads;
}

/** The helpers a file imports, followed through the helpers' own imports. */
function helpersOf(rel, seen = new Set()) {
  for (const [, spec] of read(rel).matchAll(/\bfrom\s*["'](\.[^"']+)["']/g)) {
    const target = appRel(path.resolve(path.dirname(appPath(rel)), spec));
    if (target in HELPERS && !seen.has(target)) {
      seen.add(target);
      helpersOf(target, seen);
    }
  }
  return seen;
}

/** Every field a payload is read for, with where. */
function fieldsReadFor(payload) {
  const where = new Map();
  const add = (rel, { field, line }) => {
    if (!where.has(field)) where.set(field, new Set());
    where.get(field).add(`${rel}:${line}`);
  };
  for (const [rel, names] of Object.entries(CONSUMERS[payload])) {
    for (const found of readsOf(read(rel), names)) add(rel, found);
    for (const helper of helpersOf(rel)) {
      for (const found of readsOf(read(helper), HELPERS[helper])) add(helper, found);
    }
  }
  return where;
}

function sourceFiles(dir = appPath("src"), found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, found);
    else if (/\.(js|jsx|mjs|ts|tsx|astro)$/.test(entry.name)) found.push(full);
  }
  return found;
}

test("the contract file is well formed", () => {
  for (const key of ["list", "detail", "forbidden"]) {
    assert.ok(Array.isArray(CONTRACT[key]) && CONTRACT[key].length, `${key} is missing`);
    assert.equal(new Set(CONTRACT[key]).size, CONTRACT[key].length, `${key} lists a field twice`);
  }
  for (const field of CONTRACT.forbidden) {
    assert.ok(!CONTRACT.list.includes(field) && !CONTRACT.detail.includes(field), `${field} is both allowed and forbidden`);
  }
});

test("the scanner finds reads, and only reads off the event itself", () => {
  const code = [
    "const a = event.slug + event?.name + ev.id;",
    "if (ticket.event?.date && prev.muted && data.data.event) {}",
    "const { amount, isFree: free, endTime = '' } = event;",
    "const label = posters[active]?.status + event['capacity'];",
    "// event.description in a comment is not a read",
    "/* nor is event.venue here */ const url = 'https://example.test';",
  ].join("\n");
  const fields = readsOf(code, ["event", "ev", "posters[]"]).map((r) => r.field).sort();
  assert.deepEqual(fields, ["amount", "capacity", "endTime", "id", "isFree", "name", "slug", "status"]);

  // Through the helpers the cards read the end time and the booking state,
  // which is exactly what a slimmed-down list would drop first.
  const list = fieldsReadFor("list");
  for (const field of ["endTime", "status", "isFull", "bookingOpen", "bookingClosedReason"]) {
    assert.ok(list.has(field), `the scan missed ${field} in the list consumers`);
  }
  const detail = fieldsReadFor("detail");
  for (const field of ["registeredCount", "capacity", "galleryImageUrls", "competitionInstructions"]) {
    assert.ok(detail.has(field), `the scan missed ${field} in the detail consumers`);
  }
  for (const [file, names] of Object.entries({ ...CONSUMERS.list, ...CONSUMERS.detail })) {
    assert.ok(readsOf(read(file), names).length, `${file} reads nothing off ${names.join(" or ")}; has it changed?`);
  }
});

test("every component that fetches an event, or is handed one, is in the scan", () => {
  const covered = new Set([...Object.keys(CONSUMERS.list), ...Object.keys(CONSUMERS.detail)]);
  const missing = [];
  for (const file of sourceFiles()) {
    const code = stripComments(fs.readFileSync(file, "utf8"));
    if (/\bgetEvents?\(/.test(code) && appRel(file) !== "src/lib/api.js" && !covered.has(appRel(file))) {
      missing.push(`${appRel(file)} fetches events`);
    }
    // <EventCard event={ev} />, <PastEventsCoverflow posters={posters} />
    for (const [, component] of code.matchAll(/<([A-Z][\w$]*)(?:=>|[^<>])*?\s(?:event|posters)=\{/g)) {
      const from = code.match(new RegExp(`import\\s+${component}\\s+from\\s*["'](\\.[^"']+)["']`))?.[1];
      const target = appRel(from ? path.resolve(path.dirname(file), from) : file);
      if (!covered.has(target)) missing.push(`${target} is handed an event by ${appRel(file)}`);
    }
  }
  assert.deepEqual(missing, [], "add these to CONSUMERS");
});

for (const payload of ["list", "detail"]) {
  const endpoint = payload === "list" ? "GET /api/public/events" : "GET /api/public/events/[slug]";
  test(`every field the site reads from ${endpoint} is one the admin panel sends`, () => {
    const allowed = new Set(CONTRACT[payload]);
    const unsent = [...fieldsReadFor(payload)]
      .filter(([field]) => !allowed.has(field))
      .map(([field, where]) => `${field} (${[...where].join(", ")})`);
    assert.deepEqual(unsent, [], `not in the ${payload} allow-list of public-event.json`);
  });
}

test("no private event field is read anywhere in the site", () => {
  const names = CONTRACT.forbidden.map(escape).join("|");
  const patterns = [
    new RegExp(`\\.(${names})\\b`, "g"),
    new RegExp(`\\[\\s*["'\`](${names})["'\`]\\s*\\]`, "g"),
    new RegExp(`\\{[^{}]*?\\b(${names})\\b[^{}]*\\}\\s*=(?![=>])`, "g"),
  ];
  const hits = [];
  for (const file of sourceFiles()) {
    const code = stripComments(fs.readFileSync(file, "utf8"));
    for (const pattern of patterns) {
      for (const match of code.matchAll(pattern)) hits.push(`${appRel(file)}:${lineAt(code, match.index)} ${match[1]}`);
    }
  }
  assert.deepEqual(hits, []);
});
