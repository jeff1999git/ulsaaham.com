import nodemailer from "nodemailer";
import {
  signCookie, verifyCookie, generateOtp, hashOtp,
  jsonErr, jsonOk,
  COOKIE_NAME, OTP_TTL_MS, RESEND_COOLDOWN_MS,
  MAX_SENDS_PER_HOUR, SEND_WINDOW_MS, COOKIE_OPTS,
} from "../../../lib/otp.js";

function makeTransporter() {
  return nodemailer.createTransport({
    host: import.meta.env.SMTP_HOST,
    port: Number(import.meta.env.SMTP_PORT) || 587,
    secure: import.meta.env.SMTP_SECURE === "true",
    auth: {
      user: import.meta.env.SMTP_USER,
      pass: import.meta.env.SMTP_PASS,
    },
  });
}

async function sendOtpEmail(to, otp) {
  const transporter = makeTransporter();
  await transporter.sendMail({
    from: import.meta.env.EMAIL_FROM || `"Ulsaham Entertainments" <noreply@ulsaham.com>`,
    to,
    subject: `Your Ulsaham verification code: ${otp}`,
    text: `Your one-time verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you did not request this, ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#023301;border-radius:12px;color:#fff">
        <p style="font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#fecc01;margin:0 0 6px">Ulsaham Entertainments</p>
        <h2 style="font-size:22px;margin:0 0 24px;color:#fff">Your verification code</h2>
        <div style="background:rgba(254,204,1,.1);border:1px solid rgba(254,204,1,.35);border-radius:10px;padding:28px;text-align:center;margin-bottom:24px">
          <p style="font-size:44px;font-weight:700;letter-spacing:.35em;color:#fecc01;margin:0;font-family:monospace">${otp}</p>
        </div>
        <p style="color:rgba(255,255,255,.55);font-size:13px;line-height:1.7;margin:0 0 8px">
          This code expires in <strong style="color:#fff">10 minutes</strong>. Do not share it with anyone.
        </p>
        <p style="color:rgba(255,255,255,.28);font-size:11px;margin:0">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>`,
  });
}

export async function POST({ request, cookies }) {
  let body;
  try { body = await request.json(); } catch { return jsonErr(400, "Invalid request body."); }

  const { resend } = body;
  const normalEmail = body.email?.trim().toLowerCase();
  if (!normalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalEmail))
    return jsonErr(400, "A valid email address is required.");

  const existing = verifyCookie(cookies.get(COOKIE_NAME)?.value);
  const now = Date.now();

  // ── Resend path: reuse data already in the cookie ────────────────────────────
  if (resend) {
    if (!existing || existing.email !== normalEmail)
      return jsonErr(400, "No active OTP session for this email. Please restart signup.");

    if (now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      const waitSecs = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      return jsonErr(429, `Please wait ${waitSecs} seconds before requesting another code.`);
    }
    if (existing.sendCount >= MAX_SENDS_PER_HOUR && now - existing.firstSentAt < SEND_WINDOW_MS) {
      return jsonErr(429, "Too many OTP requests for this email. Please try again in an hour.");
    }

    const otp = generateOtp();
    const updated = {
      ...existing,
      hashedOtp: hashOtp(otp),
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      lastSentAt: now,
      sendCount: existing.sendCount + 1,
    };
    cookies.set(COOKIE_NAME, signCookie(updated), COOKIE_OPTS(600));

    try { await sendOtpEmail(normalEmail, otp); }
    catch (err) { console.error("[send-otp] resend mail error:", err?.message); return jsonErr(500, "Failed to resend code. Please try again."); }

    return jsonOk();
  }

  // ── First send: only email is required; profile fields are optional ──────────
  // Rate-limit first sends too
  if (existing && existing.email === normalEmail) {
    if (now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      const waitSecs = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      return jsonErr(429, `Please wait ${waitSecs} seconds.`);
    }
    if (existing.sendCount >= MAX_SENDS_PER_HOUR && now - existing.firstSentAt < SEND_WINDOW_MS) {
      return jsonErr(429, "Too many OTP requests for this email. Please try again in an hour.");
    }
  }

  const { name, phone, age, passwordHash } = body;
  const otp = generateOtp();
  const prevCount = existing?.email === normalEmail ? (existing.sendCount ?? 0) : 0;
  const session = {
    email: normalEmail,
    hashedOtp: hashOtp(otp),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: now,
    firstSentAt: prevCount > 0 ? existing.firstSentAt : now,
    sendCount: prevCount + 1,
  };
  // Include profile fields only if provided (backward-compat with old call sites)
  if (name) session.name = String(name).trim();
  if (phone) session.phone = phone;
  if (age !== undefined) { const n = Number(age); if (!isNaN(n)) session.age = n; }
  if (passwordHash) session.passwordHash = passwordHash;
  cookies.set(COOKIE_NAME, signCookie(session), COOKIE_OPTS(600));

  try { await sendOtpEmail(normalEmail, otp); }
  catch (err) { console.error("[send-otp] mail error:", err?.message); return jsonErr(500, "Failed to send the verification email. Please try again."); }

  return jsonOk();
}
