import { load } from "cheerio";
import type { Element } from "domhandler";

import { getNextDay } from "../utils/timeUtils";
import { IParsedTimeRange } from "./time/parsedTime";
import { IParsedTimeDate } from "./time/parsedTimeForDate";
import { DayOfTheWeek, ITimeRange, TimeInfoType } from "types";
import { parseToken } from "utils/parseTimeToken";
import { notifySlack } from "utils/slack";

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
 */
export function getTimeRangesFromString(rowHTML: Element) {
  let timeRowInfo: ITimeRowAttributes = getTimeAttributesFromRow(rowHTML);
  timeRowInfo = resolveAttributeConflicts(timeRowInfo);
  return getTimeRangesFromTimeRow(timeRowInfo);
}

function getTimeAttributesFromRow(rowHTML: Element) {
  const { day, date, timeSlots } = tokenizeTimeRow(rowHTML);
  return getTimeInfoWithRawAttributes([day, date, ...timeSlots]);
}

function tokenizeTimeRow(rowHTML: Element) {
  const $ = load(rowHTML);
  let day = $("strong").text();
  const dataStr = $.text().replace(/\s\s+/g, " ").replace(day, "").trim();
  let [date, time] = dataStr.split(/,(.+)/);

  day = (day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()).trim();
  date = (date.charAt(0).toUpperCase() + date.slice(1).toLowerCase()).trim();
  time = time.toUpperCase().trim();
  const timeSlots = time.split(/[,;]/).map((slot) => slot.trim());
  return { day, date, timeSlots };
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
    times: [{ start: { hour: 0, minute: 0 }, end: { hour: 23, minute: 59 } }],
  };
}

function getTimeRangesFromTimeRow(time: ITimeRowAttributes) {
  if (time.day === undefined) {
    throw new Error("Cannot convert when day is not set");
  }
  const allRanges: ITimeRange[] = [];
  for (const range of time.times ?? []) {
    rollBack12AmEndTime(range);

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
