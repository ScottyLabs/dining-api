import { IDateTimeRange, QueryUtils } from "./dbQueryUtils";
import { DateTime } from "luxon";
import { remapAndMergeTimeIntervals } from "utils/timeUtils";
import { ITimeSlot } from "containers/time/parsedTime";
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
    timeSearchCutoff.toSQLDate(),
  );
  const specials = await DB.getSpecials(today.toSQLDate());
  const generalOverrides = await DB.getGeneralOverrides();
  const { idToPointOverrides, idToWeeklyOverrides } = await DB.getTimeOverrides(
    timeSearchCutoff.toSQLDate(),
  );
  const ratingsAvgs = await DB.getRatingsAvgs();
  const ratingsCounts = await DB.getRatingsCounts();

  // apply overrides, merge all time intervals, and add specials
  const finalLocationData = Object.entries(locationIdToData).map(
    ([id, data]) => {
      return {
        ...data,
        ...generalOverrides[id], // this line only works because the override table has the same columns as the normal table
        times: remapAndMergeTimeIntervals(
          applyTimeOverrides(
            data.times,
            timeSearchCutoff,
            idToPointOverrides[id],
            idToWeeklyOverrides[id],
          ),
        ),
        // .map(
        //   (time) =>
        //     `${new Date(time.start).toLocaleString()}-${new Date(
        //       time.end
        //     ).toLocaleString()}`
        // ),
        ratingsAvg: ratingsAvgs[id] ?? null,
        ratingsCount: ratingsCounts[id] ?? 0,
        todaysSoups: specials[id]?.soups ?? [],
        todaysSpecials: specials[id]?.specials ?? [],
      };
    },
  );
  return finalLocationData;
}

function applyTimeOverrides(
  originalTimes: IDateTimeRange[],
  startDate: DateTime<true>,
  overridePointTimes?: { [date in string]: ITimeSlot[] },
  overrideWeeklyTimes?: { [weekday in number]: ITimeSlot[] },
) {
  if (overridePointTimes === undefined && overrideWeeklyTimes === undefined)
    return originalTimes;
  if (overrideWeeklyTimes !== undefined) {
    for (let i = 0; i < 8; i++) {
      // 7 + 1 day prior
      const curDate = startDate.plus({ days: i });
      const overrideIntervals = overrideWeeklyTimes[curDate.weekday % 7];
      if (overrideIntervals === undefined) continue;
      originalTimes = originalTimes.filter(
        (time) => time.date !== curDate.toSQLDate(),
      );
      originalTimes.push(
        ...overrideIntervals.map((rng) => ({
          date: curDate.toSQLDate(),
          startMinutesSinceMidnight: rng.start.hour * 60 + rng.start.minute,
          endMinutesSinceMidnight: rng.end.hour * 60 + rng.end.minute,
        })),
      );
    }
  }
  //takes precedence over weekly overrides
  if (overridePointTimes !== undefined) {
    for (const [overrideDate, timeRanges] of Object.entries(
      overridePointTimes,
    )) {
      originalTimes = originalTimes.filter(
        (time) => time.date !== overrideDate,
      );

      originalTimes.push(
        ...timeRanges.map((rng) => ({
          date: overrideDate,
          startMinutesSinceMidnight: rng.start.hour * 60 + rng.start.minute,
          endMinutesSinceMidnight: rng.end.hour * 60 + rng.end.minute,
        })),
      );
    }
  }
  return originalTimes;
}
