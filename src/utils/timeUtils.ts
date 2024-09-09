import { DayOfTheWeek, ITimeMoment, ITimeRange } from "types";

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

export function getMinutesSinceStartOfSunday(timeMoment: ITimeMoment) {
  return timeMoment.day * (24 * 60) + timeMoment.hour * 60 + timeMoment.minute;
}
/**
 *
 * @param moment1
 * @param moment2
 * @returns Delta in minutes of moment1 - moment2
 */
export function compareTimeMoments(moment1: ITimeMoment, moment2: ITimeMoment) {
  return (
    getMinutesSinceStartOfSunday(moment1) -
    getMinutesSinceStartOfSunday(moment2)
  );
}

export function sortAndMergeTimeRanges(timeRanges: ITimeRange[]) {
  timeRanges.sort((range1, range2) =>
    compareTimeMoments(range1.start, range2.start)
  );
  const mergedRanges: ITimeRange[] = [];

  for (const timeRange of timeRanges) {
    const lastTimeRange = mergedRanges.length
      ? mergedRanges[mergedRanges.length - 1]
      : undefined;
    if (lastTimeRange && lastTimeRange.end >= timeRange.start) {
      if (compareTimeMoments(lastTimeRange.end, timeRange.end) > 0) {
        lastTimeRange.end = timeRange.end; // join current range with last range
        continue;
      }
    }

    mergedRanges.push(timeRange);
  }
  return mergedRanges;
}
