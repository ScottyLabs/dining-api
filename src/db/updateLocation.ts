import { ILocation } from "types";
import { DBType } from "./db";
import {
  conceptIdToInternalIdTable,
  locationDataTable,
  specialsTable,
  timeOverwritesTable,
  timesTable,
} from "./schema";
import { and, eq, gte } from "drizzle-orm";
import { pad } from "utils/timeUtils";
import { DateTime } from "luxon";
async function getInternalId(db: DBType, externalId: string) {
  let [idMapping] = await db
    .select()
    .from(conceptIdToInternalIdTable)
    .where(eq(conceptIdToInternalIdTable.externalId, externalId));

  return idMapping?.internalId ?? crypto.randomUUID();
}

/**
 *
 * @param db
 * @param location
 * @returns the internal id of the location that was added
 */
export async function addLocationDataToDb(db: DBType, location: ILocation) {
  const internalId = await getInternalId(db, location.conceptId.toString());

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
    .onConflictDoUpdate({
      target: locationDataTable.id,
      set: locationDbEntry,
    });

  const todayAsSQLString = `${location.today.year}-${pad(
    location.today.month
  )}-${pad(location.today.day)})`;
  // add specials
  await db
    .delete(specialsTable)
    .where(
      and(
        eq(specialsTable.locationId, internalId),
        eq(specialsTable.date, todayAsSQLString)
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
        date: todayAsSQLString,
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
        and(gte(timesTable.date, todayAsSQLString))
      )
    );
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
  return internalId;
}
/**
 *
 * @param db
 * @param locationId
 * @param date
 * @param timeStringOverride
 * @returns if successful
 */
export async function addTimeOverride(
  db: DBType,
  locationId: string,
  date: string,
  timeStringOverride: string
) {
  const parsedDate = DateTime.fromFormat(date, "M/d/yy");
  if (!parsedDate.isValid) {
    return false;
  }
  const rowToInsert: typeof timeOverwritesTable.$inferInsert = {
    date: parsedDate.toSQLDate(),
    locationId: locationId,
    timeString: timeStringOverride,
  };
  await db
    .insert(timeOverwritesTable)
    .values(rowToInsert)
    .onConflictDoUpdate({
      target: [timeOverwritesTable.locationId, timeOverwritesTable.date],
      set: rowToInsert,
    });
  return true;
}
