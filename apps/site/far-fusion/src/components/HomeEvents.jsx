import { useState, useEffect } from "react";
import { getEvents } from "../lib/api.js";
import EventCard from "./EventCard.jsx";

export default function HomeEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getEvents({ upcoming: true, limit: 8 }).then(({ ok, data }) => {
      if (cancelled) return;
      if (!ok) { setError(data?.error || "Failed to load events."); setLoading(false); return; }
      setEvents(data.data.events);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { setError("Could not load events."); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="event-card-skeleton animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || events.length === 0) {
    return (
      <p className="mt-12 text-center text-light/40 py-16">
        {error || "No events right now. Check back soon."}
      </p>
    );
  }

  return (
    <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {events.map((ev) => (
        <EventCard key={ev.id} event={ev} />
      ))}
    </div>
  );
}
