// Event dates as the site shows them. An event's date is the calendar day it
// takes place in India (stored as UTC midnight of that day, see event-time.js),
// so every format is pinned to India Standard Time: a visitor abroad sees the
// same day as one in Kerala, not the day before. The ticket email does the
// same (src/pages/api/send-ticket.js). Each formatter is built once, not on
// every render.
const TIME_ZONE = "Asia/Kolkata";

const SHORT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE });
const MEDIUM = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: TIME_ZONE });
const FULL = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeZone: TIME_ZONE });

// A missing or unreadable date prints as nothing rather than throwing.
function format(formatter, value) {
  if (value == null || value === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : formatter.format(date);
}

/** "5 Oct 2026": cards, the ticket image and the participation card. */
export function formatDateShort(value) {
  return format(SHORT, value);
}

/** "05-Oct-2026": the My Bookings list. */
export function formatDateMedium(value) {
  return format(MEDIUM, value);
}

/** "Monday, 5 October, 2026": the event page and the booking confirmation. */
export function formatDateFull(value) {
  return format(FULL, value);
}
