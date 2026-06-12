import { useState, useEffect } from "react";
import { getEvent } from "../lib/api.js";
import RegistrationForm from "./RegistrationForm.jsx";

function PosterViewer({ src, alt }) {
  const [open, setOpen] = useState(false);

  // ESC to close + body scroll lock
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div
        className="event-detail__poster"
        style={{ cursor: "zoom-in" }}
        onClick={() => setOpen(true)}
      >
        <img src={src} alt={alt} loading="eager" decoding="async" />
      </div>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.93)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setOpen(false)}
        >
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: "min(100%, 560px)",
              maxHeight: "93vh",
              objectFit: "contain",
              borderRadius: 12,
              boxShadow: "0 24px 80px rgba(0,0,0,0.9)",
              display: "block",
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
              color: "#fff",
              width: 44,
              height: 44,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
          <p style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.3)",
            fontSize: 12,
            letterSpacing: "0.08em",
            pointerEvents: "none",
          }}>
            Click anywhere or press ESC to close
          </p>
        </div>
      )}
    </>
  );
}

export default function EventDetail() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("slug");
    if (!slug) { setError("No event specified."); setLoading(false); return; }
    getEvent(slug)
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Event not found.");
        setEvent(data.data.event);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="event-detail-state"><div className="spinner" /></div>;
  if (error) return (
    <div className="event-detail-state">
      <p className="text-light/50 mb-4">{error}</p>
      <a href="/events" className="back-link">← Back to Events</a>
    </div>
  );

  const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(new Date(event.date));
  const isPast = new Date(event.date) < new Date();
  const spotsLeft = event.capacity ? event.capacity - event.registeredCount : null;

  return (
    <div className="event-detail">
      <div className="event-detail__layout">

        {event.bannerImageUrl && <PosterViewer src={event.bannerImageUrl} alt={event.name} />}

        <div className="event-detail__content">
          <a href="/events" className="back-link">← All Events</a>
          {event.featured && <span className="badge-featured" style={{ marginLeft: "0.75rem" }}>Featured</span>}

          <h1 className="font-serif text-3xl text-light mt-4 leading-snug">{event.name}</h1>

          <div className="event-meta">
            <p>📅 {date} · {event.startTime} – {event.endTime}</p>
            <p>📍 {event.venueLink
              ? <a href={event.venueLink} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px", opacity: 0.85 }}>{event.venue}</a>
              : event.venue}
            </p>
            {!isPast && (
              event.isFree ? (
                <p>🎟 Free Entry</p>
              ) : event.isEarlyBird && event.earlyBirdAmount != null ? (
                <p style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                  🎟
                  <span style={{ textDecoration: "line-through", opacity: 0.45, fontSize: "0.9em" }}>₹{event.amount}</span>
                  <span style={{ color: "#fecc01", fontWeight: 700 }}>₹{event.earlyBirdAmount}</span>
                  <span style={{ background: "rgba(254,204,1,0.15)", color: "#fecc01", border: "1px solid rgba(254,204,1,0.35)", borderRadius: 4, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", padding: "1px 7px", textTransform: "uppercase" }}>Early Bird</span>
                  <span style={{ opacity: 0.55 }}>per person</span>
                </p>
              ) : (
                <p>🎟 ₹{event.amount} per person</p>
              )
            )}
            {event.capacity != null && (
              <p className={event.isFull || spotsLeft <= 20 ? "text-red-400" : "text-light/50"}>
                🔢 {event.isFull
                  ? "Event is full"
                  : spotsLeft === null
                  ? "Unlimited capacity"
                  : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} remaining`}
              </p>
            )}
          </div>

          {event.description && (
            <div className="event-detail__desc">
              <p>{event.description}</p>
            </div>
          )}

          <RegistrationForm event={event} />
        </div>

      </div>
    </div>
  );
}
