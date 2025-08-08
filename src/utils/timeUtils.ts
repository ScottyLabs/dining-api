import { DayOfTheWeek, ITimeSlot, ITimeRange } from "types";

export function getNextDay(day: DayOfTheWeek): DayOfTheWeek {
  const weekdays: DayOfTheWeek[] = [
    DayOfTheWeek.SUNDAY,
    DayOfTheWeek.MONDAY,
    DayOfTheWeek.TUESDAY,
    DayOfTheWeek.WEDNESDAY,
    DayOfTheWeek.THURSDAY,
    DayOfTheWeek.FRIDAY,
    DayOfTheWeek.SATURDAY,
  ]; // ordered by time
  return weekdays[(weekdays.indexOf(day) + 1) % 7];
}

export function getMinutesSinceStartOfSunday(timeMoment: ITimeSlot) {
  return timeMoment.day * (24 * 60) + timeMoment.hour * 60 + timeMoment.minute;
}
/**
 *
 * @param moment1
 * @param moment2
 * @returns Delta in minutes of moment1 - moment2
 */
export function compareTimeSlots(moment1: ITimeSlot, moment2: ITimeSlot) {
  return (
    getMinutesSinceStartOfSunday(moment1) -
    getMinutesSinceStartOfSunday(moment2)
  );
}

export function sortAndMergeTimeRanges(timeRanges: ITimeRange[]) {
  timeRanges.sort((range1, range2) =>
    compareTimeSlots(range1.start, range2.start)
  );
  const mergedRanges: ITimeRange[] = [];

  for (const timeRange of timeRanges) {
    const lastTimeRange = mergedRanges.length
      ? mergedRanges[mergedRanges.length - 1]
      : undefined;
    if (compareTimeSlots(timeRange.start, timeRange.end) > 0) {
      // this is a wrap-around time (we, however, don't want to deal with these when merging time intervals (the logic may be a bit messy), so let's just un-wrap the time)
      timeRange.end.day += 7; // no longer a valid DayOfTheWeek, but that's fine
    }
    if (
      lastTimeRange &&
      compareTimeSlots(lastTimeRange.end, timeRange.start) >= -1 // we overlap 1-minute disjoint intervals as well (ex. 2:00 PM - 2:59 PM will get merged with 3:00PM - 4:00PM as 2:00PM - 4:00PM)
    ) {
      if (compareTimeSlots(timeRange.end, lastTimeRange.end) > 0) {
        lastTimeRange.end = timeRange.end; // join current range with last range
      }
    } else {
      mergedRanges.push(timeRange);
    }
  }
  for (const mergedRange of mergedRanges) {
    if (compareTimeSlots(mergedRange.start, mergedRange.end) > 0)
      throw new Error("unexpected wrap-around range found!");
  }
  // last timeRange should be the only one that wraps around (if it does), since no starting time slot has day >= 7
  if (mergedRanges.length > 0) {
    const lastTimeSlot = mergedRanges[mergedRanges.length - 1];
    if (lastTimeSlot.end.day >= 7) {
      // this is a wrap-around - need to coalesce with the earlier merged ranges
      lastTimeSlot.end.day %= 7;
      if (compareTimeSlots(lastTimeSlot.end, lastTimeSlot.start) >= -1) {
        // the last merged time slot covers the entire week
        return [
          {
            start: { day: DayOfTheWeek.SUNDAY, hour: 0, minute: 0 },
            end: { day: DayOfTheWeek.SATURDAY, hour: 23, minute: 59 },
          },
        ];
      } else {
        // merge it with the earlier time ranges (note that the last time interval cannot merge with itself due to the above if condition)
        while (mergedRanges.length > 1) {
          if (compareTimeSlots(lastTimeSlot.end, mergedRanges[0].start) >= -1) {
            lastTimeSlot.end =
              compareTimeSlots(lastTimeSlot.end, mergedRanges[0].end) > 0
                ? lastTimeSlot.end
                : mergedRanges[0].end;
            mergedRanges.shift();
          } else {
            break;
          }
        }
      }
    }
  }
  return mergedRanges;
}
