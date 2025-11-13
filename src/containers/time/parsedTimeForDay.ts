import ParsedTimeBase from "./parsedTimeBase";

/**
 * For parsing a string representing a day to a day of the week (0-6)
 */
export default class ParsedTimeForDay extends ParsedTimeBase {
  declare value: number;

  parse() {
    this.value = convertDayStringToEnum(this.input);
    return this;
  }
}

export function convertDayStringToEnum(dayStr: string): number {
  const normalizedDay = dayStr.trim().toLowerCase();
  switch (normalizedDay) {
    case "sunday":
    case "sun":
      return 0;
    case "monday":
    case "mon":
      return 1;
    case "tuesday":
    case "tue":
      return 2;
    case "wednesday":
    case "wed":
      return 3;
    case "thursday":
    case "thu":
    case "thurs":
      return 4;
    case "friday":
    case "fri":
      return 5;
    case "saturday":
    case "sat":
      return 6;
    default:
      throw new Error(`Invalid Day: ${dayStr}`);
  }
}
