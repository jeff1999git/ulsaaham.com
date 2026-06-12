import { createRequire } from "module";
import nodemailer from "nodemailer";
const _require = createRequire(import.meta.url);
const QRCode = _require("qrcode");
import { jsonErr, jsonOk } from "../../lib/otp.js";

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

function formatDate(dateStr) {
  try {
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short" }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return jsonErr(400, "Invalid request body."); }

  const { email, ticketCode, participantName, eventName, eventDate, eventVenue, numberOfParticipants, paymentId } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonErr(400, "Valid email is required.");
  if (!ticketCode || !participantName || !eventName) return jsonErr(400, "Missing ticket data.");

  // Generate QR code as PNG buffer
  const qrBuffer = await QRCode.toBuffer(ticketCode, {
    width: 220,
    margin: 2,
    color: { dark: "#fecc01", light: "#023301" },
  });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#023301;border-radius:12px;color:#fff">
      <p style="font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#fecc01;margin:0 0 6px">Ulsaham Entertainments</p>
      <h2 style="font-size:22px;margin:0 0 4px;color:#fff">You're booked!</h2>
      <p style="color:rgba(255,255,255,.5);font-size:13px;margin:0 0 24px">${eventName}</p>

      <div style="background:rgba(254,204,1,.08);border:1px solid rgba(254,204,1,.3);border-radius:10px;padding:20px 24px;margin-bottom:24px;text-align:center">
        <img src="cid:ticket-qr" width="160" height="160" alt="QR Code" style="display:block;margin:0 auto 16px;border-radius:8px" />
        <p style="font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(254,204,1,.7);margin:0 0 6px">Ticket Code</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:.2em;color:#fecc01;margin:0;font-family:monospace">${ticketCode}</p>
        <p style="font-size:11px;color:rgba(255,255,255,.3);margin:10px 0 0">Scan the QR code or show the ticket code at the venue</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>
          <td style="color:rgba(255,255,255,.45);font-size:12px;padding:6px 0;width:40%">Name</td>
          <td style="color:#fff;font-size:13px;font-weight:600;padding:6px 0">${participantName}</td>
        </tr>
        <tr>
          <td style="color:rgba(255,255,255,.45);font-size:12px;padding:6px 0">Event</td>
          <td style="color:#fff;font-size:13px;font-weight:600;padding:6px 0">${eventName}</td>
        </tr>
        ${eventDate ? `<tr>
          <td style="color:rgba(255,255,255,.45);font-size:12px;padding:6px 0">Date</td>
          <td style="color:#fff;font-size:13px;font-weight:600;padding:6px 0">${formatDate(eventDate)}</td>
        </tr>` : ""}
        ${eventVenue ? `<tr>
          <td style="color:rgba(255,255,255,.45);font-size:12px;padding:6px 0">Venue</td>
          <td style="color:#fff;font-size:13px;font-weight:600;padding:6px 0">${eventVenue}</td>
        </tr>` : ""}
        ${numberOfParticipants ? `<tr>
          <td style="color:rgba(255,255,255,.45);font-size:12px;padding:6px 0">Participants</td>
          <td style="color:#fff;font-size:13px;font-weight:600;padding:6px 0">${numberOfParticipants}</td>
        </tr>` : ""}
        ${paymentId ? `<tr>
          <td style="color:rgba(255,255,255,.45);font-size:12px;padding:6px 0">Payment ID</td>
          <td style="color:rgba(255,255,255,.45);font-size:11px;padding:6px 0;word-break:break-all">${paymentId}</td>
        </tr>` : ""}
      </table>

      <p style="color:rgba(255,255,255,.35);font-size:11px;line-height:1.7;margin:0;border-top:1px solid rgba(255,255,255,.08);padding-top:16px">
        Screenshot or save this email — bring your QR code to the venue. You can also view your bookings in your
        <a href="https://www.ulsaaham.com/account" style="color:#fecc01">Ulsaham account</a>.
      </p>
    </div>`;

  const transporter = makeTransporter();

  try {
    await transporter.sendMail({
      from: import.meta.env.EMAIL_FROM || `"Ulsaham Entertainments" <noreply@ulsaham.com>`,
      to: email,
      subject: `Your ticket for ${eventName} — ${ticketCode}`,
      text: `Hi ${participantName},\n\nYour ticket code is: ${ticketCode}\n\nEvent: ${eventName}\n${eventDate ? `Date: ${formatDate(eventDate)}\n` : ""}${eventVenue ? `Venue: ${eventVenue}\n` : ""}${numberOfParticipants ? `Participants: ${numberOfParticipants}\n` : ""}\nShow this code at the venue for entry.\n\nUlsaham Entertainments`,
      html,
      attachments: [
        {
          filename: "ticket-qr.png",
          content: qrBuffer,
          cid: "ticket-qr",
        },
      ],
    });
  } catch (err) {
    console.error("[send-ticket] mail error:", err?.message);
    return jsonErr(500, "Failed to send ticket email.");
  }

  return jsonOk();
}
