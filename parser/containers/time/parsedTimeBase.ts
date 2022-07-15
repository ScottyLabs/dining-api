import type { TimeInfoType } from "../../utils/timeUtils";

export default abstract class ParsedTimeBase {
  protected input: string;
  protected dataType?: TimeInfoType;
  protected value: unknown;

  constructor(input: string) {
    this.input = input;
  }

  abstract parse(): ParsedTimeBase;

  getInput(): string {
    return this.input;
  }

  getDataType(): TimeInfoType {
    if (this.dataType !== undefined) {
      return this.dataType;
    }
    throw new Error("Cannot retrieve data type when not yet parsed");
  }

  abstract getValue(): typeof this.value;
}
