import {
  DayOfTheWeek,
  determineTimeInfoType,
  TimeInfoType,
} from "../utils/timeUtils";
import ParsedTime, { ParsedTimeRange } from "./time/parsedTime";
import ParsedTimeForDate, { ParsedTimeDate } from "./time/parsedTimeForDate";
import ParsedTimeForDay from "./time/parsedTimeForDay";

export default class TimeBuilder {
  private times;

  constructor() {
    this.times = {};
  }

  addSchedule(timeArray: Array<string>): TimeBuilder {
    const timeFields: {
      day?: DayOfTheWeek;
      date?: ParsedTimeDate;
      time?: ParsedTimeRange;
      closed?: boolean;
      twentyFour?: boolean;
    } = {};
    for (const token of timeArray) {
      const timeInfoType = determineTimeInfoType(token);
      try {
        switch (timeInfoType) {
          case TimeInfoType.DAY:
            timeFields.day = new ParsedTimeForDay(token).parse().getValue();
            break;
          case TimeInfoType.DATE:
            timeFields.date = new ParsedTimeForDate(token).parse().getValue();
            break;
          case TimeInfoType.TIME:
            timeFields.time = new ParsedTime(token).parse().getValue();
            break;
          case TimeInfoType.CLOSED:
            timeFields.closed = true;
            break;
          case TimeInfoType.TWENTYFOURHOURS:
            timeFields.twentyFour = true;
            break;
        }
      } catch (err) {
        console.error(err);
        continue;
      }
    }
    console.log(timeFields);
    return this;
  }
}
