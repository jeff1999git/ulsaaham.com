import { useState, useEffect } from "react";
import { getUser, setUser } from "../lib/auth.js";

export default function AuthForm() {
  const [next, setNext] = useState("/");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("phone"); // "phone" | "returning" | "new"
  const [existingUser, setExistingUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", age: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dest = params.get("next") || "/";
    setNext(dest);
    if (getUser()) window.location.replace(dest);
  }, []);

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      setErrors({ phone: "Enter a valid 10-digit mobile number." });
      return;
    }
    setErrors({});
    const user = getUser();
    if (user && user.phone === phone) {
      setExistingUser(user);
      setStep("returning");
    } else {
      setStep("new");
    }
  };

  const handleSignup = (e) => {
    e.preventDefault();
    const errs = {};
    const name = form.name.trim();
    const age = Number(form.age);
    if (name.length < 2) errs.name = "Name must be at least 2 characters.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email.";
    if (!form.age || isNaN(age) || age < 1 || age > 120) errs.age = "Enter a valid age (1–120).";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setUser({ name, phone, email: form.email.trim() || null, age, tickets: [] });
    window.location.replace(next);
  };

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => { const n = { ...er }; delete n[field]; return n; });
  };

  if (step === "returning") {
    return (
      <div className="auth-form">
        <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">Welcome back</p>
        <h2 className="font-serif text-2xl text-light mb-1">{existingUser.name}</h2>
        <p className="text-light/40 text-sm mb-8">+91 {existingUser.phone}</p>
        <button onClick={() => window.location.replace(next)} className="reg-submit">
          Continue →
        </button>
        <button
          onClick={() => { setStep("phone"); setPhone(""); setExistingUser(null); }}
          className="auth-form__back"
        >
          Not you? Use a different number
        </button>
      </div>
    );
  }

  if (step === "new") {
    return (
      <form onSubmit={handleSignup} className="auth-form" noValidate>
        <p className="text-light/50 text-sm mb-6">
          Create your Ulsaaham account to register for events and access your tickets.
        </p>

        <div className="reg-field">
          <label>Mobile Number</label>
          <input type="tel" value={phone} readOnly className="opacity-60 cursor-not-allowed" />
          <button type="button" onClick={() => setStep("phone")} className="auth-form__back">Change number</button>
        </div>

        <div className="reg-field">
          <label>Full Name *</label>
          <input type="text" value={form.name} onChange={set("name")} placeholder="Rahul Menon" autoFocus required />
          {errors.name && <span className="reg-field-error">{errors.name}</span>}
        </div>

        <div className="reg-field">
          <label>Email <span className="reg-field-hint">optional</span></label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="rahul@example.com" />
          {errors.email && <span className="reg-field-error">{errors.email}</span>}
        </div>

        <div className="reg-field">
          <label>Age *</label>
          <input type="number" value={form.age} onChange={set("age")} placeholder="25" min={1} max={120} required />
          {errors.age && <span className="reg-field-error">{errors.age}</span>}
        </div>

        <button type="submit" className="reg-submit">Create Account →</button>
      </form>
    );
  }

  return (
    <form onSubmit={handlePhoneSubmit} className="auth-form" noValidate>
      <p className="text-light/50 text-sm mb-6">
        Enter your mobile number to sign in or create an account. No password required.
      </p>
      <div className="reg-field">
        <label>Mobile Number *</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setErrors({}); }}
          placeholder="9876543210"
          maxLength={10}
          autoFocus
          required
        />
        {errors.phone && <span className="reg-field-error">{errors.phone}</span>}
      </div>
      <button type="submit" className="reg-submit">Continue →</button>
    </form>
  );
}
