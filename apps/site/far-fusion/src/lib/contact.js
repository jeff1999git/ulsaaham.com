// Where customers are told to write when something goes wrong with a booking or
// a payment. It is the same mailbox the home, about, terms and privacy pages
// list, so every message on the site points to one address that is read.
export const SUPPORT_EMAIL = "ulsaham1@gmail.com";

/** A mailto: link to support with the subject filled in, e.g. "Payment pay_ABC123". */
export const supportMailto = (subject) => `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
