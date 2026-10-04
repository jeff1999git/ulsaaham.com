// Why an event cannot be booked (src/lib/event-status.js), in the admin
// panel's order: a cancelled event reads as cancelled even after its date,
// as getEffectiveStatus keeps it there.
import test from "node:test";
import assert from "node:assert/strict";

import { setTestEnv } from "../mail/support/env.mjs";
import { loadSource } from "../mail/support/load.mjs";

setTestEnv();
const { getBookingClosedReason, getBookingClosedDetail, isBookingOpen } = await loadSource("src/lib/event-status.js");

const DAY = 24 * 60 * 60 * 1000;
const future = { date: new Date(Date.now() + 30 * DAY).toISOString(), startTime: "06:00 PM", endTime: "09:00 PM", status: "PUBLISHED" };
const past = { ...future, date: new Date(Date.now() - 30 * DAY).toISOString() };

test("a cancelled event is cancelled, before and after its date", () => {
  assert.equal(getBookingClosedReason({ ...future, status: "CANCELLED" }), "CANCELLED");
  assert.equal(getBookingClosedReason({ ...past, status: "CANCELLED" }), "CANCELLED");
  assert.equal(getBookingClosedDetail("CANCELLED"), "This event has been cancelled.");
});

test("every other reason keeps its place", () => {
  assert.equal(getBookingClosedReason(past), "ENDED");
  assert.equal(getBookingClosedReason({ ...future, status: "ANNOUNCED" }), "NOT_PUBLISHED");
  assert.equal(getBookingClosedReason({ ...future, status: "BOOKING_CLOSED" }), "CLOSED");
  assert.equal(getBookingClosedReason({ ...future, isFull: true }), "FULL");
  assert.equal(getBookingClosedReason({ ...future, bookingOpen: false, bookingClosedReason: "FULL" }), "FULL");
  assert.equal(getBookingClosedReason({ ...future, bookingOpen: false }), "CLOSED");
  assert.equal(getBookingClosedReason(null), "CLOSED");
  assert.equal(getBookingClosedReason(future), null);
  assert.equal(isBookingOpen(future), true);
  assert.equal(isBookingOpen({ ...future, status: "CANCELLED" }), false);
  assert.equal(getBookingClosedDetail("SOMETHING_NEW"), "This event is no longer accepting bookings.");
});
