import nodemailer from "nodemailer";

// The one place the site talks to SMTP. Every route sends through sendMail()
// so the transport, the from address and the layout stay in step.

// Each variable is read by name, never through a computed lookup: indexing
// import.meta.env with a variable forces the bundler to inline the whole
// build-time environment — SMTP password included — into the output.
const ENV = {
  SMTP_HOST: import.meta.env.SMTP_HOST ?? process.env.SMTP_HOST,
  SMTP_PORT: import.meta.env.SMTP_PORT ?? process.env.SMTP_PORT,
  SMTP_SECURE: import.meta.env.SMTP_SECURE ?? process.env.SMTP_SECURE,
  SMTP_USER: import.meta.env.SMTP_USER ?? process.env.SMTP_USER,
  SMTP_PASS: import.meta.env.SMTP_PASS ?? process.env.SMTP_PASS,
  EMAIL_FROM: import.meta.env.EMAIL_FROM ?? process.env.EMAIL_FROM,
  // Deployment-only, so it is read straight from the runtime environment: a
  // name the bundler cannot resolve at build time expands into a copy of the
  // whole environment.
  SITE_URL: process.env.SITE_URL,
};

const FROM_FALLBACK = '"Ulsaham Entertainments" <noreply@ulsaaham.com>';

export const SITE_URL = String(ENV.SITE_URL || "https://www.ulsaaham.com").replace(/\/+$/, "");

export function isMailConfigured() {
  return Boolean(ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS);
}

function fromAddress() {
  return ENV.EMAIL_FROM || FROM_FALLBACK;
}

let transporter = null;

function createTransporter() {
  return nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: Number(ENV.SMTP_PORT) || 587,
    secure: ENV.SMTP_SECURE === "true",
    auth: { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS },
    // Held between warm invocations so a burst of mail reuses one SMTP
    // handshake instead of opening (and authenticating) a connection per
    // message. Timeouts keep a stalled server from hanging the request until
    // the platform kills it.
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

// A pooled socket dies while the function is frozen, so the first send after a
// thaw can fail at the connection stage. Those codes are safe to retry: the
// message never reached the server. Message-level rejections are not retried.
const RETRYABLE = new Set(["ECONNECTION", "ESOCKET", "ETIMEDOUT", "ECONNRESET", "EPIPE", "EAI_AGAIN"]);

export async function sendMail(message) {
  if (!isMailConfigured()) throw new Error("SMTP is not configured");
  if (!transporter) transporter = createTransporter();

  const payload = { from: fromAddress(), ...message };

  try {
    return await transporter.sendMail(payload);
  } catch (err) {
    if (!RETRYABLE.has(err?.code)) throw err;
    try {
      transporter.close();
    } catch {
      // Already gone.
    }
    transporter = createTransporter();
    return await transporter.sendMail(payload);
  }
}

export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );
}

/**
 * Shared dark-card layout. `bodyHtml` and `footerHtml` are markup the caller
 * has already assembled from escaped values; `title` and `subtitle` are plain
 * text and are escaped here.
 */
export function renderEmailShell({ title, subtitle, bodyHtml = "", footerHtml = "" }) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#023301;border-radius:12px;color:#fff">
      <p style="font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#9bca3b;margin:0 0 6px">Ulsaham Entertainments</p>
      <h2 style="font-size:22px;margin:0 0 4px;color:#fff">${escapeHtml(title)}</h2>
      ${subtitle ? `<p style="color:rgba(255,255,255,.5);font-size:13px;margin:0 0 24px">${escapeHtml(subtitle)}</p>` : `<div style="height:20px"></div>`}
      ${bodyHtml}
      ${footerHtml
        ? `<p style="color:rgba(255,255,255,.35);font-size:11px;line-height:1.7;margin:0;border-top:1px solid rgba(255,255,255,.08);padding-top:16px">${footerHtml}</p>`
        : ""}
    </div>`;
}

/** Rows of [label, value] rendered as the detail table both mails use. */
export function renderDetailRows(rows) {
  const cells = rows
    .filter(Boolean)
    .map(
      ([label, value]) => `<tr>
          <td style="color:rgba(255,255,255,.45);font-size:12px;padding:6px 0;width:40%">${escapeHtml(label)}</td>
          <td style="color:#fff;font-size:13px;font-weight:600;padding:6px 0">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:24px">${cells}</table>`;
}
