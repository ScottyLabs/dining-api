import ParsedTimeBase from "../containers/time/parsedTimeBase";
import ParsedTimeForDay from "../containers/time/parsedTimeForDay";

export enum DayOfTheWeek {
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
}

export enum MonthOfTheYear {
  JANUARY = 1,
  FEBRUARY = 2,
  MARCH = 3,
  APRIL = 4,
  MAY = 5,
  JUNE = 6,
  JULY = 7,
  AUGUST = 8,
  SEPTEMBER = 9,
  OCTOBER = 10,
  NOVEMBER = 11,
  DECEMBER = 12,
}

export enum TimeInfoType {
  DAY = "DAY",
  DATE = "DATE",
  TIME = "TIME",
  CLOSED = "CLOSED",
  TWENTYFOURHOURS = "TWENTYFOURHOURS",
}

export function getNextDay(day: DayOfTheWeek): DayOfTheWeek {
  const weekdays: DayOfTheWeek[] = [
    DayOfTheWeek.SUNDAY,
    DayOfTheWeek.MONDAY,
    DayOfTheWeek.TUESDAY,
    DayOfTheWeek.WEDNESDAY,
    DayOfTheWeek.THURSDAY,
    DayOfTheWeek.FRIDAY,
    DayOfTheWeek.SATURDAY,
  ]; //ordered by time
  return weekdays[(weekdays.indexOf(day) + 1) % 7];
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

export function isDay(input: string): boolean {
  try {
    convertDayStringToEnum(input);
    return true;
  } catch {
    return false;
  }
}

export function convertMonthStringToEnum(monthStr: string): MonthOfTheYear {
  const normalizedMonth = monthStr.trim().toLowerCase();
  switch (normalizedMonth) {
    case "january":
    case "jan":
      return MonthOfTheYear.JANUARY;
    case "february":
    case "feb":
      return MonthOfTheYear.FEBRUARY;
    case "march":
    case "mar":
      return MonthOfTheYear.MARCH;
    case "april":
    case "apr":
      return MonthOfTheYear.APRIL;
    case "may":
      return MonthOfTheYear.MAY;
    case "june":
    case "jun":
      return MonthOfTheYear.JUNE;
    case "july":
    case "jul":
      return MonthOfTheYear.JULY;
    case "august":
    case "aug":
      return MonthOfTheYear.AUGUST;
    case "september":
    case "sept":
    case "sep":
      return MonthOfTheYear.SEPTEMBER;
    case "october":
    case "oct":
      return MonthOfTheYear.OCTOBER;
    case "november":
    case "nov":
      return MonthOfTheYear.NOVEMBER;
    case "december":
    case "dec":
      return MonthOfTheYear.DECEMBER;
    default:
      throw new Error(`Invalid Month: ${monthStr}`);
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

export function isValidDate(month: MonthOfTheYear, date: number): boolean {
  if (!Number.isInteger(date)) {
    return false;
  }
  switch (month) {
    case MonthOfTheYear.JANUARY:
    case MonthOfTheYear.MARCH:
    case MonthOfTheYear.MAY:
    case MonthOfTheYear.JULY:
    case MonthOfTheYear.AUGUST:
    case MonthOfTheYear.OCTOBER:
    case MonthOfTheYear.DECEMBER:
      return date <= 31 && date >= 1;
    case MonthOfTheYear.FEBRUARY:
      return date <= 29 && date >= 1;
    case MonthOfTheYear.APRIL:
    case MonthOfTheYear.JUNE:
    case MonthOfTheYear.SEPTEMBER:
    case MonthOfTheYear.NOVEMBER:
      return date <= 30 && date >= 1;
  }
}

export function assertHourIsValid(hour: number, twentyFourHours: boolean) {
  if (twentyFourHours) {
    if (hour > 23 || hour < 0) {
      throw new Error(`Invalid Hour: ${hour} (24-hour format)`);
    }
  } else {
    if (hour > 12 || hour < 1) {
      throw new Error(`Invalid Hour: ${hour} (12-hour format)`);
    }
  }
}

export function assertMinuteIsValid(minute: number) {
  if (minute > 59 || minute < 0) {
    throw new Error(`Invalid Minute: ${minute}`);
  }
}

export function determineTimeInfoType(input: string): TimeInfoType {
  input = input.trim().toLowerCase();
  if (isDay(input)) {
    return TimeInfoType.DAY;
  }
  const testMonth = input.split(/\s/)[0];
  if (isMonth(testMonth)) {
    return TimeInfoType.DATE;
  }
  if (input === "24 hours" || input === "open 24 hrs") {
    return TimeInfoType.TWENTYFOURHOURS;
  }
  if (input === "closed") {
    return TimeInfoType.CLOSED;
  }
  if (
    Array.isArray(
      input.match(/\d\d?:\d\d\s?(?:am|pm)\s?-\s?\d\d?:\d\d\s?(?:am|pm)/)
    )
  ) {
    return TimeInfoType.TIME;
  }
  throw new Error("Could not determine time info type");
}
