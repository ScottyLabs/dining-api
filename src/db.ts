// db.ts
import { Pool } from "pg";
import "dotenv/config";
import { env } from "env";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./db/schema";

let pool: Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

function getPool(): Pool {
  if (pool === null) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl:
        env.DATABASE_URL.includes("localhost") ||
        env.DATABASE_URL.includes("127.0.0.1")
          ? undefined // Local Postgres doesn't accept SSL
          : { rejectUnauthorized: false }, // Require by Railway
    });
  }
  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (db === null) {
    db = drizzle(getPool(), { schema });
  }
  return db;
}

export async function getEmails(): Promise<{ name: string; email: string }[]> {
  const result = await getDb()
    .select({
      name: schema.emailsTable.name,
      email: schema.emailsTable.email,
    })
    .from(schema.emailsTable);

  // Remove 'mailto:' if present
  return result.map(({ name, email }) => ({
    name,
    email: email.replace(/^mailto:/, ""),
  }));
}
