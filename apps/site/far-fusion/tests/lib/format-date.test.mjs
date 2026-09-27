// Event dates are calendar days in India. Formatted in the visitor's own time
// zone they used to show the day before anywhere west of UTC, on screen and on
// the ticket image and PDF. Each check runs in a separate Node process per time
// zone, because a process picks its zone up from TZ when it starts.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import { appFileUrl } from "../mail/support/paths.mjs";

const MODULE = appFileUrl("src/lib/format-date.js");
const ZONES = ["UTC", "Asia/Kolkata", "America/New_York"];

// What the admin panel stores for 5 Oct 2026 (UTC midnight of the day), and
// the same day written as IST midnight, which must read the same.
const PROBE = `
  const f = await import(${JSON.stringify(MODULE)});
  const dates = ["2026-10-05T00:00:00.000Z", "2026-10-04T18:30:00.000Z"];
  const out = {
    short: dates.map(f.formatDateShort),
    medium: dates.map(f.formatDateMedium),
    full: dates.map(f.formatDateFull),
    fromDate: f.formatDateShort(new Date(dates[0])),
    empty: [f.formatDateShort(null), f.formatDateMedium(undefined), f.formatDateFull(""), f.formatDateShort("not a date")],
    // The old formatter, with no zone, for comparison.
    unpinned: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(dates[0])),
  };
  console.log(JSON.stringify(out));
`;

function runIn(zone) {
  const stdout = execFileSync(process.execPath, ["--input-type=module", "-e", PROBE], {
    env: { ...process.env, TZ: zone },
    encoding: "utf8",
  });
  return JSON.parse(stdout);
}

const results = Object.fromEntries(ZONES.map((zone) => [zone, runIn(zone)]));

test("the probe really runs in each time zone", () => {
  // Without a pinned zone, New York sees the day before; if it didn't, TZ
  // was not applied and the other checks would prove nothing.
  assert.equal(results.UTC.unpinned, "5 Oct 2026");
  assert.equal(results["America/New_York"].unpinned, "4 Oct 2026");
});

for (const zone of ZONES) {
  test(`dates read as the Indian calendar day in ${zone}`, () => {
    const r = results[zone];
    assert.deepEqual(r.short, ["5 Oct 2026", "5 Oct 2026"]);
    assert.deepEqual(r.medium, ["05-Oct-2026", "05-Oct-2026"]);
    assert.deepEqual(r.full, ["Monday, 5 October, 2026", "Monday, 5 October, 2026"]);
    assert.equal(r.fromDate, "5 Oct 2026");
  });
}

test("a missing or unreadable date prints as nothing", () => {
  for (const zone of ZONES) assert.deepEqual(results[zone].empty, ["", "", "", ""]);
});
