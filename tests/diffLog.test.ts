import { getObjDiffs } from "../src/utils/diff";

jest.mock("../src/utils/slack", () => {
  return { notifySlack: jest.fn((str: string) => console.log(str)) };
});

describe("test diff checking", () => {
  test("basic", () => {
    const diffs = getObjDiffs([3], [2, 3]);
    expect(diffs).toContainEqual(expect.stringMatching(/inserted.*2/));
  });
  test("basic", () => {
    const diffs = getObjDiffs([1, 3], [2, 3]);
    expect(diffs).toContainEqual(expect.stringMatching(/inserted.*2/));
    expect(diffs).toContainEqual(expect.stringMatching(/deleted.*1/));
  });
  test("basic", () => {
    const diffs = getObjDiffs({ a: 1, b: 2 }, { a: 3, c: [1, 3] });
    expect(diffs).toContainEqual(expect.stringMatching(/deleted.*b.*2/));
    expect(diffs).toContainEqual(expect.stringMatching(/changed.*a/));
    expect(diffs).toContainEqual(expect.stringMatching(/inserted.*c.*[1,3]/));
  });
  test("basic", () => {
    const diffs = getObjDiffs(undefined, { a: 3, c: [1, 3] });
    expect(diffs).toContainEqual(expect.stringMatching(/inserted/));
  });
  test("nested", () => {
    const diffs = getObjDiffs(
      { a: { b: { c: { d: [1, 2, 3] } } } },
      { a: { b: { c: { d: [1, 2], e: "extra" } }, be: "extra" } }
    );
    expect(diffs).toContainEqual(
      expect.stringMatching(/deleted.*a\/b\/c\/d.*3/)
    );
    expect(diffs).toContainEqual(
      expect.stringMatching(/inserted.*a\/b\/c\/e.*extra/)
    );
    expect(diffs).toContainEqual(
      expect.stringMatching(/inserted.*a\/be.*extra/)
    );
  });
});
