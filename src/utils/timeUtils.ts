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
