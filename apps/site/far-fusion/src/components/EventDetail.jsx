import { useState, useEffect } from "react";
import { getEvent } from "../lib/api.js";
import RegistrationForm from "./RegistrationForm.jsx";

export default function EventDetail() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("slug");
    if (!slug) {
      setError("No event specified.");
      setLoading(false);
      return;
    }
    getEvent(slug)
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Event not found.");
        setEvent(data.data.event);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="event-detail-state">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-detail-state">
        <p className="text-light/50 mb-4">{error}</p>
        <a href="/events" className="back-link">← Back to Events</a>
      </div>
    );
  }

  const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(new Date(event.date));
  const isPast = new Date(event.date) < new Date();
  const spotsLeft = event.capacity ? event.capacity - event.registeredCount : null;

  return (
    <div className="event-detail">
      {event.bannerImageUrl && (
        <div className="event-detail__banner">
          <img src={event.bannerImageUrl} alt={event.name} loading="eager" decoding="async" />
        </div>
      )}

      <div className="event-detail__body">
        <div className="event-detail__info">
          <a href="/events" className="back-link">← All Events</a>
          {event.featured && <span className="badge-featured">Featured</span>}
          <h1 className="font-serif text-3xl text-light mt-4 leading-snug">{event.name}</h1>

          <div className="event-meta">
            <p>📅 {date} · {event.startTime} – {event.endTime}</p>
            <p>📍 {event.venue}</p>
            {!isPast && <p>{event.isFree ? "🎟 Free Entry" : `🎟 ₹${event.amount} per person`}</p>}
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
        </div>

        <div>
          <RegistrationForm event={event} />
        </div>
      </div>
    </div>
  );
}
