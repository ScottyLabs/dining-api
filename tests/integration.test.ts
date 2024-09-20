import DiningParser from "../src/parser/diningParser";

import { expectedLocationData } from "./expectedData";
import { mockAxiosGETWithFilePaths } from "./mockAxios";
import {
  setUpTimingTest,
  queryParserAndAssertTimingsCorrect,
  Mon,
  Tue,
  Wed,
  Thur,
  Fri,
  Sat,
  Sun,
} from "./mockTimings";

jest.mock("axios");
jest.mock("../src/config", () => ({
  AXIOS_RETRY_INTERVAL_MS: 0,
  IS_TESTING: true,
}));

test("the whole thing, including locationOverwrites", async () => {
  mockAxiosGETWithFilePaths({
    conceptListFilePath: "html/listconcepts.html",
    specialsFilePath: "html/specials.html",
    soupsFilePath: "html/soups.html",
    getConceptFilePath: (locationId: string) =>
      ["92", "110", "113", "175"].includes(locationId)
        ? `html/concepts/${locationId}.html`
        : "html/blank.html",
  });
  const parser = new DiningParser();
  expect(await parser.process()).toEqual(expectedLocationData);
});

test(
  "parser throws on repeated axios error",
  async () => {
    mockAxiosGETWithFilePaths({});
    const parser = new DiningParser();

    await expect(async () => {
      await parser.process();
    }).rejects.toThrow("not found!");
  },
  10 * 1000
);

describe("time edge cases", () => {
  test("closed and 24 hrs", async () => {
    setUpTimingTest({
      [Mon]: "CLOSED",
      [Tue]: "OPEN 24 HOURS",
      [Wed]: "OPEN 24 HRS",
      [Thur]: "24 hRs",
      [Fri]: "24 hours",
    });
    await queryParserAndAssertTimingsCorrect([
      [Tue, 0, 0, Tue, 23, 59],
      [Wed, 0, 0, Wed, 23, 59],
      [Thur, 0, 0, Thur, 23, 59],
      [Fri, 0, 0, Fri, 23, 59],
    ]);
  });
  test("single time", async () => {
    setUpTimingTest({
      [Sun]: "3:12 PM - 11:30 PM",
      [Mon]: "9:00 AM - 5:00 PM",
      [Tue]: "10:00 AM - 6:00 PM",
      [Wed]: "11:00 AM - 7:00 PM",
      [Thur]: "12:00 PM - 8:00 PM",
      [Fri]: "1:00 PM - 9:00 PM",
      [Sat]: "2:00 PM - 10:00 PM",
    });
    await queryParserAndAssertTimingsCorrect([
      [Sun, 15, 12, Sun, 23, 30],
      [Mon, 9, 0, Mon, 17, 0],
      [Tue, 10, 0, Tue, 18, 0],
      [Wed, 11, 0, Wed, 19, 0],
      [Thur, 12, 0, Thur, 20, 0],
      [Fri, 13, 0, Fri, 21, 0],
      [Sat, 14, 0, Sat, 22, 0],
    ]);
  });
  test("duplicated time string", async () => {
    setUpTimingTest({
      [Sun]: "9:00 AM - 4:00 PM, 9:00 AM - 4:00 PM",
    });
    await queryParserAndAssertTimingsCorrect([[Sun, 9, 0, Sun, 16, 0]]);
  });

  test("gap between time strings", async () => {
    setUpTimingTest({
      [Sun]: "4:00 PM - 9:00 PM, 11:00 AM - 2:00 PM, 3:00 PM - 3:01 PM",
      [Thur]: "7:00 AM - 10:00 PM",
      [Fri]: "11:00 AM - 4:00 PM, 11:00 AM - 4:00 PM",
      [Sat]: "11:00 AM - 2:00 PM, 4:00 PM - 9:00 PM",
    });

    await queryParserAndAssertTimingsCorrect([
      [Sun, 11, 0, Sun, 14, 0],
      [Sun, 15, 0, Sun, 15, 1],
      [Sun, 16, 0, Sun, 21, 0],
      [Thur, 7, 0, Thur, 22, 0],
      [Fri, 11, 0, Fri, 16, 0],
      [Sat, 11, 0, Sat, 14, 0],
      [Sat, 16, 0, Sat, 21, 0],
    ]);
  });
  test("12AM", async () => {
    setUpTimingTest({
      [Mon]: "12:00 AM - 12:00 AM",
      [Tue]: "2:00 AM - 12:00 AM",
      [Wed]: "11:00 AM - 12:00 AM",
    });
    await queryParserAndAssertTimingsCorrect([
      [Mon, 0, 0, Mon, 23, 59],
      [Tue, 2, 0, Tue, 23, 59],
      [Wed, 11, 0, Wed, 23, 59],
    ]);
  });
  test("same and different opening and closing times", async () => {
    setUpTimingTest({
      [Wed]: "8:00 AM - 2:00 PM, 8:00 AM - 4:00 PM",
      [Thur]: "8:00 AM - 4:00 PM, 8:00 AM - 2:00 PM",
      [Fri]: "8:00 AM - 4:00 PM, 9:00 AM - 4:00 PM",
      [Sat]: "9:00 AM - 4:00 PM, 8:00 AM - 4:00 PM",
    });
    await queryParserAndAssertTimingsCorrect([
      [Wed, 8, 0, Wed, 16, 0],
      [Thur, 8, 0, Thur, 16, 0],
      [Fri, 8, 0, Fri, 16, 0],
      [Sat, 8, 0, Sat, 16, 0],
    ]);
  });

  test("overlapping/self-containing times", async () => {
    setUpTimingTest({
      [Mon]: "8:00 AM - 4:00 PM, 2:00 PM - 9:00 PM",
      [Tue]: "2:00 PM - 9:00 PM, 8:00 AM - 4:00 PM",
      [Wed]: "8:00 AM - 9:00 PM, 2:00 PM - 4:00 PM",
      [Thur]: "2:00 PM - 4:00 PM, 8:00 AM - 9:00 PM",
      [Fri]: "7:00 AM - 4:00 PM, 6:00 AM - 2:00 PM, 7:00 PM - 12:00 AM",
    });
    await queryParserAndAssertTimingsCorrect([
      [Mon, 8, 0, Mon, 21, 0],
      [Tue, 8, 0, Tue, 21, 0],
      [Wed, 8, 0, Wed, 21, 0],
      [Thur, 8, 0, Thur, 21, 0],
      [Fri, 6, 0, Fri, 16, 0],
      [Fri, 19, 0, Fri, 23, 59],
    ]);
  });
});
