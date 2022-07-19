import { convertDayStringToEnum, DayOfTheWeek } from "../../utils/timeUtils";
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
