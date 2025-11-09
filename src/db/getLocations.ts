import { db } from "./db";
import {
  conceptIdToInternalIdTable,
  locationDataTable,
  overwritesTable,
  timesTable,
} from "./schema";
import { eq, gte } from "drizzle-orm";
import { getTimeOverrides } from "./overrides";
import { DateTime } from "luxon";
import { mergeTimeRanges, pad } from "utils/timeUtils";
type RequiredProperty<T> = { [P in keyof T]: NonNullable<T[P]> };
interface ITimeRangeInternal {
  date: string;
  startMinutesSinceMidnight: number;
  endMinutesSinceMidnight: number;
}
function mergeTimeIntervals(timeRanges: ITimeRangeInternal[]) {
  const timeStampedIntervals = timeRanges.map((rng) => {
    const date = DateTime.fromISO(rng.date, { zone: "America/New_York" });
    return {
      start: date.toMillis() + rng.startMinutesSinceMidnight * 1000 * 60,
      end:
        date.toMillis() +
        rng.endMinutesSinceMidnight * 1000 * 60 +
        (rng.endMinutesSinceMidnight < rng.startMinutesSinceMidnight
          ? 24 * 60 * 60 * 1000
          : 0), // this specific slot wraps around - so we'll add a day to the end
    };
  });
  return mergeTimeRanges(timeStampedIntervals, 60 * 1000); // merge gaps of at most 1 min
}
export async function getAllLocations() {
  const timeSearchCutoff = DateTime.now().minus({ days: 1 }); // 1 days worth of data before today
  const timeSearchCutoffStr = `${timeSearchCutoff.year}-${pad(
    timeSearchCutoff.month
  )}-${pad(timeSearchCutoff.day)}`;
  const locationData = await db
    .select()
    .from(locationDataTable)
    .leftJoin(
      conceptIdToInternalIdTable,
      eq(locationDataTable.id, conceptIdToInternalIdTable.internalId)
    )
    .leftJoin(timesTable, eq(locationDataTable.id, timesTable.locationId))
    .where(gte(timesTable.date, timeSearchCutoffStr));

  const locationIdToData = locationData.reduce<
    Record<
      string,
      | Omit<typeof locationDataTable.$inferSelect, "id"> & {
          id: number;
        } & {
          times: ITimeRangeInternal[];
        }
    >
  >((acc, { location_data, location_times, concept_id_to_internal_id }) => {
    if (!acc[location_data.id]) {
      acc[location_data.id] = {
        ...location_data,
        id: parseInt(concept_id_to_internal_id?.externalId ?? "-1"),
        times: [],
      };
    }
    if (location_times !== null) {
      acc[location_data.id]!.times.push({
        startMinutesSinceMidnight: location_times.startTime,
        endMinutesSinceMidnight: location_times.endTime,
        date: location_times.date,
      });
    }
    return acc;
  }, {});

  // get general location override data
  const overrides = (await db.select().from(overwritesTable)).reduce<
    Record<
      string,
      Omit<RequiredProperty<typeof overwritesTable.$inferSelect>, "locationId"> // exclude locationId field, since that's our internal id
    >
  >(
    (acc, overwrite) => ({
      ...acc,
      [overwrite.locationId]: Object.fromEntries(
        Object.entries(overwrite).filter(([key, v]) => {
          return key !== "locationId" && v !== null;
        })
      ) as RequiredProperty<typeof overwritesTable.$inferSelect>,
    }),
    {}
  );
  const generallyOverriddenLocations = Object.fromEntries(
    Object.entries(locationIdToData).map(([id, data]) => [
      id,
      { ...data, ...overrides[id] },
    ])
  ); // extra locationId property here, whatever

  // get time override data, apply each override
  const timeOverrides = await getTimeOverrides(timeSearchCutoffStr);
  for (const [id, timeOverrideMap] of Object.entries(timeOverrides)) {
    if (generallyOverriddenLocations[id] === undefined) continue;
    let locationTimes = generallyOverriddenLocations[id].times;
    for (const [overrideDate, timeRanges] of Object.entries(timeOverrideMap)) {
      locationTimes = locationTimes.filter(
        (time) => time.date !== overrideDate
      );

      locationTimes.push(
        ...timeRanges.map((rng) => ({
          date: overrideDate,
          startMinutesSinceMidnight: rng.start.hour * 60 + rng.start.minute,
          endMinutesSinceMidnight: rng.end.hour * 60 + rng.end.minute,
        }))
      );
    }
    generallyOverriddenLocations[id].times = locationTimes;
  }
  // merge all time intervals into usable format
  const locationsWithMergedTimes = Object.entries(
    generallyOverriddenLocations
  ).map(([id, data]) => {
    return {
      ...data,
      times: mergeTimeIntervals(data.times),
      // .map(
      //   (time) =>
      //     `${new Date(time.start).toLocaleString()}-${new Date(
      //       time.end
      //     ).toLocaleString()}`
      // ),
    };
  });
  return locationsWithMergedTimes;
}
