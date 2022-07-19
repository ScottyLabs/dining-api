import { convertDayStringToEnum, DayOfTheWeek } from "../../utils/timeUtils";
import ParsedTimeBase from "./parsedTimeBase";

export default class ParsedTimeForDay extends ParsedTimeBase {
  declare value: DayOfTheWeek;

  parse() {
    this.value = convertDayStringToEnum(this.input);
    return this;
  }
}
