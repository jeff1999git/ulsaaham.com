import { randomBytes } from "node:crypto";

const SENTINEL = "ULSAHAM_TEST_ENV";

// Cleared before every run so a value the shell or a stray --env-file supplied
// can never reach the code under test.
const MANAGED = [
  "SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS",
  "EMAIL_FROM", "OTP_EMAIL_FROM", "TICKET_EMAIL_FROM",
  "OTP_SECRET", "SITE_URL", "BACKEND_URL", "PROXY_SHARED_SECRET",
  "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NODE_ENV",
];

/**
 * A dummy credential for one run. It can never equal a real key, and it is
 * distinctive enough to search for in a response body or a sent message.
 */
export const makeSecret = (label) => `${label}-${randomBytes(12).toString("hex")}`;

export function setTestEnv(overrides = {}) {
  for (const name of MANAGED) delete process.env[name];

  const env = {
    SMTP_HOST: "smtp-relay.brevo.com",
    SMTP_PORT: "587",
    SMTP_SECURE: "false",
    SMTP_USER: "test-login@smtp-brevo.com",
    SMTP_PASS: makeSecret("smtp-key"),
    OTP_EMAIL_FROM: "Ulsaham Entertainments <noreply@ulsaaham.com>",
    TICKET_EMAIL_FROM: "Tickets Ulsaham <tickets@ulsaaham.com>",
    OTP_SECRET: makeSecret("otp-secret"),
    SITE_URL: "https://www.ulsaaham.com",
    PROXY_SHARED_SECRET: makeSecret("proxy-secret"),
    ...overrides,
  };

  for (const [name, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = String(value);
  }
  process.env[SENTINEL] = "1";
  return env;
}

export const hasTestEnv = () => process.env[SENTINEL] === "1";
