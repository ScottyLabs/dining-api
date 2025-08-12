// db.ts
import { Pool } from "pg";
import "dotenv/config";
import { env } from "env";
import { ITimeRange } from "types";

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool === null) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required by Railway
    });
  }
  return pool;
}

export async function getEmails(): Promise<{ name: string; email: string }[]> {
  const dbPool = getPool();
  const result = await dbPool.query("SELECT name, email FROM emails");
  // Remove 'mailto:' if present
  return result.rows.map((row: { name: string; email: string }) => ({
    name: row.name,
    email: row.email.replace(/^mailto:/, ""),
  }));
}

export async function getChanges(): Promise<
  {
    conceptid: number;
    name: string;
    description: string;
    shortdescription: string;
    times: ITimeRange[];
    menu: string;
    accepts_online_orders: boolean;
  }[]
> {
  const dbPool = getPool();
  const result = await dbPool.query(
    "select conceptid, name, description, shortdescription,times,menu,accepts_online_orders from dashboard_changes"
  );
  // Remove 'mailto:' if present
  return result.rows.map(
    (row: {
      conceptid: number;
      name: string;
      description: string;
      shortdescription: string;
      times: ITimeRange[];
      menu: string;
      accepts_online_orders: boolean;
    }) => ({
      conceptid: row.conceptid,
      name: row.name,
      description: row.description,
      shortdescription: row.shortdescription,
      times: row.times,
      menu: row.menu,
      accepts_online_orders: row.accepts_online_orders,
    })
  );
}
