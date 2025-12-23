// don't add .unique() or .notNull() to a primary key, drizzle doesn't like it when you remove it later on.

import {
  pgTable,
  text,
  integer,
  boolean,
  decimal,
  date,
  primaryKey,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

export const emailTable = pgTable("emails", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});
export const externalIdType = pgEnum("externalIdType", ["concept_id"]);

export const externalIdToInternalIdTable = pgTable(
  "external_id_to_internal_id",
  {
    // keeping both as text for the most flexibility
    internalId: text("internal_id")
      .notNull()
      .references(() => locationDataTable.id, { onDelete: "cascade" }),
    externalId: text("external_id").unique().primaryKey(),
    type: externalIdType("external_id_type").default("concept_id"),
  },
  (table) => [index("internal_id").on(table.internalId)]
);
export const locationDataTable = pgTable("location_data", {
  id: text("id").primaryKey(),
  name: text("name"),
  shortDescription: text("short_description"),
  description: text("description").notNull(),
  url: text("url").notNull(),
  menu: text("menu"),
  /** The human-readable version of the location */
  location: text("location").notNull(),
  coordinateLat: decimal("coordinate_lat", { mode: "number", scale: 30 }),
  coordinateLng: decimal("coordinate_lng", { mode: "number", scale: 30 }),
  acceptsOnlineOrders: boolean("accepts_online_orders").notNull(),
});
export const timesTable = pgTable(
  "location_times",
  {
    id: integer("id").notNull().generatedAlwaysAsIdentity().primaryKey(),
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
  coordinateLat: decimal("coordinate_lat", { mode: "number", scale: 30 }),
  coordinateLng: decimal("coordinate_lng", { mode: "number", scale: 30 }),
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
export const specialType = pgEnum("specialType", ["special", "soup"]);

export const specialsTable = pgTable("specials", {
  id: integer("id").notNull().generatedAlwaysAsIdentity().primaryKey(),
  locationId: text("location_id")
    .references(() => locationDataTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  date: date("date").notNull(),
  type: specialType("type").notNull(),
});
