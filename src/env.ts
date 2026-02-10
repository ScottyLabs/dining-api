import { z } from "zod/v4";

const envSchema = z.object({
  PORT: z.coerce.number().default(5010),
  NUMBER_OF_SCRAPES: z.coerce.number().default(10),
  INTER_SCRAPE_WAIT_INTERVAL: z.coerce.number().default(5000),
  RELOAD_WAIT_INTERVAL: z.coerce.number().default(1000 * 60 * 30), // 30 min
  SLACK_BACKEND_WEBHOOK_URL: z.string(),
  SLACK_FRONTEND_WEBHOOK_URL: z.string(),
  SLACK_MAIN_CHANNEL_WEBHOOK_URL: z.string(),
  AXIOS_RETRY_INTERVAL_MS: z.coerce.number().default(1000),
  /** Special flag when running automated tests */
  IN_TEST_MODE: z.stringbool().default(false),
  SLACK_MESSAGE_PREFIX: z.string().default("local-dev"),
  DATABASE_URL: z.string(),
  OIDC_SERVER: z.string().transform((x) => new URL(x)),
  OIDC_CLIENT_ID: z.string(),
  OIDC_CLIENT_SECRET: z.string(),
  DEV_DONT_FETCH: z
    .string()
    .transform((x) => x === "true")
    .default(false),
  ENV: z.enum(["dev", "staging", "prod"]),
  SESSION_COOKIE_SIGNING_SECRET: z.string(),
  HARDCODE_SESSION_FOR_DEV_TESTING: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REFRESH_TOKEN: z.string(),
  ALERT_EMAIL_SEND: z.string(),
  ALERT_EMAIL_CC: z.string(),
  // see https://stackoverflow.com/questions/51933601/what-is-the-definitive-way-to-use-gmail-with-oauth-and-nodemailer for how to obtain refresh token
});
console.log(envSchema.parse(process.env));
export const env = envSchema.parse(process.env);
