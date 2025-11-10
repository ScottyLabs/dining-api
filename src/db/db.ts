import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export let db: NodePgDatabase<typeof schema> & {
  $client: Pool;
};
let pool: Pool;
export function initDB(connectionString: string) {
  pool = new Pool({
    connectionString: connectionString,
    ssl: false,
  });
  db = drizzle(pool, {
    schema,
  });
}
/** Only used for testing */
export function _disconnectPoolConnection() {
  if (db === undefined) return;
  pool.end();
}
