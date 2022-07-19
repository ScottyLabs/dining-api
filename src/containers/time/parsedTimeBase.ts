import type { TimeInfoType } from "../../utils/timeUtils";

export default abstract class ParsedTimeBase {
  input: string;
  value: unknown;

  constructor(input: string) {
    this.input = input;
  }

  abstract parse(): ParsedTimeBase;

  get dataType(): TimeInfoType {
    if (this.dataType !== undefined) {
      return this.dataType;
    }
    throw new Error("Cannot retrieve data type when not yet parsed");
  }
}
