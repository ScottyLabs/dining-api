import { overwritesTable, timeOverwritesTable } from "./schema";
import { IFullTimeRange, ILocation } from "types";
import { db } from "./db";
import { notifySlack } from "utils/slack";
import { gte } from "drizzle-orm";
import {
  augmentAndEditTimeRangesWithDateInfo,
  parseTimeSlots,
} from "containers/timeBuilder";
import { DateTime } from "luxon";
import { IParsedTimeRange } from "containers/time/parsedTime";

/**
 *
 * @returns object that maps ids to overrides, where each value in the override map is guaranteed to be non-null. (important!!)
 */
export async function getGeneralOverrides() {
  const overrides = await db
    .select()
    .from(overwritesTable)
    .catch((e) => {
      notifySlack(`<!channel> Failed to fetch overwrites with error ${e}`);
      return [];
    });

  const idToOverrideMap = overrides.reduce<{
    [conceptId in string]?: Partial<ILocation>;
  }>((accumulator, curLocation) => {
    const reformattedObjWithNonNullFields: Partial<ILocation> = {
      ...(curLocation.acceptsOnlineOrders !== null && {
        acceptsOnlineOrders: curLocation.acceptsOnlineOrders,
      }),
      ...(curLocation.description !== null && {
        description: curLocation.description,
      }),
      ...(curLocation.location !== null && { location: curLocation.location }),
      ...(curLocation.menu !== null && { menu: curLocation.menu }),
      ...(curLocation.name !== null && { name: curLocation.name }),
      ...(curLocation.shortDescription !== null && {
        shortDescription: curLocation.shortDescription,
      }),
      ...(curLocation.url !== null && { url: curLocation.url }),
      ...(curLocation.coordinateLat !== null &&
        curLocation.coordinateLng !== null && {
          coordinates: {
            lat: curLocation.coordinateLat,
            lng: curLocation.coordinateLng,
          },
        }),
    };
    return {
      ...accumulator,
      [curLocation.locationId]: reformattedObjWithNonNullFields,
    };
  }, {});
  return idToOverrideMap;
}
/**
 *
 * @param earliestDate should be in SQL form YYYY-MM-DD
 */
export async function getTimeOverrides(earliestDate: string) {
  const timeOverrides = await db
    .select()
    .from(timeOverwritesTable)
    .where(gte(timeOverwritesTable.date, earliestDate))
    .catch((e) => {
      notifySlack(`<!channel> Failed to fetch time overwrites with error ${e}`);
      return [];
    });
  const idToTimeOverrides = timeOverrides.reduce<{
    [locationId in string]: { [date in string]: IParsedTimeRange[] };
  }>((acc, override) => {
    return {
      ...acc,
      [override.locationId]: {
        ...acc[override.locationId],
        [override.date]: parseTimeSlots(override.timeString),
      },
    };
  }, {});
  return idToTimeOverrides;
}
