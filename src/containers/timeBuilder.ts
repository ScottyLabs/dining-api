import { load } from "cheerio";
import type { Element } from "domhandler";

import { getNextDay } from "../utils/timeUtils";
import { IParsedTimeRange } from "./time/parsedTime";
import { IParsedTimeDate } from "./time/parsedTimeForDate";
import { DayOfTheWeek, ITimeRange, TimeInfoType } from "types";
import { parseToken } from "utils/parseTimeToken";
import { notifySlack } from "utils/slack";
import { DateTime } from "luxon";
import { ITimeOverwrites } from "overwrites/timeOverwrites";

interface ITimeRowAttributes {
  day?: DayOfTheWeek;
  date?: IParsedTimeDate;
  /** Multiple times in the same day (ex. https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/180) */
  times?: IParsedTimeRange[];
  closed?: boolean;
  twentyFour?: boolean;
}
/**
 *
 * @param rowString ex. Monday, September 09,  7:30 AM - 10:00 AM, 11:00 AM - 2:00 PM, 4:30 PM - 8:30 PM
 * @param timeScraped Server time when rowHTML was obtained. we'll use this to derive the year for the row entry (and use that to check for relevant overrides)
 */
export function getTimeRangesFromString(
  rowHTML: Element,
  timeScraped: DateTime<true>,
  overwrites: ITimeOverwrites
) {
  let timeRowInfo: ITimeRowAttributes = getTimeAttributesFromRow(rowHTML);
  if (timeRowInfo.date) {
    const { date, month } = timeRowInfo.date;

    let twoDigitYear = timeScraped.year % 100;
    if (
      month < timeScraped.month ||
      (month === timeScraped.month && date < timeScraped.day)
    ) {
      // we are in the next year if the row date is before `timeScraped` (note: this requires `timeScraped` to be accurate and in the correct timezone, EST)
      twoDigitYear++;
    }

    const overrideEntry = overwrites[`${month}/${date}/${twoDigitYear}`];
    if (overrideEntry !== undefined) {
      timeRowInfo = getTimeAttributesFromRow(rowHTML, overrideEntry); // yes, we are reparsing the string again, but we need a first pass to get the date
    }
  }

  timeRowInfo = resolveAttributeConflicts(timeRowInfo);
  return getTimeRangesFromTimeRow(timeRowInfo);
}

/**
 *
 * @param rowHTML
 * @param timeSlotOverrides ex. [7:00 AM - 3:00 PM, 4:00 PM - 6:00 PM] (the string should be formatted exactly how the dining site formats the string)
 * Whatever is put here completely overrides the original time slot values.
 * @returns
 */
function getTimeAttributesFromRow(
  rowHTML: Element,
  timeSlotOverrides?: string[]
) {
  return getTimeInfoWithRawAttributes(
    tokenizeTimeRow(rowHTML, timeSlotOverrides)
  );
}

function tokenizeTimeRow(rowHTML: Element, timeSlotOverrides?: string[]) {
  const $ = load(rowHTML);
  let day = $("strong").text();
  const dataStr = $.text().replace(/\s\s+/g, " ").replace(day, "").trim();
  let [date, time] = dataStr.split(/,(.+)/);
  if (date === undefined || time === undefined) return [];

  day = (day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()).trim();
  date = (date.charAt(0).toUpperCase() + date.slice(1).toLowerCase()).trim();
  time = time.toUpperCase().trim();
  const timeSlots =
    timeSlotOverrides ?? time.split(/[,;]/).map((slot) => slot.trim());
  return [day, date, ...timeSlots];
}

function getTimeInfoWithRawAttributes(tokens: string[]) {
  const timeInfo: ITimeRowAttributes = {};

  for (const token of tokens) {
    try {
      const { type: timeInfoType, value } = parseToken(token);
      switch (timeInfoType) {
        case TimeInfoType.DAY:
          timeInfo.day = value;
          break;
        case TimeInfoType.DATE:
          timeInfo.date = value;
          break;
        case TimeInfoType.TIME:
          if (timeInfo.times !== undefined) {
            timeInfo.times.push(value);
          } else {
            timeInfo.times = [value];
          }
          break;
        case TimeInfoType.CLOSED:
          timeInfo.closed = true;
          break;
        case TimeInfoType.TWENTYFOURHOURS:
          timeInfo.twentyFour = true;
          break;
      }
    } catch (err: any) {
      notifySlack(
        `<!channel> Failed to parse token \`${token}\` from list of tokens \`${tokens}\`\n${err.stack}`
      );
      continue;
    }
  }
  return timeInfo;
}

function resolveAttributeConflicts(
  input: ITimeRowAttributes
): ITimeRowAttributes {
  if (input.closed) {
    return {
      day: input.day,
      date: input.date,
      closed: input.closed,
    };
  }
  if (input.twentyFour) {
    return {
      day: input.day,
      date: input.date,
      times: [{ start: { hour: 0, minute: 0 }, end: { hour: 23, minute: 59 } }],
    };
  }
  if (input.times && input.times.length > 0) {
    return {
      day: input.day,
      date: input.date,
      times: input.times,
    };
  }
  return {
    day: input.day,
    date: input.date,
    times: [],
  };
}

function getTimeRangesFromTimeRow(time: ITimeRowAttributes) {
  if (time.day === undefined) {
    notifySlack(
      `<!channel> Cannot convert time attribute: ${JSON.stringify(
        time
      )} since day is not set`
    );
    return [];
  }
  const allRanges: ITimeRange[] = [];
  for (const range of time.times ?? []) {
    rollBack12AmEndTime(range); // not sure why this was added, but it doesn't hurt I guess (I suppose the only case this actively helps is if the time string is 12:00 AM - 12:00 AM)
    const shouldSpillToNextDay =
      range.start.hour * 60 + range.start.minute >
      range.end.hour * 60 + range.end.minute;

    allRanges.push({
      start: {
        day: time.day,
        hour: range.start.hour,
        minute: range.start.minute,
      },
      end: {
        day: shouldSpillToNextDay ? getNextDay(time.day) : time.day,
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
