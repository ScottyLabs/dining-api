import { db } from "./db";
import { emailTable } from "./schema";

export async function getEmails(): Promise<{ name: string; email: string }[]> {
  const result = await db
    .select({
      name: emailTable.name,
      email: emailTable.email,
    })
    .from(emailTable);

  // Remove 'mailto:' if present
  return result.map((row) => ({
    name: row.name,
    email: row.email.replace(/^mailto:/, ""),
  }));
}
