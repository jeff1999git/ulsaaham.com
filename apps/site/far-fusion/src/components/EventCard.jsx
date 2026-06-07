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
          <span className={`event-card__price ${event.isFree ? "free" : "paid"}`}>
            {event.isFree ? "FREE" : `₹${event.amount}`}
          </span>
        )}
        {event.isFull && <span className="event-card__full">FULL</span>}
        {event.featured && <span className="event-card__featured">Featured</span>}
      </div>
      <div className="event-card__body">
        <h3 className="event-card__title">{event.name}</h3>
        <p className="event-card__meta">📅 {date} · {event.startTime}</p>
        <p className="event-card__meta">📍 {event.venue}</p>
        {linkable && <span className="event-card__cta">{isUpcoming ? "Register Now →" : "View Details →"}</span>}
      </div>
    </Tag>
  );
}
