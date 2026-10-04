// What a booking costs, worked out the way the admin panel charges it
// (src/lib/pricing.ts there). Its golden fee table is copied to
// tests/fixtures/fee-cases.json and tests/lib/fees.test.mjs runs every row
// through this file, so the total shown before payment is the total charged.
export const GST_RATE = 0.18;
export const PLATFORM_FEE_RATE = 0.02;

const round2 = (amount) => Math.round(amount * 100) / 100;

/** The per-person price: the early-bird price while it is on, else the amount. null for free events. */
export function getEffectiveAmount(event) {
  if (event.isFree) return null;
  if (event.isEarlyBird && event.earlyBirdAmount != null) return event.earlyBirdAmount;
  return event.amount ?? null;
}

/**
 * The breakdown for `count` people, or null when nothing can be charged (a
 * free event, or one without a price). The event detail and My Bookings both
 * send the server's own effectiveAmount, which is used when present.
 *
 * A competition's first member pays the entry price and each further member
 * groupExtraAmount (the entry price again when unset). The coupon is a flat
 * amount off the whole order, never below zero.
 */
export function calcFees(event, count, couponDiscount = 0) {
  const price = event.effectiveAmount !== undefined ? event.effectiveAmount : getEffectiveAmount(event);
  if (price == null) return null;
  const base = event.isCompetition
    ? price + (event.groupExtraAmount ?? price) * Math.max(0, count - 1)
    : price * count;
  const discount = Math.min(couponDiscount, base);
  const discountedBase = Math.max(0, base - discount);
  const gst = event.gstEnabled ? round2(discountedBase * GST_RATE) : 0;
  const platformFee = event.platformFeeEnabled !== false ? round2(discountedBase * PLATFORM_FEE_RATE) : 0;
  const total = round2(discountedBase + gst + platformFee);
  return { effectiveAmount: price, base, discount, discountedBase, gst, platformFee, total, totalPaise: Math.round(total * 100) };
}
