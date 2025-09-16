import {
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  decimal,
} from "drizzle-orm/pg-core";
import { ITimeRange } from "../types";

export const emailTable = pgTable("emails", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});

/**
 * Includes everything in ILocation except for soups and specials
 */
export const overwritesTable = pgTable("overwrites_table", {
  conceptId: integer("concept_id").notNull().primaryKey(),
  name: text("name"),
  description: text("description"),
  shortDescription: text("short_description"),
  url: text("url"),
  menu: text("menu"),
  location: text("location"),
  coordinateLat: decimal({ mode: "number", scale: 30 }),
  coordinateLng: decimal({ mode: "number", scale: 30 }),
  acceptsOnlineOrders: boolean("accepts_online_orders"),
  times: jsonb("times").$type<ITimeRange[]>(),
});
