import { useState } from "react";
import { checkTicket } from "../lib/api.js";

export default function TicketChecker() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    setError(null);
    const { ok, data } = await checkTicket(trimmed);
    setLoading(false);
    if (ok) setResult(data.data);
    else setError(data.error || "Ticket not found.");
  };

  return (
    <div className="ticket-checker">
      <form onSubmit={handleSubmit} className="ticket-checker__form">
        <label className="text-light/50 text-xs uppercase tracking-widest block mb-2">
          Enter your ticket code
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
            placeholder="ULS-ABC123"
            className="ticket-input"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="submit" disabled={loading || !code.trim()} className="ticket-submit">
            {loading ? "…" : "Check"}
          </button>
        </div>
        {error && <p className="ticket-error mt-3">{error}</p>}
      </form>

      {result && (
        <div className="ticket-result">
          <p className="ticket-result__code">{result.ticketCode}</p>
          <dl className="ticket-dl">
            <dt>Name</dt><dd>{result.participantName}</dd>
            <dt>Event</dt><dd>{result.eventName}</dd>
            <dt>Date</dt>
            <dd>{new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(new Date(result.eventDate))}</dd>
            <dt>Venue</dt><dd>{result.eventVenue}</dd>
            <dt>Participants</dt><dd>{result.numberOfParticipants}</dd>
            <dt>Registered</dt>
            <dd>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(result.registeredAt))}</dd>
            <dt>Status</dt>
            <dd className={result.attended ? "text-green-400" : "text-accent"}>
              {result.attended ? "✓ Attended" : "⏳ Not yet attended"}
            </dd>
          </dl>
        </div>
      )}
    </div>
  );
}
