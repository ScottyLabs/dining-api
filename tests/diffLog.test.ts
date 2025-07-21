import { logObjDiffs } from "../src/utils/diff";

jest.mock("../src/utils/slack", () => {
  return { notifySlack: jest.fn((str: string) => console.log(str)) };
});

describe("test diff checking", () => {
  test("basic", () => {
    const logSpy = jest.spyOn(console, "log");
    logObjDiffs([3], [2, 3]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/inserted.*2/));
  });
  test("basic", () => {
    const logSpy = jest.spyOn(console, "log");
    logObjDiffs([1, 3], [2, 3]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/inserted.*2/));
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/deleted.*1/));
  });
  test("basic", () => {
    const logSpy = jest.spyOn(console, "log");
    logObjDiffs({ a: 1, b: 2 }, { a: 3, c: [1, 3] });
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/deleted.*b.*2/));
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/changed.*a/));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/inserted.*c.*[1,3]/)
    );
  });
  test("basic", () => {
    const logSpy = jest.spyOn(console, "log");
    logObjDiffs(undefined, { a: 3, c: [1, 3] });
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/inserted/));
  });
  test("nested", () => {
    const logSpy = jest.spyOn(console, "log");
    logObjDiffs(
      { a: { b: { c: { d: [1, 2, 3] } } } },
      { a: { b: { c: { d: [1, 2], e: "extra" } }, be: "extra" } }
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/deleted.*a\/b\/c\/d.*3/)
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/inserted.*a\/b\/c\/e.*extra/)
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/inserted.*a\/be.*extra/)
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/inserted.*c.*[1,3]/)
    );
  });
});
