import { Element, load } from "cheerio";

import { sortAndMergeTimeRanges } from "../utils/timeUtils";
import { IParsedTimeRange } from "./time/parsedTime";
import { convertMonthStringToEnum } from "./time/parsedTimeForDate";
import { ITimeRange, TimeInfoType } from "types";
import { parseToken } from "utils/parseTimeToken";
import { notifySlack } from "utils/slack";
import { DateTime } from "luxon";
import { ITimeOverwrites } from "overwrites/timeOverwrites";
import ParsedTimeForDayOfWeek from "./time/parsedTimeForDay";

/**
 *
 * @param schedule
 * @param currentYear Current year, XXXX
 * @returns
 */
export function getAllTimeSlotsFromSchedule(
  schedule: Element[],
  currentYear: number,
  scheduleOverwrites: ITimeOverwrites
) {
  const allTimeSlots: ITimeRange[] = [];
  let prevMonth = -1;
  for (const rowHTML of schedule) {
    const $ = load(rowHTML);
    try {
      const [date, timeSlotsForThatDay] = $.text()
        .replaceAll("\n", "")
        .replace(/\s\s+/g, " ")
        .split(/,(.*)/); // splits only on first comma
      const [dayOfWeek, month, day] = date.trim().split(" ");
      if (
        dayOfWeek === undefined ||
        month === undefined ||
        day === undefined ||
        date === undefined ||
        timeSlotsForThatDay === undefined
      )
        continue;
      const parsedMonth = convertMonthStringToEnum(month);
      const parsedDay = parseInt(day);
      const parsedDayOfWeek = new ParsedTimeForDayOfWeek(dayOfWeek).parse()
        .value;
      if (parsedMonth < prevMonth) {
        // new year
        currentYear++;
      }
      prevMonth = parsedMonth;

      const rowFullDateString = `${parsedMonth}/${parsedDay}/${currentYear}`;
      const rowDate = DateTime.fromFormat(rowFullDateString, "M/d/y");

      if (!rowDate.isValid) {
        notifySlack(
          `<!channel> Cannot parse date ${rowFullDateString}, derived from ${$.text()}`
        );
        continue;
      }
      const parsedTimeSlots = parseTimeSlots(
        scheduleOverwrites[rowFullDateString] ??
          timeSlotsForThatDay.split(/[,;]/).map((slot) => slot.trim())
      );
      const parsedTimeSlotsWithDateInfo = augmentAndEditTimeRangesWithDateInfo(
        parsedTimeSlots,
        parsedDayOfWeek // we could use rowDate.weekday % 7, but that would break a good number of tests that did not rely on serverDate to get the weekday...
      );
      allTimeSlots.push(...parsedTimeSlotsWithDateInfo);
    } catch (e) {
      notifySlack(
        `<!channel> Failed to parse row ${$.text()} ${e} ${(e as any).stack}`
      );
    }
  }
  return sortAndMergeTimeRanges(allTimeSlots);
}
/**
 *
 * @param timeString The actual time slots (ex. '10:30 AM - 8:00 PM' in the string 'Tuesday September 09,  10:30 AM - 8:00 PM')
 * @returns
 */
function parseTimeSlots(timeSlotStrings: string[]) {
  const timeRanges: IParsedTimeRange[] = [];

  for (const token of timeSlotStrings) {
    try {
      const { type: timeInfoType, value } = parseToken(token);
      switch (timeInfoType) {
        case TimeInfoType.TIME:
          timeRanges.push(value);
          break;
        case TimeInfoType.TWENTYFOURHOURS:
          timeRanges.push({
            start: { hour: 0, minute: 0 },
            end: { hour: 23, minute: 59 },
          });
      }
    } catch (err: any) {
      notifySlack(
        `<!channel> Failed to parse token \`${token}\` from time slot \`${timeSlotStrings.join(
          "|"
        )}\`\n${err.stack}`
      );
      continue;
    }
  }
  return timeRanges;
}

/**
 *
 * @param timeRanges
 * @param day (0-6, with Sunday being 0)
 * @returns
 */
function augmentAndEditTimeRangesWithDateInfo(
  timeRanges: IParsedTimeRange[],
  day: number
) {
  const allRanges: ITimeRange[] = [];
  for (const range of timeRanges) {
    rollBack12AmEndTime(range); // not sure why this was added, but it doesn't hurt I guess (I suppose the only case this actively helps is if the time string is 12:00 AM - 12:00 AM)
    const shouldSpillToNextDay =
      range.start.hour * 60 + range.start.minute >
      range.end.hour * 60 + range.end.minute;

    allRanges.push({
      start: {
        day: day,
        hour: range.start.hour,
        minute: range.start.minute,
      },
      end: {
        day: shouldSpillToNextDay ? (day + 1) % 7 : day,
        hour: range.end.hour,
        minute: range.end.minute,
      },
    });
  }
  return allRanges;
}
function rollBack12AmEndTime(range: IParsedTimeRange) {
  if (range.end.hour === 0 && range.end.minute === 0) {
    range.end.hour = 23;
    range.end.minute = 59;
  }
}
