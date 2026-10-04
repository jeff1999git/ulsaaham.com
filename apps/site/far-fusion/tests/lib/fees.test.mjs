// The price the booking screens show (src/lib/fees.js), against the admin
// panel's golden fee table. tests/fixtures/fee-cases.json is a byte-for-byte
// copy of test/fixtures/fee-cases.json in the admin panel, whose own tests run
// the same rows through the code that creates the Razorpay order. When the
// admin panel changes a row, copy the file again; both suites must pass.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { setTestEnv } from "../mail/support/env.mjs";
import { loadSource } from "../mail/support/load.mjs";

setTestEnv();
const fees = await loadSource("src/lib/fees.js");

const TABLE = JSON.parse(fs.readFileSync(new URL("../fixtures/fee-cases.json", import.meta.url), "utf8"));
const MONEY = ["effectiveAmount", "base", "discount", "discountedBase", "gst", "platformFee", "total"];

test("the table is the one the admin panel charges by", () => {
  assert.equal(fees.GST_RATE, TABLE.rates.gst);
  assert.equal(fees.PLATFORM_FEE_RATE, TABLE.rates.platformFee);
  assert.ok(TABLE.cases.length >= 20, "the fee table lost its rows");
  assert.equal(new Set(TABLE.cases.map((c) => c.id)).size, TABLE.cases.length);
});

/** Rupee fields agree to the paisa; the amount sent to Razorpay agrees exactly. */
function assertCharges(actual, expected, label) {
  assert.ok(actual, `${label}: no breakdown`);
  for (const field of MONEY) {
    assert.ok(Math.abs(actual[field] - expected[field]) < 0.005, `${label}: ${field} is ${actual[field]}, expected ${expected[field]}`);
  }
  assert.equal(actual.totalPaise, expected.totalPaise, `${label}: totalPaise`);
  // What the breakdown lists adds up to what is charged.
  assert.ok(Math.abs(actual.discountedBase + actual.gst + actual.platformFee - actual.total) < 0.005, `${label}: rows do not add up`);
}

for (const c of TABLE.cases) {
  test(`fee table: ${c.id}`, () => {
    const { event, quantity, couponDiscount, expected } = c;
    assert.equal(fees.getEffectiveAmount(event), expected.effectiveAmount);

    // The rows hold the event as stored; the API sends effectiveAmount too,
    // and the result must not depend on which of the two the site was given.
    const asStored = fees.calcFees(event, quantity, couponDiscount);
    const asSent = fees.calcFees({ ...event, effectiveAmount: fees.getEffectiveAmount(event) }, quantity, couponDiscount);
    if (expected.effectiveAmount === null) {
      assert.equal(asStored, null, "a free or unpriced event has no charge");
      assert.equal(asSent, null);
      return;
    }
    assertCharges(asStored, expected, "as stored");
    assertCharges(asSent, expected, "as sent");
  });
}

test("the coupon defaults to none, and the server's own price wins", () => {
  const event = { isFree: false, amount: 500, isEarlyBird: true, earlyBirdAmount: 400, gstEnabled: false, platformFeeEnabled: false, isCompetition: false };
  assert.equal(fees.calcFees(event, 2).total, 800);
  // effectiveAmount from the API is used as given, even where the stored
  // fields alone would say otherwise (a page loaded before an edit).
  assert.equal(fees.calcFees({ ...event, effectiveAmount: 450 }, 2).total, 900);
  assert.equal(fees.calcFees({ ...event, effectiveAmount: null }, 2), null);
});
