import { ITimeRangeInternal, QueryUtils } from "./dbQueryUtils";
import { DateTime } from "luxon";
import { remapAndMergeTimeIntervals } from "utils/timeUtils";
import { IParsedTimeRange } from "containers/time/parsedTime";
import { DBType } from "./db";
import { locationDataTable } from "./schema";

// Constants for data retrieval window
const DAYS_BEFORE_TODAY_TO_FETCH = 1;

/**
 * Defines the structure of a location with all its associated data
 */
interface LocationData
  extends Omit<typeof locationDataTable.$inferSelect, "coordinateLat" | "coordinateLng"> {
  coordinateLat: number | null;
  coordinateLng: number | null;
  times: { start: number; end: number }[];
  todaysSoups: { name: string; description: string }[];
  todaysSpecials: { name: string; description: string }[];
}

/**
 * Retrieves all location data from the database, including their times, specials, and overrides.
 * 
 * This function:
 * 1. Fetches location data and times starting from 1 day before today
 * 2. Retrieves today's specials (soups and specials)
 * 3. Applies general overrides (name, description, coordinates, etc.)
 * 4. Applies time-specific overrides for custom schedules
 * 5. Merges overlapping time intervals
 * 
 * @param db - The database connection instance
 * @param today - The current date used to determine which specials to fetch and the time window for location hours
 * @returns An array of location objects with all associated data
 */
export async function getAllLocationsFromDB(
  db: DBType,
  today: DateTime<true>
): Promise<LocationData[]> {
  const timeSearchCutoff = today.minus({ days: DAYS_BEFORE_TODAY_TO_FETCH });

  const queryUtils = new QueryUtils(db);
  const locationIdToData = await queryUtils.getLocationIdToDataMap(
    timeSearchCutoff.toSQLDate()
  );
  const specials = await queryUtils.getSpecials(today.toSQLDate());
  const generalOverrides = await queryUtils.getGeneralOverrides();
  const timeOverrides = await queryUtils.getTimeOverrides(timeSearchCutoff.toSQLDate());

  // Apply overrides, merge all time intervals, and add specials
  const finalLocationData = Object.entries(locationIdToData).map(
    ([locationId, data]) => {
      const locationGeneralOverrides = generalOverrides[locationId];
      const locationTimeOverrides = timeOverrides[locationId];
      const locationSpecials = specials[locationId];

      const timesWithOverrides = applyTimeOverrides(
        data.times,
        locationTimeOverrides
      );
      const mergedTimes = remapAndMergeTimeIntervals(timesWithOverrides);

      return {
        ...data,
        ...locationGeneralOverrides,
        times: mergedTimes,
        todaysSoups: locationSpecials?.soups ?? [],
        todaysSpecials: locationSpecials?.specials ?? [],
      };
    }
  );

  return finalLocationData;
}

// Constants for time calculations
const MINUTES_PER_HOUR = 60;

/**
 * Applies time overrides to location opening hours.
 * 
 * This function replaces the original times for specific dates with custom override times.
 * When an override is applied for a date, the original time entry for that date is completely
 * replaced (not merged) with the override times.
 * 
 * @param originalTimes - The base time ranges from the database
 * @param overrideTimes - Optional map of dates to their override time ranges
 * @returns The modified time ranges with overrides applied
 */
function applyTimeOverrides(
  originalTimes: ITimeRangeInternal[],
  overrideTimes?: Record<string, IParsedTimeRange[]>
): ITimeRangeInternal[] {
  if (!overrideTimes) {
    return originalTimes;
  }

  // Create a mutable copy to avoid modifying the input
  let modifiedTimes = [...originalTimes];

  for (const [overrideDate, timeRanges] of Object.entries(overrideTimes)) {
    // Remove existing times for this date
    modifiedTimes = modifiedTimes.filter(
      (time) => time.date !== overrideDate
    );

    // Add override times for this date
    const overrideEntries = timeRanges.map((timeRange) => ({
      date: overrideDate,
      startMinutesSinceMidnight:
        timeRange.start.hour * MINUTES_PER_HOUR + timeRange.start.minute,
      endMinutesSinceMidnight:
        timeRange.end.hour * MINUTES_PER_HOUR + timeRange.end.minute,
    }));

    modifiedTimes.push(...overrideEntries);
  }

  return modifiedTimes;
}
