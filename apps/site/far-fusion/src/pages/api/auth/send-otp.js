import { jsonErr, jsonOk } from "../../../lib/http.js";
import { escapeHtml, isMailConfigured, renderEmailShell, sendMail } from "../../../lib/mailer.js";
import { getClientIp, rateLimit, releaseLimit, HOUR_MS } from "../../../lib/rate-limit.js";
import {
  signCookie, verifyCookie, generateOtp, hashOtp,
  isOtpConfigured, currentSendWindow,
  COOKIE_NAME, OTP_TTL_MS, RESEND_COOLDOWN_MS,
  MAX_SENDS_PER_HOUR, SEND_WINDOW_MS, COOKIE_OPTS,
} from "../../../lib/otp.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The cookie counters below travel with the client and reset if it drops the
// cookie, so the real ceiling is enforced here, in the server's own memory.
const SENDS_PER_IP_PER_HOUR = 8;
const SENDS_PER_EMAIL_PER_HOUR = 5;

const UNAVAILABLE = "Sign-in is temporarily unavailable. Please try again later.";

async function sendOtpEmail(to, otp) {
  const bodyHtml = `
      <div style="background:rgba(155,202,59,.1);border:1px solid rgba(155,202,59,.35);border-radius:10px;padding:28px;text-align:center;margin-bottom:24px">
        <p style="font-size:44px;font-weight:700;letter-spacing:.35em;color:#9bca3b;margin:0;font-family:monospace">${escapeHtml(otp)}</p>
      </div>
      <p style="color:rgba(255,255,255,.55);font-size:13px;line-height:1.7;margin:0 0 16px">
        This code expires in <strong style="color:#fff">10 minutes</strong>. Do not share it with anyone.
      </p>`;

  await sendMail({
    to,
    // The code is deliberately kept out of the subject line so it does not show
    // up in lock-screen previews or in mail-server subject logs.
    subject: "Your Ulsaham verification code",
    text: `Your one-time verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you did not request this, ignore this email.\n\nUlsaham Entertainments`,
    html: renderEmailShell({
      title: "Your verification code",
      bodyHtml,
      footerHtml: "If you didn&#39;t request this, you can safely ignore this email.",
    }),
  }, "otp");
}

export async function POST(context) {
  const { request, cookies } = context;

  if (!isOtpConfigured() || !isMailConfigured()) return jsonErr(503, UNAVAILABLE);

  let body;
  try { body = await request.json(); } catch { return jsonErr(400, "Invalid request body."); }

  const resend = body?.resend === true;
  const normalEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!normalEmail || normalEmail.length > 254 || !EMAIL_RE.test(normalEmail))
    return jsonErr(400, "A valid email address is required.");

  const now = Date.now();
  const stored = verifyCookie(cookies.get(COOKIE_NAME)?.value);
  const session = stored && stored.email === normalEmail ? stored : null;

  if (resend && !session)
    return jsonErr(400, "No active OTP session for this email. Please restart signup.");

  // Per-session limits: cheap, and they can quote an exact wait time.
  if (session && typeof session.lastSentAt === "number" && now - session.lastSentAt < RESEND_COOLDOWN_MS) {
    const waitSecs = Math.ceil((RESEND_COOLDOWN_MS - (now - session.lastSentAt)) / 1000);
    return jsonErr(429, `Please wait ${waitSecs} seconds before requesting another code.`, { retryAfter: waitSecs });
  }

  const sendWindow = currentSendWindow(session, now);
  if (sendWindow.sendCount >= MAX_SENDS_PER_HOUR) {
    const waitSecs = Math.max(1, Math.ceil((sendWindow.firstSentAt + SEND_WINDOW_MS - now) / 1000));
    return jsonErr(429, "Too many OTP requests for this email. Please try again in an hour.", { retryAfter: waitSecs });
  }

  // Server-side limits: these still hold when the client clears its cookie.
  const ip = getClientIp(context);
  const ipKey = `otp:ip:${ip || "unknown"}`;
  const emailKey = `otp:email:${normalEmail}`;

  const ipLimit = rateLimit(ipKey, { limit: SENDS_PER_IP_PER_HOUR, windowMs: HOUR_MS });
  if (!ipLimit.allowed)
    return jsonErr(429, "Too many verification codes requested from this device. Please try again later.", {
      retryAfter: ipLimit.retryAfter,
    });

  const emailLimit = rateLimit(emailKey, { limit: SENDS_PER_EMAIL_PER_HOUR, windowMs: HOUR_MS });
  if (!emailLimit.allowed) {
    releaseLimit(ipKey);
    return jsonErr(429, "Too many OTP requests for this email. Please try again in an hour.", {
      retryAfter: emailLimit.retryAfter,
    });
  }

  const otp = generateOtp();
  const next = {
    email: normalEmail,
    hashedOtp: hashOtp(otp),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: now,
    firstSentAt: sendWindow.firstSentAt,
    sendCount: sendWindow.sendCount + 1,
  };

  // Signup fields ride along so verify-otp can hand them back once the address
  // is proven. A resend keeps whatever the first send captured.
  const profile = resend ? session : body;
  if (profile?.name) next.name = String(profile.name).trim();
  if (profile?.phone) next.phone = profile.phone;
  if (profile?.age !== undefined) {
    const age = Number(profile.age);
    if (!Number.isNaN(age)) next.age = age;
  }
  if (profile?.passwordHash) next.passwordHash = profile.passwordHash;

  // Mail first: a failed send must not burn the cooldown or leave a cookie
  // holding a code that never arrived.
  try {
    await sendOtpEmail(normalEmail, otp);
  } catch (err) {
    console.error("[send-otp] mail error:", err?.message);
    releaseLimit(ipKey);
    releaseLimit(emailKey);
    return jsonErr(
      500,
      resend ? "Failed to resend code. Please try again." : "Failed to send the verification email. Please try again."
    );
  }

  cookies.set(COOKIE_NAME, signCookie(next), COOKIE_OPTS(600));
  return jsonOk();
}
