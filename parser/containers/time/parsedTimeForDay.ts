import { convertDayStringToEnum, DayOfTheWeek } from "../../utils/timeUtils";
import ParsedTimeBase from "./parsedTimeBase";

export default class ParsedTimeForDay extends ParsedTimeBase {
  protected declare value: DayOfTheWeek;

  parse() {
    this.value = convertDayStringToEnum(this.input);
    return this;
  }

  getValue() {
    return this.value;
  }
}
