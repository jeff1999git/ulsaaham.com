// Razorpay's checkout script, loaded once per page. The booking form starts it
// when the order summary appears and My Bookings when Complete Payment opens,
// so tapping Pay waits only for the order, not for this download too.
const CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";

// A download that has not finished by then counts as failed. Its tag is
// removed, so the next call starts a fresh one instead of waiting on a stall.
export const LOAD_TIMEOUT_MS = 15000;

let loading = null;

/**
 * Resolves true once window.Razorpay exists, or false when the script failed
 * or ran out of time. Calls made while it loads share the one download.
 */
export function loadRazorpay(timeoutMs = LOAD_TIMEOUT_MS) {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (loading) return loading;

  loading = new Promise((resolve) => {
    const script = document.createElement("script");
    let timer = null;
    const finish = (ok) => {
      clearTimeout(timer);
      script.onload = script.onerror = null;
      if (!ok) {
        script.remove();
        loading = null;
      }
      resolve(ok);
    };
    script.src = CHECKOUT_URL;
    script.async = true;
    script.onload = () => finish(!!window.Razorpay);
    script.onerror = () => finish(false);
    timer = setTimeout(() => finish(false), timeoutMs);
    document.body.appendChild(script);
  });
  return loading;
}
