// db.ts
import { Pool } from 'pg';
import 'dotenv/config';

let pool: Pool | null = null;

function getPool(): Pool {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL is not set in environment variables!');
        }
        pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false }, // Required by Railway
        });
    }
    return pool;
}

export async function getEmails(): Promise<{ name: string; email: string }[]> {
    const dbPool = getPool();
    const result = await dbPool.query('SELECT name, email FROM emails');
    // Remove 'mailto:' if present
    return result.rows.map((row: { name: string; email: string }) => ({
        name: row.name,
        email: row.email.replace(/^mailto:/, ''),
    }));
} 