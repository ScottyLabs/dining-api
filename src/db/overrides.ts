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
