import {
  convertMonthStringToEnum,
  isValidDate,
  MonthOfTheYear,
} from "../../utils/timeUtils";
import ParsedTimeBase from "./parsedTimeBase";

export interface ParsedTimeDate {
  month: MonthOfTheYear;
  date: number;
}

/**
 * For parsing a string representing a date to a date data structure
 */
export default class ParsedTimeForDate extends ParsedTimeBase {
  declare value: ParsedTimeDate;

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
