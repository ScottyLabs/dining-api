import {
  DayOfTheWeek,
  determineTimeInfoType,
  getNextDay,
  TimeInfoType,
} from "../utils/timeUtils";
import { TimeSchema } from "./locationBuilder";
import ParsedTime, { ParsedTimeRange } from "./time/parsedTime";
import ParsedTimeForDate, { ParsedTimeDate } from "./time/parsedTimeForDate";
import ParsedTimeForDay from "./time/parsedTimeForDay";

interface TimeBuilderSchema {
  day?: DayOfTheWeek;
  date?: ParsedTimeDate;
  /** Multiple times in the same day (ex. https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/180) */
  times?: ParsedTimeRange[];
  closed?: boolean;
  twentyFour?: boolean;
}

/**
 * For building the location schedules/times data structure
 */
export default class TimeBuilder {
  private times: TimeBuilderSchema[];

  constructor() {
    this.times = [];
  }

  private resolveConflicts(input: TimeBuilderSchema): TimeBuilderSchema {
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

  addSchedule(timeArray: Array<string>): TimeBuilder {
    const timeFields: TimeBuilderSchema = {};
    for (const token of timeArray) {
      const timeInfoType = determineTimeInfoType(token);
      try {
        switch (timeInfoType) {
          case TimeInfoType.DAY:
            timeFields.day = new ParsedTimeForDay(token).parse().value;
            break;
          case TimeInfoType.DATE:
            timeFields.date = new ParsedTimeForDate(token).parse().value;
            break;
          case TimeInfoType.TIME:
            const timeRange = new ParsedTime(token).parse().value;
            if (Array.isArray(timeFields.times)) {
              timeFields.times.push(timeRange);
            } else {
              timeFields.times = [timeRange];
            }
            break;
          case TimeInfoType.CLOSED:
            timeFields.closed = true;
            break;
          case TimeInfoType.TWENTYFOUR_HOURS:
            timeFields.twentyFour = true;
            break;
        }
      } catch (err) {
        console.error(err);
        continue;
      }
    }
    const normalizedSchedule = this.resolveConflicts(timeFields);
    this.times.push(normalizedSchedule);

    return this;
  }

  private convertTimeRangeToTimeSchema(
    time: TimeBuilderSchema,
    range: ParsedTimeRange
  ) {
    if (time.day === undefined) {
      throw new Error("Cannot convert when day is not set");
    }
    let spillToNextDay = range.start.hour * 60 + range.start.minute >= range.end.hour * 60 + range.end.minute;

    return {
      start: {
        day: time.day,
        hour: range.start.hour,
        minute: range.start.minute,
      },
      end: {
        day: spillToNextDay ? getNextDay(time.day) : time.day,
        hour: range.end.hour,
        minute: range.end.minute,
      },
    };
  }

  build() {
    const result: TimeSchema[] = [];
    for (const time of this.times) {
      if (Array.isArray(time.times)) {
        result.push(
          ...time.times.map((current) => {
            return this.convertTimeRangeToTimeSchema(time, current);
          })
        );
      }
    }
    return result;
  }
}
