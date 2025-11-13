import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

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
