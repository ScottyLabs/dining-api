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

export function getMinutesSinceStartOfSunday(timeSlot: ITimeSlot) {
  return timeSlot.day * (24 * 60) + timeSlot.hour * 60 + timeSlot.minute;
}
/**
 *
 * @param timeSlot1
 * @param timeSlot2
 * @returns Delta in minutes of moment1 - moment2
 */
export function compareTimeSlots(timeSlot1: ITimeSlot, timeSlot2: ITimeSlot) {
  return (
    getMinutesSinceStartOfSunday(timeSlot1) -
    getMinutesSinceStartOfSunday(timeSlot2)
  );
}

export function sortAndMergeTimeRanges(timeRanges: ITimeRange[]) {
  const MINUTES_IN_A_WEEK = 60 * 24 * 7;
  const unwrappedTimeRanges = timeRanges
    .flatMap((rng) => {
      if (compareTimeSlots(rng.start, rng.end) > 0) {
        // unwrap the wrapped interval
        return [
          { start: { day: 0, hour: 0, minute: 0 }, end: rng.end },
          { start: rng.start, end: { day: 6, hour: 23, minute: 59 } },
        ];
      } else {
        return [rng];
      }
    })
    .sort((range1, range2) => compareTimeSlots(range1.start, range2.start));
  const mergedRanges: ITimeRange[] = [];

  for (const timeRange of unwrappedTimeRanges) {
    const lastTimeRange = mergedRanges.length
      ? mergedRanges[mergedRanges.length - 1]
      : undefined;
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
  // merge the last day with the first day if needed
  if (mergedRanges.length >= 2) {
    const lastRange = mergedRanges[mergedRanges.length - 1];
    const firstRange = mergedRanges[0];
    if (
      getMinutesSinceStartOfSunday(lastRange.end) === MINUTES_IN_A_WEEK - 1 &&
      getMinutesSinceStartOfSunday(firstRange.start) === 0
    ) {
      lastRange.end = firstRange.end;
      mergedRanges.shift();
    }
  }

  return mergedRanges;
}
