import {
  getGeneralOverrides,
  getLocationIdToDataMap,
  getSpecials,
  getTimeOverrides,
  ITimeRangeInternal,
} from "./dbQueryUtils";
import { DateTime } from "luxon";
import { pad, remapAndMergeTimeIntervals } from "utils/timeUtils";
import { IParsedTimeRange } from "containers/time/parsedTime";

export async function getAllLocations(today: DateTime) {
  const timeSearchCutoff = today.minus({ days: 1 }); // 1 days worth of data before today
  const timeSearchCutoffStr = `${timeSearchCutoff.year}-${pad(
    timeSearchCutoff.month
  )}-${pad(timeSearchCutoff.day)}`;

  const locationIdToData = await getLocationIdToDataMap(timeSearchCutoffStr);
  const specials = await getSpecials(
    `${today.year}/${pad(today.month)}/${pad(today.day)}`
  );
  const generalOverrides = await getGeneralOverrides();
  const timeOverrides = await getTimeOverrides(timeSearchCutoffStr);

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
