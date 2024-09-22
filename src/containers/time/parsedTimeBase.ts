/**
 * Base class for parsing time from a string
 */
export default abstract class ParsedTimeBase {
  input: string;
  value: unknown;

  constructor(input: string) {
    this.input = input;
  }

  abstract parse(): ParsedTimeBase;
}
