import { SUPPORT_EMAIL, supportMailto } from "../lib/contact.js";

const linkStyle = { color: "#9bca3b", textDecoration: "underline" };

// Shown when Razorpay took the payment but the booking could not be confirmed.
// There is no Pay button here on purpose: paying again would charge twice.
// The customer gets the reason, the Payment ID support will ask for, and a
// way to ask for the confirmation again (it is safe to repeat).
export default function VerifyFailed({ message, paymentId, onRetry, retrying = false, accountLink = true }) {
  return (
    <div role="alert" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <p className="text-light font-semibold text-sm">Payment received — booking not confirmed yet</p>
      <div className="reg-error">{message}</div>
      <p className="text-light/60 text-sm">
        Payment ID: <strong style={{ fontFamily: "monospace", color: "#fff", userSelect: "all" }}>{paymentId}</strong>
        <br />
        Keep this ID, and please don&apos;t pay again.
      </p>
      <button type="button" onClick={onRetry} disabled={retrying} className="reg-submit">
        {retrying ? "Confirming…" : "Retry confirmation"}
      </button>
      <p className="text-light/40 text-xs">
        Still not confirmed? Write to{" "}
        <a href={supportMailto(`Payment ${paymentId}`)} style={linkStyle}>{SUPPORT_EMAIL}</a> with the Payment ID
        {accountLink ? (
          <>
            , or check <a href="/account" style={linkStyle}>My Bookings</a>.
          </>
        ) : (
          "."
        )}
      </p>
    </div>
  );
}
