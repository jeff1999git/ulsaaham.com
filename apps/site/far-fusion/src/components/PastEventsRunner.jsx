import { useState, useEffect } from "react";
import { getEvents } from "../lib/api.js";

export default function PastEventsRunner() {
  const [posters, setPosters] = useState([]);

  useEffect(() => {
    getEvents({ past: true, limit: 30 }).then(({ ok, data }) => {
      if (!ok) return;
      const withBanner = (data?.data?.events ?? []).filter((e) => e.bannerImageUrl);
      setPosters(withBanner);
    }).catch(() => {});
  }, []);

  if (posters.length === 0) return null;

  // Duplicate for seamless loop
  const items = [...posters, ...posters];

  return (
    <div className="past-runner-wrap">
      <p className="past-runner-heading">
        <span className="past-runner-heading__line" />
        <span>Past Events</span>
        <span className="past-runner-heading__line" />
      </p>
    <div className="past-runner">
      <div className="past-runner__track">
        {items.map((ev, i) => (
          <div
            key={`${ev.id}-${i}`}
            className="past-runner__item"
            aria-hidden={i >= posters.length ? "true" : "false"}
          >
            <img src={ev.bannerImageUrl} alt={ev.name} loading="lazy" decoding="async" />
            <div className="past-runner__label">{ev.name}</div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
