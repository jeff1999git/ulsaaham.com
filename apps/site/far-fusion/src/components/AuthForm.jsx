import { useState, useEffect, useRef } from "react";
import { getUser, setUser, getKnownAccount } from "../lib/auth.js";

function Field({ label, hint, error, children }) {
  return (
    <div className="reg-field">
      <label>
        {label}
        {hint && <span className="reg-field-hint">{hint}</span>}
      </label>
      {children}
      {error && <span className="reg-field-error">{error}</span>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// ── Google OAuth button ───────────────────────────────────────────────────────

function GoogleButton({ next }) {
  return (
    <a
      href={`/api/auth/google?next=${encodeURIComponent(next)}`}
      className="auth-google-btn"
    >
      <GoogleIcon />
      Continue with Google
    </a>
  );
}

// ── Step 1: enter email ───────────────────────────────────────────────────────

function EmailStep({ onReturning, onNew }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const val = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    const user = getUser();
    if (user && user.email === val) {
      onReturning(user);
    } else {
      const known = getKnownAccount(val);
      if (known) {
        // Returning user whose localStorage was cleared (e.g. after logout)
        onReturning({ email: val, tickets: [], ...known });
      } else {
        onNew(val);
      }
    }
  };

  return (
    <form onSubmit={submit} className="auth-form" noValidate>
      <p className="text-light/50 text-sm mb-4">
        Enter your email to sign in or create an account.
      </p>
      <Field label="Email Address *" error={error}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="rahul@example.com"
          autoFocus
          required
        />
      </Field>
      <button type="submit" className="reg-submit">Continue →</button>
    </form>
  );
}

// ── Step 2: OTP verification ──────────────────────────────────────────────────

const RESEND_COOLDOWN = 60;

function OtpStep({ email, next, knownAccount }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const timerRef = useRef(null);

  const startCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendCooldown((n) => {
        if (n <= 1) { clearInterval(timerRef.current); return 0; }
        return n - 1;
      });
    }, 1000);
  };

  useEffect(() => { startCooldown(); return () => clearInterval(timerRef.current); }, []);

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, resend: true }),
    }).catch(() => null);
    const d = await res?.json().catch(() => ({}));
    setResending(false);
    if (!res?.ok) { setError(d?.error || "Failed to resend. Please try again."); return; }
    setOtp("");
    startCooldown();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) { setError("Enter the 6-digit code."); return; }
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: otp.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Verification failed. Please try again.");
      if (data.attemptsLeft !== undefined) setAttemptsLeft(data.attemptsLeft);
      return;
    }

    // Merge profile data from known account (returning user re-login via OTP)
    const userData = knownAccount ? { ...knownAccount, ...data.data } : data.data;
    setUser(userData);
    window.location.replace(next);
  };

  return (
    <form onSubmit={submit} className="auth-form" noValidate>
      <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">Check your inbox</p>
      <p className="text-light/60 text-sm mb-6">
        We sent a 6-digit code to <strong className="text-light">{email}</strong>. It expires in 10 minutes.
      </p>

      {error && <div className="reg-error">{error}</div>}

      <div className="reg-field">
        <label>Verification Code *</label>
        <input
          type="text"
          inputMode="numeric"
          value={otp}
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          placeholder="123456"
          maxLength={6}
          autoFocus
          style={{ fontFamily: "monospace", letterSpacing: "0.3em", fontSize: "1.4rem" }}
          required
        />
      </div>

      {attemptsLeft < 5 && (
        <p className="text-xs text-light/40">{attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining</p>
      )}

      <button type="submit" disabled={submitting} className="reg-submit">
        {submitting ? "Verifying…" : knownAccount ? "Verify & Sign In →" : "Verify & Create Account →"}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resendCooldown > 0 || resending}
        className="auth-form__back"
        style={{ textAlign: "center", width: "100%" }}
      >
        {resending ? "Resending…" : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
      </button>
    </form>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function AuthForm() {
  const [next, setNext] = useState("/account");
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [knownAccount, setKnownAccount] = useState(null);
  const [googleError, setGoogleError] = useState("");
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dest = params.get("next") || "/account";
    setNext(dest);
    if (getUser()) window.location.replace(dest);

    const err = params.get("error");
    if (err === "google_denied") setGoogleError("Google sign-in was cancelled.");
    else if (err === "google_token" || err === "google_profile") setGoogleError("Google sign-in failed. Please try again.");
    else if (err === "auth_failed") setGoogleError("Sign-in failed. Please try again.");
  }, []);

  const sendOtp = async (emailVal, known = null) => {
    setSending(true);
    setSendError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailVal }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setSending(false);
    if (!res?.ok) {
      setSendError(data?.error || "Failed to send verification code. Please try again.");
      return;
    }
    setKnownAccount(known);
    setStep("otp");
  };

  if (sending) return (
    <div className="auth-form" style={{ minHeight: "160px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" />
      <p className="text-light/40 text-sm mt-4">Sending verification code…</p>
    </div>
  );

  if (step === "otp") return <OtpStep email={email} next={next} knownAccount={knownAccount} />;

  return (
    <div>
      {(googleError || sendError) && (
        <div className="reg-error" style={{ marginBottom: "1rem" }}>{googleError || sendError}</div>
      )}

      <GoogleButton next={next} />

      <div className="auth-divider"><span>or continue with email</span></div>

      <EmailStep
        onReturning={(user) => {
          // Google-only accounts must use Google OAuth
          if (user.googleId && !user.passwordHash) {
            window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
            return;
          }
          // All other returning users verify via OTP
          const known = getKnownAccount(user.email) || user;
          setEmail(user.email);
          sendOtp(user.email, known);
        }}
        onNew={(val) => { setSendError(""); setEmail(val); sendOtp(val, null); }}
      />
    </div>
  );
}
