import {
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  decimal,
  date,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { IFullTimeRange } from "../types";

export const emailTable = pgTable("emails", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});
export const conceptIdToInternalIdTable = pgTable("concept_id_to_internal_id", {
  // keeping both as text for the most flexibility
  internalId: text("internal_id")
    .notNull()
    .references(() => locationDataTable.id, { onDelete: "cascade" }),
  externalId: text("external_id").notNull().unique().primaryKey(),
});
export const locationDataTable = pgTable("location_data", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  shortDescription: text("short_description"),
  description: text("description").notNull(),
  url: text("url").notNull(),
  menu: text("menu"),
  /** The human-readable version of the location */
  location: text("location").notNull(),
  coordinateLat: decimal("coordinate_lat", { mode: "number", scale: 30 }),
  coordinateLng: decimal("coordinate_lng", { mode: "number", scale: 30 }),
  acceptsOnlineOrders: boolean().notNull(),
});
export const timesTable = pgTable(
  "location_times",
  {
    id: integer().notNull().generatedAlwaysAsIdentity().primaryKey(),
    locationId: text("location_id")
      .references(() => locationDataTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    date: date("date").notNull(),
    startTime: integer("start_time").notNull(),
    endTime: integer("end_time").notNull(),
  },
  (table) => [index("date_lookup").on(table.locationId, table.date)]
);
/**
 * Includes everything in ILocation except for soups and specials
 */
export const overwritesTable = pgTable("overwrites_table", {
  locationId: text("location_id")
    .notNull()
    .primaryKey()
    .references(() => locationDataTable.id, {
      onDelete: "cascade",
    }),
  name: text("name"),
  description: text("description"),
  shortDescription: text("short_description"),
  url: text("url"),
  menu: text("menu"),
  location: text("location"),
  coordinateLat: decimal({ mode: "number", scale: 30 }),
  coordinateLng: decimal({ mode: "number", scale: 30 }),
  acceptsOnlineOrders: boolean("accepts_online_orders"),
});
export const timeOverwritesTable = pgTable(
  "time_overwrites_table",
  {
    locationId: text("location_id")
      .notNull()
      .references(() => locationDataTable.id, {
        onDelete: "cascade",
      }),
    date: date("date").notNull(),
    timeString: text("time_string").notNull(),
  },
  (table) => [primaryKey({ columns: [table.locationId, table.date] })]
);
