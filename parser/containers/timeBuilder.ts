import { throwUnreachable } from "../utils/assertions";
import {
  convertDayStringToEnum,
  DayOfTheWeek,
  determinePossibleTimeInfoTypes,
  TimeInfoType,
} from "../utils/timeUtils";

class TimeBuilder {
  private times;

  constructor() {
    this.times = {};
  }

  private appendToDayOrSet() {}

  addSchedule(timeArray: Array<string>): TimeBuilder {
    for (const token of timeArray) {
    }
    return this;
  }
}
