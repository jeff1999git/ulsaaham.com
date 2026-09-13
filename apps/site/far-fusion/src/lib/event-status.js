import { hasEventEnded } from "./event-time.js";

// Mirrors src/lib/event-status.ts in the admin panel. The API already sends
// `bookingOpen` / `bookingClosedReason`, but the clock keeps running on a page
// left open, so the end time is re-checked here too.
export function getBookingClosedReason(event) {
  if (!event) return "CLOSED";
  if (hasEventEnded(event)) return "ENDED";
  if (event.status === "CANCELLED") return "CANCELLED";
  if (event.status === "ANNOUNCED") return "NOT_PUBLISHED";
  if (event.status === "BOOKING_CLOSED") return "CLOSED";
  if (event.isFull) return "FULL";
  if (event.bookingOpen === false) return event.bookingClosedReason || "CLOSED";
  return null;
}

export function isBookingOpen(event) {
  return getBookingClosedReason(event) === null;
}

// Every closed state reads as "Booking Closed" to the visitor; only the
// explanation underneath changes.
const BOOKING_CLOSED_DETAILS = {
  ENDED: "This event has ended.",
  CANCELLED: "This event has been cancelled.",
  NOT_PUBLISHED: "Booking has not opened for this event yet.",
  CLOSED: "This event is no longer accepting bookings.",
  FULL: "This event has reached its capacity.",
};

export function getBookingClosedDetail(reason) {
  return BOOKING_CLOSED_DETAILS[reason] || BOOKING_CLOSED_DETAILS.CLOSED;
}
