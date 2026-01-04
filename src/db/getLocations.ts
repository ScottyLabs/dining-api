import { ITimeRangeInternal, QueryUtils } from "./dbQueryUtils";
import { DateTime } from "luxon";
import { pad, remapAndMergeTimeIntervals } from "utils/timeUtils";
import { IParsedTimeRange } from "containers/time/parsedTime";
import { DBType } from "./db";

/**
 *
 * @param db
 * @param today this parameter is necessary so we can get today's specials and the open hours for the next 7 days, rather than returning everything we've stored in the db
 * @returns
 */
export async function getAllLocationsFromDB(db: DBType, today: DateTime<true>) {
  const timeSearchCutoff = today.minus({ days: 1 }); // 1 days worth of data before today

  const DB = new QueryUtils(db);
  const locationIdToData = await DB.getLocationIdToDataMap(
    timeSearchCutoff.toSQLDate()
  );
  const specials = await DB.getSpecials(today.toSQLDate());
  const generalOverrides = await DB.getGeneralOverrides();
  const timeOverrides = await DB.getTimeOverrides(timeSearchCutoff.toSQLDate());

  // apply overrides, merge all time intervals, and add specials
  const finalLocationData = Object.entries(locationIdToData).map(
    ([id, data]) => {
      return {
        ...data,
        ...generalOverrides[id], // this line only works because the override table has the same columns as the normal table
        times: remapAndMergeTimeIntervals(
          applyTimeOverrides(data.times, timeOverrides[id])
        ),
        // .map(
        //   (time) =>
        //     `${new Date(time.start).toLocaleString()}-${new Date(
        //       time.end
        //     ).toLocaleString()}`
        // ),
        todaysSoups: specials[id]?.soups ?? [],
        todaysSpecials: specials[id]?.specials ?? [],
      };
    }
  );
  return finalLocationData;
}

function applyTimeOverrides(
  originalTimes: ITimeRangeInternal[],
  overrideTimes?: { [date in string]: IParsedTimeRange[] }
) {
  if (overrideTimes === undefined) return originalTimes;
  for (const [overrideDate, timeRanges] of Object.entries(overrideTimes)) {
    originalTimes = originalTimes.filter((time) => time.date !== overrideDate);

    originalTimes.push(
      ...timeRanges.map((rng) => ({
        date: overrideDate,
        startMinutesSinceMidnight: rng.start.hour * 60 + rng.start.minute,
        endMinutesSinceMidnight: rng.end.hour * 60 + rng.end.minute,
      }))
    );
  }
  return originalTimes;
}
