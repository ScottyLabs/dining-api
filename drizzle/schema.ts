import { pgTable, check, serial, varchar } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const emails = pgTable("emails", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
}, (table) => [
	check("emails_id_not_null", sql`NOT NULL id`),
	check("emails_name_not_null", sql`NOT NULL name`),
	check("emails_email_not_null", sql`NOT NULL email`),
]);
