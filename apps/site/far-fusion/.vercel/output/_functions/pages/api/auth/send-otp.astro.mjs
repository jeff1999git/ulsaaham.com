import nodemailer from 'nodemailer';
import { j as jsonErr, v as verifyCookie, C as COOKIE_NAME, R as RESEND_COOLDOWN_MS, M as MAX_SENDS_PER_HOUR, S as SEND_WINDOW_MS, g as generateOtp, h as hashOtp, s as signCookie, a as COOKIE_OPTS, b as jsonOk, O as OTP_TTL_MS } from '../../../chunks/otp_D3dfmf9h.mjs';
export { renderers } from '../../../renderers.mjs';

function makeTransporter() {
  return nodemailer.createTransport({
    host: undefined                         ,
    port: Number(undefined                         ) || 587,
    secure: undefined                            === "true",
    auth: {
      user: undefined                         ,
      pass: undefined                         
    }
  });
}
async function sendOtpEmail(to, otp) {
  const transporter = makeTransporter();
  await transporter.sendMail({
    from: `"Ulsaham Entertainments" <noreply@ulsaham.com>`,
    to,
    subject: `Your Ulsaham verification code: ${otp}`,
    text: `Your one-time verification code is: ${otp}

This code expires in 10 minutes. Do not share it with anyone.

If you did not request this, ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#023301;border-radius:12px;color:#fff">
        <p style="font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#9bca3b;margin:0 0 6px">Ulsaham Entertainments</p>
        <h2 style="font-size:22px;margin:0 0 24px;color:#fff">Your verification code</h2>
        <div style="background:rgba(155,202,59,.1);border:1px solid rgba(155,202,59,.35);border-radius:10px;padding:28px;text-align:center;margin-bottom:24px">
          <p style="font-size:44px;font-weight:700;letter-spacing:.35em;color:#9bca3b;margin:0;font-family:monospace">${otp}</p>
        </div>
        <p style="color:rgba(255,255,255,.55);font-size:13px;line-height:1.7;margin:0 0 8px">
          This code expires in <strong style="color:#fff">10 minutes</strong>. Do not share it with anyone.
        </p>
        <p style="color:rgba(255,255,255,.28);font-size:11px;margin:0">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>`
  });
}
async function POST({ request, cookies }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonErr(400, "Invalid request body.");
  }
  const { resend } = body;
  const normalEmail = body.email?.trim().toLowerCase();
  if (!normalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalEmail))
    return jsonErr(400, "A valid email address is required.");
  const existing = verifyCookie(cookies.get(COOKIE_NAME)?.value);
  const now = Date.now();
  if (resend) {
    if (!existing || existing.email !== normalEmail)
      return jsonErr(400, "No active OTP session for this email. Please restart signup.");
    if (now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      const waitSecs = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1e3);
      return jsonErr(429, `Please wait ${waitSecs} seconds before requesting another code.`);
    }
    if (existing.sendCount >= MAX_SENDS_PER_HOUR && now - existing.firstSentAt < SEND_WINDOW_MS) {
      return jsonErr(429, "Too many OTP requests for this email. Please try again in an hour.");
    }
    const otp2 = generateOtp();
    const updated = {
      ...existing,
      hashedOtp: hashOtp(otp2),
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      lastSentAt: now,
      sendCount: existing.sendCount + 1
    };
    cookies.set(COOKIE_NAME, signCookie(updated), COOKIE_OPTS(600));
    try {
      await sendOtpEmail(normalEmail, otp2);
    } catch (err) {
      console.error("[send-otp] resend mail error:", err?.message);
      return jsonErr(500, "Failed to resend code. Please try again.");
    }
    return jsonOk();
  }
  if (existing && existing.email === normalEmail) {
    if (now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      const waitSecs = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1e3);
      return jsonErr(429, `Please wait ${waitSecs} seconds.`);
    }
    if (existing.sendCount >= MAX_SENDS_PER_HOUR && now - existing.firstSentAt < SEND_WINDOW_MS) {
      return jsonErr(429, "Too many OTP requests for this email. Please try again in an hour.");
    }
  }
  const { name, phone, age, passwordHash } = body;
  const otp = generateOtp();
  const prevCount = existing?.email === normalEmail ? existing.sendCount ?? 0 : 0;
  const session = {
    email: normalEmail,
    hashedOtp: hashOtp(otp),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: now,
    firstSentAt: prevCount > 0 ? existing.firstSentAt : now,
    sendCount: prevCount + 1
  };
  if (name) session.name = String(name).trim();
  if (phone) session.phone = phone;
  if (age !== void 0) {
    const n = Number(age);
    if (!isNaN(n)) session.age = n;
  }
  if (passwordHash) session.passwordHash = passwordHash;
  cookies.set(COOKIE_NAME, signCookie(session), COOKIE_OPTS(600));
  try {
    await sendOtpEmail(normalEmail, otp);
  } catch (err) {
    console.error("[send-otp] mail error:", err?.message);
    return jsonErr(500, "Failed to send the verification email. Please try again.");
  }
  return jsonOk();
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
