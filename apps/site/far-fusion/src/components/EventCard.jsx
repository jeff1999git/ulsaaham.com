import { optimizeCloudinary } from "../lib/image.js";

export default function EventCard({ event, linkable = true, index = 0, layout = "vertical" }) {
  const date = new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(event.date));

  const isUpcoming = new Date(event.date) >= new Date();

  const Tag = linkable ? "a" : "div";
  const tagProps = linkable
    ? { href: `/events/detail?slug=${event.slug}` }
    : { style: { cursor: "default" } };

  return (
    <Tag {...tagProps} className={`event-card${layout === "horizontal" ? " event-card--horizontal" : ""}${linkable ? " group" : " event-card--static"}`}>
      <div className="event-card__image">
        {event.bannerImageUrl ? (
          <img
            src={optimizeCloudinary(event.bannerImageUrl, 600)}
            alt={event.name}
            loading={index < 2 ? "eager" : "lazy"}
            fetchPriority={index < 2 ? "high" : "auto"}
            decoding="async"
            width="480"
            height="600"
          />
        ) : (
          <div className="event-card__placeholder" />
        )}
        {event.isFull && <span className="event-card__full">FULL</span>}
      </div>
      <div className="event-card__body">
        {event.featured && <span className="event-card__featured">Featured</span>}
        <h3 className="event-card__title">{event.name}</h3>
        {isUpcoming && (
          event.isFree ? (
            <p className="event-card__meta" style={{ color: "#9bca3b", fontWeight: 700 }}>🎟 Free Entry</p>
          ) : event.isEarlyBird && event.earlyBirdAmount != null ? (
            <p className="event-card__meta" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "5px" }}>
              🎟
              <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.5)", textDecorationColor: "rgba(255,255,255,0.6)" }}>₹{event.amount}</span>
              <span style={{ color: "#9bca3b", fontWeight: 700 }}>₹{event.earlyBirdAmount}</span>
              <span style={{ background: "rgba(155,202,59,0.15)", color: "#9bca3b", border: "1px solid rgba(155,202,59,0.35)", borderRadius: 3, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", padding: "1px 5px", textTransform: "uppercase" }}>Early Bird</span>
            </p>
          ) : event.isCompetition ? (
            <p className="event-card__meta">🏆 ₹{event.amount} {event.participationType === "INDIVIDUAL" ? "entry" : event.participationType === "GROUP" ? "first member" : "individual entry"}</p>
          ) : (
            <p className="event-card__meta">🎟 ₹{event.amount} per person</p>
          )
        )}
        <p className="event-card__meta">📅 {date} · {event.startTime}</p>
        <p className="event-card__meta">
          📍 {!linkable && event.venueLink
            ? <a href={event.venueLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px" }}>{event.venue}</a>
            : event.venue}
        </p>
        {linkable && (
          <span className="event-card__cta">{isUpcoming ? "Book Now →" : "View Details →"}</span>
        )}
      </div>
    </Tag>
  );
}
