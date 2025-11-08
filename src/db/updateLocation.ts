import { ILocation } from "types";
import { db } from "./db";
import {
  conceptIdToInternalIdTable,
  locationDataTable,
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

  // remove rows from whenever the scrape started from (aka remove entries corresponding to the last 7 days)
  await db
    .delete(timesTable)
    .where(
      and(
        eq(timesTable.locationId, internalId),
        and(
          gte(
            timesTable.date,
            `${location.earliestDayFound.year}-${pad(
              location.earliestDayFound.month
            )}-${pad(location.earliestDayFound.day)})`
          )
        )
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

  // in case this entry isn't there
  await db
    .insert(conceptIdToInternalIdTable)
    .values({
      internalId: internalId,
      externalId: location.conceptId.toString(),
    })
    .onConflictDoNothing({ target: conceptIdToInternalIdTable.externalId });
}
