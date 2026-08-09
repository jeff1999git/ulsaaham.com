import { useState, useEffect, useCallback } from "react";
import { getEvent } from "../lib/api.js";
import RegistrationForm from "./RegistrationForm.jsx";
import { optimizeCloudinary } from "../lib/image.js";

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function GalleryArrow({ direction, onClick, size = 44 }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={direction === "prev" ? "Previous image" : "Next image"}
      className="event-gallery__arrow"
      style={{
        [direction === "prev" ? "left" : "right"]: 10,
        width: size,
        height: size,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {direction === "prev" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
}

function ImageGallery({ images, alt }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const hasMultiple = images.length > 1;

  const goPrev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const goNext = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  // Arrow-key navigation across the whole event detail page (ignored while typing in a field)
  useEffect(() => {
    if (!hasMultiple) return;
    const onKey = (e) => {
      if (isTypingTarget(document.activeElement)) return;
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasMultiple, open, goPrev, goNext]);

  // Autoscroll every 5s; pauses while zoomed and restarts on manual navigation
  useEffect(() => {
    if (!hasMultiple || open) return;
    const timer = setTimeout(goNext, 5000);
    return () => clearTimeout(timer);
  }, [hasMultiple, open, index, goNext]);

  // ESC to close zoom + body scroll lock (also handles single-image case)
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

  const src = images[index];

  return (
    <>
      <div className="event-detail__poster" style={{ position: "relative" }}>
        <div style={{ cursor: "zoom-in" }} onClick={() => setOpen(true)}>
          <img
            src={optimizeCloudinary(src, 900)}
            alt={hasMultiple ? `${alt} — photo ${index + 1} of ${images.length}` : alt}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            width="900"
            height="1125"
          />
        </div>

        {hasMultiple && (
          <>
            <GalleryArrow direction="prev" onClick={goPrev} />
            <GalleryArrow direction="next" onClick={goNext} />
            <div className="event-gallery__counter">{index + 1} / {images.length}</div>
          </>
        )}
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
            src={optimizeCloudinary(src, 1400)}
            alt={hasMultiple ? `${alt} — photo ${index + 1} of ${images.length}` : alt}
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

          {hasMultiple && (
            <>
              <GalleryArrow direction="prev" onClick={goPrev} size={48} />
              <GalleryArrow direction="next" onClick={goNext} size={48} />
              <div className="event-gallery__counter event-gallery__counter--zoom">
                {index + 1} / {images.length}
              </div>
            </>
          )}

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
            textAlign: "center",
          }}>
            {hasMultiple ? "Use ← → to browse · ESC to close" : "Click anywhere or press ESC to close"}
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

  const isCompetition = !!event.isCompetition;
  const participationType = event.participationType || "INDIVIDUAL";
  const entryPrice = event.effectiveAmount ?? event.amount;
  const extraMemberPrice = event.groupExtraAmount ?? entryPrice;
  const participationLabel =
    participationType === "INDIVIDUAL" ? "Individual entries"
    : participationType === "GROUP" ? "Group entries (min 2 members)"
    : "Individual & group entries";

  const galleryImages = [event.bannerImageUrl, ...(event.galleryImageUrls || [])].filter(Boolean);

  return (
    <div className="event-detail">
      <div className="event-detail__layout">

        {galleryImages.length > 0 && <ImageGallery images={galleryImages} alt={event.name} />}

        <div className="event-detail__content">
          <a href="/events" className="back-link">← All Events</a>
          {event.featured && <span className="badge-featured" style={{ marginLeft: "0.75rem" }}>Featured</span>}
          {isCompetition && <span className="badge-featured" style={{ marginLeft: "0.75rem" }}>Competition</span>}

          <h1 className="font-serif text-3xl text-light mt-4 leading-snug">{event.name}</h1>

          <div className="event-meta">
            <p>📅 {date} · {event.startTime} – {event.endTime}</p>
            <p>📍 {event.venueLink
              ? <a href={event.venueLink} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px", opacity: 0.85 }}>{event.venue}</a>
              : event.venue}
            </p>
            {isCompetition && <p>🏆 {participationLabel} — chest number issued on registration</p>}
            {!isPast && (
              event.isFree ? (
                <p>🎟 Free Entry</p>
              ) : isCompetition ? (
                <p>
                  🎟 ₹{entryPrice} {participationType === "INDIVIDUAL" ? "entry" : participationType === "GROUP" ? "first member" : "individual"}
                  {participationType !== "INDIVIDUAL" && (
                    <span style={{ opacity: 0.7 }}> · +₹{extraMemberPrice} per extra group member</span>
                  )}
                </p>
              ) : event.isEarlyBird && event.earlyBirdAmount != null ? (
                <p style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                  🎟
                  <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.5)", textDecorationColor: "rgba(255,255,255,0.6)", fontSize: "0.9em" }}>₹{event.amount}</span>
                  <span style={{ color: "#9bca3b", fontWeight: 700 }}>₹{event.earlyBirdAmount}</span>
                  <span style={{ background: "rgba(155,202,59,0.15)", color: "#9bca3b", border: "1px solid rgba(155,202,59,0.35)", borderRadius: 4, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", padding: "1px 7px", textTransform: "uppercase" }}>Early Bird</span>
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
