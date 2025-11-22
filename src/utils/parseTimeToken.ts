import ParsedTime from "containers/time/parsedTime";
import { convertMonthStringToEnum } from "containers/time/parsedTimeForDate";
import { convertDayStringToEnum } from "containers/time/parsedTimeForDay";
import { TimeInfoType } from "types";

export function parseToken(token: string) {
  token = token.trim().toLowerCase();
  if (
    token === "24 hours" ||
    token === "24 hrs" ||
    token === "open 24 hrs" ||
    token === "open 24 hours"
  ) {
    return { type: TimeInfoType.TWENTYFOURHOURS } as const;
  }

  if (token === "closed") {
    return { type: TimeInfoType.CLOSED } as const;
  }
  if (
    Array.isArray(
      token.match(/\d\d?:\d\d\s?(?:am|pm)\s?-\s?\d\d?:\d\d\s?(?:am|pm)/)
    )
  ) {
    return {
      type: TimeInfoType.TIME,
      value: new ParsedTime(token).parse().value,
    } as const;
  }
  throw new Error(`Could not determine time info type of string '${token}'`);
}

export function isDay(input: string): boolean {
  try {
    convertDayStringToEnum(input);
    return true;
  } catch {
    return false;
  }
}

export function isMonth(input: string): boolean {
  try {
    convertMonthStringToEnum(input);
    return true;
  } catch {
    return false;
  }
}
