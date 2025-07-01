import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(5010),
  NUMBER_SCRAPES: z.coerce.number().default(1),
  INTER_SCRAPE_WAIT_INTERVAL: z.coerce.number().default(5000),
  RELOAD_WAIT_INTERVAL: z.coerce.number().default(1000 * 60 * 30), // 30 min
});

export const env = envSchema.parse(process.env);
