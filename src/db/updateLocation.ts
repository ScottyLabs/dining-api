import { ILocation } from "types";
import { db } from "./db";
import {
  conceptIdToInternalIdTable,
  locationDataTable,
  specialsTable,
  timesTable,
} from "./schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { pad } from "utils/timeUtils";
async function getInternalId(externalId: string) {
  let [idMapping] = await db
    .select()
    .from(conceptIdToInternalIdTable)
    .where(eq(conceptIdToInternalIdTable.externalId, externalId));

  return idMapping?.internalId ?? crypto.randomUUID();
}

export async function addLocationDataToDb(location: ILocation) {
  const internalId = await getInternalId(location.conceptId.toString());

  const locationDbEntry: typeof locationDataTable.$inferInsert = {
    id: internalId,
    name: location.name,
    shortDescription: location.shortDescription,
    description: location.description,
    url: location.url,
    menu: location.menu,
    location: location.location,
    coordinateLat: location.coordinates?.lat,
    coordinateLng: location.coordinates?.lng,
    acceptsOnlineOrders: location.acceptsOnlineOrders,
  };

  await db
    .insert(locationDataTable)
    .values(locationDbEntry)
    .onConflictDoUpdate({ target: locationDataTable.id, set: locationDbEntry });

  if (location.earliestDayToOverride !== undefined) {
    const earliestDaySQLString = `${location.earliestDayToOverride.year}-${pad(
      location.earliestDayToOverride.month
    )}-${pad(location.earliestDayToOverride.day)})`;
    // add specials
    await db
      .delete(locationDataTable)
      .where(
        and(
          eq(specialsTable.locationId, internalId),
          eq(specialsTable.date, earliestDaySQLString)
        )
      );
    const specials = [
      ...(location.todaysSpecials?.map((sp) => ({
        ...sp,
        type: "special" as const,
      })) ?? []),
      ...(location.todaysSoups?.map((sp) => ({
        ...sp,
        type: "soup" as const,
      })) ?? []),
    ];
    if (specials.length)
      await db.insert(specialsTable).values(
        specials.map((special) => ({
          date: earliestDaySQLString,
          locationId: internalId,
          name: special.title,
          description: special.description,
          type: special.type,
        }))
      );

    // remove rows from whenever the scrape started from (aka remove entries corresponding to the last 7 days)
    await db
      .delete(timesTable)
      .where(
        and(
          eq(timesTable.locationId, internalId),
          and(gte(timesTable.date, earliestDaySQLString))
        )
      );
  }
  if (location.times.length) {
    await db.insert(timesTable).values(
      location.times.map((time) => ({
        locationId: internalId,
        date: `${time.year}-${pad(time.month)}-${pad(time.day)}`,
        startTime: time.startMinutesFromMidnight,
        endTime: time.endMinutesFromMidnight,
      }))
    );
  }

  // in case the conceptId->internalId mapping entry isn't there
  await db
    .insert(conceptIdToInternalIdTable)
    .values({
      internalId: internalId,
      externalId: location.conceptId.toString(),
    })
    .onConflictDoNothing({ target: conceptIdToInternalIdTable.externalId });
}
