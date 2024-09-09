import { MonthOfTheYear } from "types";
import { isValidDate } from "utils/parseTimeToken";
import ParsedTimeBase from "./parsedTimeBase";

export interface IParsedTimeDate {
  month: MonthOfTheYear;
  date: number;
}

/**
 * For parsing a string representing a date to a date data structure
 */
export default class ParsedTimeForDate extends ParsedTimeBase {
  declare value: IParsedTimeDate;

  parse() {
    const tokens = this.input.trim().split(/\s/);
    if (tokens.length < 2) {
      throw new Error(`Invalid date: ${this.input}`);
    }
    const month = convertMonthStringToEnum(tokens[0]);
    const date = parseInt(tokens[1]);

    if (!Number.isInteger(date)) {
      throw new Error(`Invalid date: ${this.input}`);
    }

    if (isValidDate(month, date)) {
      this.value = {
        month,
        date,
      };
    } else {
      throw new Error(`Invalid date: ${this.input}`);
    }
    return this;
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
