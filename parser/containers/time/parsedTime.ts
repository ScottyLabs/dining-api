import ParsedTimeBase from "./parsedTimeBase";

interface Time {
  hour: number;
  minute: number;
}

export interface ParsedTimeRange {
  start: Time;
  end: Time;
}

export default class ParsedTime extends ParsedTimeBase {
  protected declare value: ParsedTimeRange;

  private parseTime(timeStr: string): Time {
    const normalizedStr = timeStr.trim().toLowerCase();
    const tokens = normalizedStr.split(/\s|:/);
    if (tokens.length !== 3) {
      throw new Error(`Invalid time ${timeStr}`);
    }
    const hour = parseInt(tokens[0]);
    if (!Number.isInteger(hour) || hour > 12 || hour < 1) {
      throw new Error(`Invalid time ${timeStr}`);
    }
    const minute = parseInt(tokens[1]);
    if (!Number.isInteger(minute) || minute > 59 || minute < 0) {
      throw new Error(`Invalid time ${timeStr}`);
    }
    if (!["am", "pm"].includes(tokens[2])) {
      throw new Error(`Invalid time ${timeStr}`);
    }
    if (tokens[2] === "am") {
      return {
        hour: hour === 12 ? hour - 12 : hour,
        minute,
      };
    } else {
      return {
        hour: hour === 12 ? hour : hour + 12,
        minute,
      };
    }
  }

  parse() {
    const tokens = this.input.split("-");
    if (tokens.length !== 2) {
      throw new Error(`Invalid time range: ${this.input}`);
    }
    const start = this.parseTime(tokens[0]);
    const end = this.parseTime(tokens[1]);
    this.value = {
      start,
      end,
    };
    return this;
  }

  getValue() {
    return this.value;
  }
}
