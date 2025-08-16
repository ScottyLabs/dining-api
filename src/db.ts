// db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config';
import { env } from 'env';
import { emails, dashboardChanges } from './schema';
import { ILocation } from 'types';

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

function getDb() {
  return drizzle(getPool(), { schema: { emails, dashboardChanges } });
}

export async function getEmails(): Promise<{ name: string; email: string }[]> {
  const db = getDb();
  const result = await db.select({
    name: emails.name,
    email: emails.email,
  }).from(emails);
  
  // Remove 'mailto:' if present
  return result.map((row) => ({
    name: row.name,
    email: row.email.replace(/^mailto:/, ""),
  }));
}

 
export async function getChanges(): Promise<ILocation[]> {
    const db = getDb();
    const result = await db.select({
      conceptid: dashboardChanges.conceptid,
      name: dashboardChanges.name,
      description: dashboardChanges.description,
      shortdescription: dashboardChanges.shortdescription,
      times: dashboardChanges.times,
      menu: dashboardChanges.menu,
      accepts_online_orders: dashboardChanges.accepts_online_orders,
    }).from(dashboardChanges);
    
    return result.map((row) => ({
      conceptId: row.conceptid,
      name: row.name,
      shortDescription: row.shortdescription || undefined,
      description: row.description,
      url: `https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/${row.conceptid}`,
      menu: row.menu || undefined,
      location: "Unknown", 
      coordinates: undefined,
      acceptsOnlineOrders: row.accepts_online_orders,
      times: row.times,
      todaysSpecials: undefined,
      todaysSoups: undefined,
    }));
  }
 