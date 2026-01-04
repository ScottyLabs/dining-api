import { ITimeRangeInternal } from "db/dbQueryUtils";
import { DateTime } from "luxon";

/**
 *
 * @param timeRanges does not need to be sorted
 * @returns
 */
export function mergeTimeRanges(
  timeRanges: { start: number; end: number }[],
  slackBetweenRanges = 0
) {
  const mergedRanges: { start: number; end: number }[] = [];
  timeRanges.sort((a, b) => a.start - b.start);
  for (const rng of timeRanges) {
    const lastMergedRange = mergedRanges.length
      ? mergedRanges[mergedRanges.length - 1]
      : undefined;
    if (
      lastMergedRange &&
      lastMergedRange.end + slackBetweenRanges >= rng.start
    ) {
      lastMergedRange.end = Math.max(lastMergedRange.end, rng.end);
    } else {
      mergedRanges.push(rng);
    }
  }
  return mergedRanges;
}
export function pad(n: number) {
  return n.toString().padStart(2, "0");
}
/** Wraps time intervals to the next day if end < start, and then merges everything */
export function remapAndMergeTimeIntervals(timeRanges: ITimeRangeInternal[]) {
  const timeStampedIntervals = timeRanges.map((rng) => {
    const date = DateTime.fromISO(rng.date, { zone: "America/New_York" });
    const startDate = date.set({ minute: rng.startMinutesSinceMidnight });
    const endDate = date.set({ minute: rng.endMinutesSinceMidnight }).plus({
      days: rng.endMinutesSinceMidnight < rng.startMinutesSinceMidnight ? 1 : 0,
    }); // account for wrap-around
    return {
      start: startDate.toMillis(),
      end: endDate.toMillis(),
    };
  });
  return mergeTimeRanges(timeStampedIntervals, 60 * 1000); // merge gaps of at most 1 min
}
