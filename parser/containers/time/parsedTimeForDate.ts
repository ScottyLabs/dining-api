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

export default class ParsedTimeForDate extends ParsedTimeBase {
  value: ParsedTimeDate;

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

  getValue() {
    return this.value;
  }
}
