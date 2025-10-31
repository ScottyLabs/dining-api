import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const emailsTable = pgTable("emails", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
});
