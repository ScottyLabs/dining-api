// don't add .unique() or .notNull() to a primary key, drizzle doesn't like it when you remove it later on.

import { sql } from "drizzle-orm";
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
  timestamp,
  uniqueIndex,
  check,
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
  (table) => [index("internal_id").on(table.internalId)],
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
  (table) => [index("date_lookup").on(table.locationId, table.date)],
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
  (table) => [primaryKey({ columns: [table.locationId, table.date] })],
);
export const weeklyTimeOverwritesTable = pgTable(
  "weekly_time_overwrites_table",
  {
    locationId: text("location_id")
      .notNull()
      .references(() => locationDataTable.id, {
        onDelete: "cascade",
      }),
    /** sunday is 0, monday is 1, ... */
    weekday: integer("weekday").notNull(),
    timeString: text("time_string").notNull(),
  },
  (t) => [
    uniqueIndex("location_weekday").on(t.locationId, t.weekday),
    check("weekday_check", sql`${t.weekday} >= 0 AND ${t.weekday} < 7`), // sunday is 0, monday is 1, etc.
  ],
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

export const userTable = pgTable(
  "users",
  {
    id: integer("id").notNull().generatedByDefaultAsIdentity().primaryKey(),
    googleId: text("google_id").notNull(),
    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    pictureUrl: text("picture_url"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    }).defaultNow(),
  },
  (table) => [index("google_id").on(table.googleId)],
);
export const userSessionTable = pgTable("sessions", {
  sessionId: text("id").notNull().primaryKey(),
  userId: integer("user_id")
    .references(() => userTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  }).defaultNow(),
});
export const tagListTable = pgTable("tag_list", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull(),
});
export const tagReviewTable = pgTable(
  "tag_reviews",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tagListTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    locationId: text("location_id")
      .notNull()
      .references(() => locationDataTable.id, { onDelete: "cascade" }),
    vote: boolean("vote").notNull(),
    writtenReview: text("written_review"), // nullable by default
    hidden: boolean("hidden").default(false), // moderation purposes
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("tag_reviews_location_tag_user_uniq").on(
      t.locationId,
      t.tagId,
      t.userId,
    ),
  ],
);
export const starReviewTable = pgTable(
  "star_reviews",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    locationId: text("location_id")
      .notNull()
      .references(() => locationDataTable.id, { onDelete: "cascade" }),
    starRating: decimal("star_rating", {
      precision: 2,
      scale: 1,
      mode: "number",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("star_reviews_location_user_uniq").on(t.locationId, t.userId),
    check(
      "rating_number_check",
      sql`${t.starRating} > 0 AND ${t.starRating} <= 5 AND mod(${t.starRating}*2,1) = 0`,
    ), // rating is a multiple of .5
  ],
);
