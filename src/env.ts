import { z } from "zod/v4";
import "dotenv/config";

const envSchema = z.object({
  PORT: z.coerce.number().default(5010),
  NUMBER_OF_SCRAPES: z.coerce.number().default(1),
  INTER_SCRAPE_WAIT_INTERVAL: z.coerce.number().default(5000),
  RELOAD_WAIT_INTERVAL: z.coerce.number().default(1000 * 60 * 30), // 30 min
  SLACK_WEBHOOK_URL: z.string(),
  AXIOS_RETRY_INTERVAL_MS: z.coerce.number().default(1000),
  /** Special flag when running automated tests */
  IN_TEST_MODE: z.stringbool().default(false),
  SLACK_MESSAGE_PREFIX: z.string().default("local-dev"),
});

export const env = envSchema.parse(process.env);
