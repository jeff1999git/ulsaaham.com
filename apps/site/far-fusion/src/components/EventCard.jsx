export default function EventCard({ event, linkable = true }) {
  const date = new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(event.date));

  const isUpcoming = new Date(event.date) >= new Date();

  const Tag = linkable ? "a" : "div";
  const tagProps = linkable
    ? { href: `/events/detail?slug=${event.slug}` }
    : { style: { cursor: "default" } };

  return (
    <Tag {...tagProps} className={`event-card${linkable ? " group" : " event-card--static"}`}>
      <div className="event-card__image">
        {event.bannerImageUrl ? (
          <img src={event.bannerImageUrl} alt={event.name} loading="lazy" decoding="async" />
        ) : (
          <div className="event-card__placeholder" />
        )}
        {isUpcoming && (
          event.isFree ? (
            <span className="event-card__price free">FREE</span>
          ) : event.isEarlyBird && event.earlyBirdAmount != null ? (
            <span className="event-card__price paid" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px", lineHeight: 1.2 }}>
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fecc01", opacity: 0.9 }}>Early Bird</span>
              <span style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ textDecoration: "line-through", opacity: 0.5, fontSize: "0.75em" }}>₹{event.amount}</span>
                <span>₹{event.earlyBirdAmount}</span>
              </span>
            </span>
          ) : (
            <span className="event-card__price paid">₹{event.amount}</span>
          )
        )}
        {event.isFull && <span className="event-card__full">FULL</span>}
        {event.featured && <span className="event-card__featured">Featured</span>}
      </div>
      <div className="event-card__body">
        <h3 className="event-card__title">{event.name}</h3>
        <p className="event-card__meta">📅 {date} · {event.startTime}</p>
        <p className="event-card__meta">
          📍 {!linkable && event.venueLink
            ? <a href={event.venueLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px" }}>{event.venue}</a>
            : event.venue}
        </p>
        {linkable && (
          <span className="event-card__cta">{isUpcoming ? "Register Now →" : "View Details →"}</span>
        )}
      </div>
    </Tag>
  );
}
