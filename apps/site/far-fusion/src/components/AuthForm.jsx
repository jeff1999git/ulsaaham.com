import { useState, useEffect, useRef } from "react";
import { getUser, setUser, hashPassword, verifyPassword } from "../lib/auth.js";

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
    if (user && user.email === val) onReturning(user);
    else onNew(val);
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

// ── Step 2a: returning user — password check ──────────────────────────────────

function PasswordStep({ user, next, onBack }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Google-only account — no password set
  if (user.googleId && !user.passwordHash) {
    return (
      <div className="auth-form">
        <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">Welcome back</p>
        <h2 className="font-serif text-2xl text-light mb-1">{user.name}</h2>
        <p className="text-light/40 text-sm mb-6">{user.email}</p>
        <p className="text-light/50 text-sm mb-6">
          This account uses Google sign-in. Continue with Google to access your account.
        </p>
        <a
          href={`/api/auth/google?next=${encodeURIComponent(next)}`}
          className="auth-google-btn"
        >
          <GoogleIcon />
          Continue with Google
        </a>
        <button onClick={onBack} className="auth-form__back">← Use a different email</button>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!password) { setError("Enter your password."); return; }
    setSubmitting(true);
    const ok = await verifyPassword(password, user.email, user.passwordHash);
    setSubmitting(false);
    if (!ok) { setError("Incorrect password."); return; }
    window.location.replace(next);
  };

  return (
    <div className="auth-form">
      <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">Welcome back</p>
      <h2 className="font-serif text-2xl text-light mb-1">{user.name}</h2>
      <p className="text-light/40 text-sm mb-6">{user.email}</p>
      <form onSubmit={submit} noValidate>
        <Field label="Password *" error={error}>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Your password"
            autoFocus
            required
          />
        </Field>
        <button type="submit" disabled={submitting} className="reg-submit">
          {submitting ? "Signing in…" : "Sign In →"}
        </button>
      </form>
      <button onClick={onBack} className="auth-form__back">← Use a different email</button>
    </div>
  );
}

// ── Step 2b: new user — signup form ──────────────────────────────────────────

function SignupStep({ email, onOtpSent, onBack }) {
  const [form, setForm] = useState({ name: "", phone: "", password: "", confirmPassword: "", age: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (f) => (e) => {
    setForm((prev) => ({ ...prev, [f]: e.target.value }));
    setErrors((prev) => { const n = { ...prev }; delete n[f]; return n; });
    setGlobalError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    if (!/^\d{10}$/.test(form.phone)) errs.phone = "Enter a valid 10-digit mobile number.";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";
    const age = Number(form.age);
    if (!form.age || isNaN(age) || age < 1 || age > 120) errs.age = "Enter a valid age (1–120).";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setGlobalError("");

    const passwordHash = await hashPassword(form.password, email);

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name: form.name.trim(),
        phone: form.phone.trim(),
        age,
        passwordHash,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) { setGlobalError(data.error || "Failed to send verification code. Please try again."); return; }
    onOtpSent();
  };

  return (
    <form onSubmit={submit} className="auth-form" noValidate>
      <p className="text-light/50 text-sm mb-4">
        Create your Ulsaham account to register for events and track your tickets.
      </p>

      {globalError && <div className="reg-error">{globalError}</div>}

      <div className="reg-field">
        <label>Email</label>
        <input type="email" value={email} readOnly className="opacity-50 cursor-not-allowed" />
        <button type="button" onClick={onBack} className="auth-form__back">Change email</button>
      </div>

      <Field label="Full Name *" error={errors.name}>
        <input type="text" value={form.name} onChange={set("name")} placeholder="Rahul Menon" autoFocus required />
      </Field>

      <Field label="Mobile Number *" hint="10 digits, no +91" error={errors.phone}>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => { set("phone")({ target: { value: e.target.value.replace(/\D/g, "").slice(0, 10) } }); }}
          placeholder="9876543210"
          maxLength={10}
          required
        />
      </Field>

      <Field label="Age *" error={errors.age}>
        <input type="number" value={form.age} onChange={set("age")} placeholder="25" min={1} max={120} required />
      </Field>

      <Field label="Password *" hint="min 8 chars" error={errors.password}>
        <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required />
      </Field>

      <Field label="Confirm Password *" error={errors.confirmPassword}>
        <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="••••••••" required />
      </Field>

      <button type="submit" disabled={submitting} className="reg-submit">
        {submitting ? "Sending code…" : "Send Verification Code →"}
      </button>
    </form>
  );
}

// ── Step 3: OTP verification ──────────────────────────────────────────────────

const RESEND_COOLDOWN = 60;

function OtpStep({ email, next }) {
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

    setUser(data.data);
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
        {submitting ? "Verifying…" : "Verify & Create Account →"}
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
  const [returningUser, setReturningUser] = useState(null);
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dest = params.get("next") || "/account";
    setNext(dest);
    if (getUser()) window.location.replace(dest);

    // Show error messages from Google OAuth redirect
    const err = params.get("error");
    if (err === "google_denied") setGoogleError("Google sign-in was cancelled.");
    else if (err === "google_token" || err === "google_profile") setGoogleError("Google sign-in failed. Please try again.");
    else if (err === "auth_failed") setGoogleError("Sign-in failed. Please try again.");
  }, []);

  if (step === "password") return <PasswordStep user={returningUser} next={next} onBack={() => setStep("email")} />;
  if (step === "signup")   return <SignupStep email={email} onOtpSent={() => setStep("otp")} onBack={() => setStep("email")} />;
  if (step === "otp")      return <OtpStep email={email} next={next} />;

  return (
    <div>
      {googleError && <div className="reg-error" style={{ marginBottom: "1rem" }}>{googleError}</div>}

      <GoogleButton next={next} />

      <div className="auth-divider"><span>or continue with email</span></div>

      <EmailStep
        onReturning={(user) => {
          // Google-only user tried to sign in via email step
          if (user.googleId && !user.passwordHash) {
            window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
            return;
          }
          setReturningUser(user);
          setStep("password");
        }}
        onNew={(val) => { setEmail(val); setStep("signup"); }}
      />
    </div>
  );
}
