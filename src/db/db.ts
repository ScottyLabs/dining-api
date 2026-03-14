import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { env } from "env";

export type DBType = NodePgDatabase<typeof schema> & {
  $client: Pool;
};

export function initDBConnection(connectionString: string) {
  const pool = new Pool({
    connectionString: connectionString,
    ssl: false,
  });
  return [
    pool,
    drizzle(pool, {
      schema,
    }),
  ] as const;
}
export const [pool, db] = initDBConnection(env.DATABASE_URL);
