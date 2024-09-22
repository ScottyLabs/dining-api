import { DayOfTheWeek } from "types";
import ParsedTimeBase from "./parsedTimeBase";

/**
 * For parsing a string representing a day to a day of the week enum
 */
export default class ParsedTimeForDay extends ParsedTimeBase {
  declare value: DayOfTheWeek;

  parse() {
    this.value = convertDayStringToEnum(this.input);
    return this;
  }
}

export function convertDayStringToEnum(dayStr: string): DayOfTheWeek {
  const normalizedDay = dayStr.trim().toLowerCase();
  switch (normalizedDay) {
    case "sunday":
    case "sun":
      return DayOfTheWeek.SUNDAY;
    case "monday":
    case "mon":
      return DayOfTheWeek.MONDAY;
    case "tuesday":
    case "tue":
      return DayOfTheWeek.TUESDAY;
    case "wednesday":
    case "wed":
      return DayOfTheWeek.WEDNESDAY;
    case "thursday":
    case "thu":
    case "thurs":
      return DayOfTheWeek.THURSDAY;
    case "friday":
    case "fri":
      return DayOfTheWeek.FRIDAY;
    case "saturday":
    case "sat":
      return DayOfTheWeek.SATURDAY;
    default:
      throw new Error(`Invalid Day: ${dayStr}`);
  }
}
