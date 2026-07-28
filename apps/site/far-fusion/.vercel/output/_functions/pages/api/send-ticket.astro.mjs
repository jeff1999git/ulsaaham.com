import { createRequire } from 'module';
import nodemailer from 'nodemailer';
import { j as jsonErr, b as jsonOk } from '../../chunks/otp_D3dfmf9h.mjs';
export { renderers } from '../../renderers.mjs';

const _require = createRequire(import.meta.url);
const QRCode = _require("qrcode");
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
function formatDate(dateStr) {
  try {
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short" }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}
async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonErr(400, "Invalid request body.");
  }
  const { email, ticketCode, participantName, eventName, eventDate, eventVenue, numberOfParticipants, paymentId } = body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonErr(400, "Valid email is required.");
  if (!ticketCode || !participantName || !eventName) return jsonErr(400, "Missing ticket data.");
  const qrBuffer = await QRCode.toBuffer(ticketCode, {
    width: 220,
    margin: 2,
    color: { dark: "#fecc01", light: "#023301" }
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
      from: undefined                           || `"Ulsaham Entertainments" <noreply@ulsaham.com>`,
      to: email,
      subject: `Your ticket for ${eventName} — ${ticketCode}`,
      text: `Hi ${participantName},

Your ticket code is: ${ticketCode}

Event: ${eventName}
${eventDate ? `Date: ${formatDate(eventDate)}
` : ""}${eventVenue ? `Venue: ${eventVenue}
` : ""}${numberOfParticipants ? `Participants: ${numberOfParticipants}
` : ""}
Show this code at the venue for entry.

Ulsaham Entertainments`,
      html,
      attachments: [
        {
          filename: "ticket-qr.png",
          content: qrBuffer,
          cid: "ticket-qr"
        }
      ]
    });
  } catch (err) {
    console.error("[send-ticket] mail error:", err?.message);
    return jsonErr(500, "Failed to send ticket email.");
  }
  return jsonOk();
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
