import locationCoordinateOverwrites from "overwrites/locationCoordinateOverwrites";
import DiningParser from "../src/parser/diningParser";

import { expectedLocationData } from "./expectedData";
import { mockAxiosGETMethodWithFilePaths } from "./mockAxios";
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
  setUpArbitraryTest,
} from "./mockTimings";
import { DateTime } from "luxon";

jest.mock("axios");

test("the whole thing, including locationOverwrites", async () => {
  mockAxiosGETMethodWithFilePaths({
    conceptListFilePath: "html/listconcepts.html",
    specialsFilePath: "html/specials.html",
    soupsFilePath: "html/soups.html",
    getConceptFilePath: (conceptId: string) =>
      ["92", "110", "113", "175", "108", "168"].includes(conceptId) // note that location 168 does not have a location overwrite and thus uses the one provided on the page
        ? `html/concepts/${conceptId}.html`
        : "html/blank.html",
  });
  const parser = new DiningParser({
    locationCoordinateOverwrites: locationCoordinateOverwrites,
  });
  const parsedLocationData = await parser.process();
  expect(parsedLocationData).toStrictEqual(expectedLocationData);
});
test("specials for The Exchange", async () => {
  mockAxiosGETMethodWithFilePaths({
    conceptListFilePath: "html/listconcepts.html",
    specialsFilePath: "html/specials-for-92.html",
    soupsFilePath: "html/soups.html",
    getConceptFilePath: (conceptId: string) =>
      ["92", "110", "113", "175", "108"].includes(conceptId)
        ? `html/concepts/${conceptId}.html`
        : "html/blank.html",
  });
  const parser = new DiningParser();
  expect((await parser.process()).map((data) => data.todaysSpecials)).toEqual(
    expect.arrayContaining([
      [
        {
          title: "BYOBurger with Cole Slaw and Fries",
          description: "We Build it Just the way you LOVE it",
        },
        {
          title: "Sopa de Fideo Pasta",
          description:
            "Linguine Pasta Browned and Finished with a Salsa Style Tomato Sauce VEGETARIAN",
        },
        {
          title: "BBQ Chicken with Fries and Cole Slaw",
          description: "YUM YUM YUM!!!",
        },
      ],
    ])
  );
});

test(
  "parser throws on repeated axios error",
  async () => {
    mockAxiosGETMethodWithFilePaths({});
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
    await queryParserAndAssertTimingsCorrect([[Tue, 0, 0, Fri, 23, 59]]);
  });
  test("all day every day", async () => {
    setUpTimingTest({
      [Mon]: "OPEN 24 HOURS",
      [Tue]: "OPEN 24 HOURS",
      [Wed]: "OPEN 24 HRS",
      [Thur]: "24 hRs",
      [Fri]: "24 hours",
      [Sat]: "24 hours",
      [Sun]: "24 hours",
    });
    await queryParserAndAssertTimingsCorrect([[Sun, 0, 0, Sat, 23, 59]]); // this is the reason why we leave the other return type that represents open every day as this. (backwards compatibility, mostly)
  });
  test("all day every day but slightly different", async () => {
    setUpTimingTest({
      [Mon]: "OPEN 24 HOURS",
      [Tue]: "OPEN 24 HOURS",
      [Wed]: "OPEN 24 HRS",
      [Thur]: "12:00 AM - 11:59 PM",
      [Fri]: "24 hours",
      [Sat]: "12:00 AM - 2:59 AM, 3:00 AM - 11:59 PM",
      [Sun]: "24 hours",
    });
    await queryParserAndAssertTimingsCorrect([[Sun, 0, 0, Sat, 23, 59]]);
  });
  test("empty string", async () => {
    setUpTimingTest({
      [Mon]: "OPEN 24 HOURS",
      [Tue]: "",
      [Wed]: "",
      [Thur]: "",
      [Fri]: "",
      [Sat]: "",
      [Sun]: "24 hours",
    });
    await queryParserAndAssertTimingsCorrect([[Sun, 0, 0, Mon, 23, 59]]);
  });
  test("loop-back time coalescing (wrapping on saturday, but it overlaps with sunday)", async () => {
    setUpTimingTest({
      [Mon]: "",
      [Tue]: "",
      [Wed]: "",
      [Thur]: "",
      [Fri]: "",
      [Sat]: "7:00 AM - 2:00 AM",
      [Sun]: "1:00 AM - 5:00 PM", // sunday is represented as 0
    });
    await queryParserAndAssertTimingsCorrect([[Sat, 7, 0, Sun, 17, 0]]);
  });
  test("loop-back time coalescing (wrapping on saturday, but it overlaps with multiple ranges on sunday)", async () => {
    setUpTimingTest({
      [Mon]: "",
      [Tue]: "",
      [Wed]: "",
      [Thur]: "",
      [Fri]: "",
      [Sat]: "7:00 AM - 2:00 AM",
      [Sun]: "12:00AM - 12:35 AM, 1:00 AM - 5:00 PM", // sunday is represented as 0
    });
    await queryParserAndAssertTimingsCorrect([[Sat, 7, 0, Sun, 17, 0]]);
  });
  test("open all week, gone wrong", async () => {
    setUpTimingTest({
      [Sun]: "OPEN 24 HOURS",
      [Mon]: "OPEN 24 HOURS",
      [Tue]: "OPEN 24 HOURS",
      [Wed]: "OPEN 24 HOURS",
      [Thur]: "OPEN 24 HOURS",
      [Fri]: "OPEN 24 HOURS",
      [Sat]: "12:00 AM - 10:00 AM, 9:00 AM - 2:00 AM",
    });
    await queryParserAndAssertTimingsCorrect([[Sun, 0, 0, Sat, 23, 59]]); // this should be the default return value if it's open all week
  });
  test("open all week, gone wrong", async () => {
    setUpTimingTest({
      [Sun]: "12:00 AM - 12:05 AM, 12:10 AM - 11:59 PM",
      [Mon]: "OPEN 24 HOURS",
      [Tue]: "OPEN 24 HOURS",
      [Wed]: "OPEN 24 HOURS",
      [Thur]: "OPEN 24 HOURS",
      [Fri]: "OPEN 24 HOURS",
      [Sat]: "12:00 AM - 10:00 AM, 9:00 AM - 2:00 AM",
    });
    await queryParserAndAssertTimingsCorrect([[Sun, 0, 0, Sat, 23, 59]]); // this should be the default return value if it's open all week
  });
  test("wrapping on thursday, but it overlaps with friday", async () => {
    setUpTimingTest({
      [Mon]: "",
      [Tue]: "",
      [Wed]: "",
      [Thur]: "7:00 AM - 2:00 AM",
      [Fri]: "1:00 AM - 5:00 PM",
      [Sat]: "",
      [Sun]: "",
    });
    await queryParserAndAssertTimingsCorrect([[Thur, 7, 0, Fri, 17, 0]]);
  });
  test("some combination of wrap-around", async () => {
    setUpTimingTest({
      [Mon]: "",
      [Tue]: "",
      [Wed]: "open 24 hours",
      [Thur]: "7:00 AM - 2:00 AM",
      [Fri]: "1:00 AM - 5:00 PM",
      [Sat]: "",
      [Sun]: "open 24 hours",
    });
    await queryParserAndAssertTimingsCorrect([
      [Sun, 0, 0, Sun, 23, 59],
      [Wed, 0, 0, Wed, 23, 59],
      [Thur, 7, 0, Fri, 17, 0],
    ]);
  });
  test("open nearly all week, but Dining Services has truly lost it", async () => {
    setUpTimingTest({
      [Sun]: "12:00 AM - 12:05 AM, 9:00 AM - 11:59 PM",
      [Mon]: "12:00 AM - 3:05 AM, 3:00 AM - 2:00 AM",
      [Tue]: "1:00 AM - 9:00 PM, 9:01 PM - 12:00 AM, 12:00 AM - 3:00 PM",
      [Wed]: "OPEN 24 HOURS",
      [Thur]: "OPEN 24 HOURS",
      [Fri]: "OPEN 24 HOURS, mooo",
      [Sat]: "12:00 AM - 10:00 AM, 9:00 AM - 7:05 AM",
    });
    await queryParserAndAssertTimingsCorrect([[Sun, 9, 0, Sun, 7, 5]]);
  }); // tests literally everything
  test("open nearly all week, but Dining Services has truly lost it", async () => {
    setUpTimingTest({
      [Sun]: "12:05 AM - 12:10 AM, 9:00 AM - 11:59 PM",
      [Mon]: "12:00 AM - 3:05 AM, 3:00 AM - 2:00 AM",
      [Tue]: "1:00 AM - 9:00 PM, 9:01 PM - 12:00 AM, 12:00 AM - 3:00 PM",
      [Wed]: "OPEN 24 HOURS",
      [Thur]: "OPEN 24 HOURS",
      [Fri]: "OPEN 24 HOURS, mooo",
      [Sat]: "12:00 AM - 10:00 AM, 9:00 AM - 12:02 AM",
    });
    await queryParserAndAssertTimingsCorrect([
      [Sun, 0, 5, Sun, 0, 10],
      [Sun, 9, 0, Sun, 0, 2],
    ]);
  }); // tests literally everything
  test("degenerate open times", async () => {
    setUpTimingTest({
      [Mon]: "",
      [Tue]: "",
      [Wed]: "",
      [Thur]: "2:00 AM - 2:00 AM",
      [Fri]: "1:00 AM - 1:00 AM",
      [Sat]: "",
      [Sun]: "",
    });
    await queryParserAndAssertTimingsCorrect([
      [Thur, 2, 0, Thur, 2, 0],
      [Fri, 1, 0, Fri, 1, 0],
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
  test("12AM (tests the 12:00 AM -> 11:59 PM shift)", async () => {
    setUpTimingTest({
      [Mon]: "12:00 AM - 12:00 AM",
      [Tue]: "2:00 AM - 12:00 AM",
      [Wed]: "11:00 AM - 12:00 AM",
      [Thur]: "6:00 PM - 12:00 AM",
    });
    await queryParserAndAssertTimingsCorrect([
      [Mon, 0, 0, Mon, 23, 59],
      [Tue, 2, 0, Tue, 23, 59],
      [Wed, 11, 0, Wed, 23, 59],
      [Thur, 18, 0, Thur, 23, 59],
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
  test("partial all day", async () => {
    setUpTimingTest({
      [Wed]: "open 24 hours",
      [Thur]: "open 24 hours",
      [Fri]: "open 24 hours",
    });
    await queryParserAndAssertTimingsCorrect([[Wed, 0, 0, Fri, 23, 59]]);
  });
  test("partial all day, over the weekend", async () => {
    setUpTimingTest({
      [Sat]: "open 24 hours",
      [Sun]: "open 24 hours",
      [Mon]: "open 24 hours",
    });
    await queryParserAndAssertTimingsCorrect([[Sat, 0, 0, Mon, 23, 59]]);
  });
  test("partial all day, over the weekend", async () => {
    setUpTimingTest({
      [Sat]: "7:00 AM - 12:01 AM",
      [Sun]: "open 24 hours",
      [Mon]: "open 24 hours",
    });
    await queryParserAndAssertTimingsCorrect([[Sat, 7, 0, Mon, 23, 59]]);
  });
  test("another one", async () => {
    setUpTimingTest({
      [Sat]: "7:00 AM - 12:01 AM",
    });
    await queryParserAndAssertTimingsCorrect([[Sat, 7, 0, Sun, 0, 1]]);
  });
  test("unparseable token", async () => {
    setUpTimingTest({
      [Mon]: "mooooo",
    });
    await queryParserAndAssertTimingsCorrect([]);
  });
  test("24 hours should override other times", async () => {
    setUpTimingTest({
      [Mon]: "OPEN 24 HOURS, 2:00 AM - 3:00 AM",
    });
    await queryParserAndAssertTimingsCorrect([[Mon, 0, 0, Mon, 23, 59]]);
  });
});

describe("test time overwrites", () => {
  test("no overwrites, more-so testing setUpArbitraryTest functionality", async () => {
    setUpArbitraryTest(
      [
        ["Friday", "August 22", "7:00 AM - 9:00 PM"],
        ["Saturday", "August 23", "7:00 AM - 9:00 PM"],
        ["Sunday", "August 24", "7:00 AM - 9:00 PM"],
        ["Monday", "August 25", "7:00 AM - 9:00 PM"],
        ["Tuesday", "August 26", "7:00 AM - 9:00 PM"],
        ["Wednesday", "August 27", "7:00 AM - 9:00 PM"],
        ["Thursday", "August 28", "7:00 AM - 9:00 PM"],
      ],
      DateTime.fromObject({ year: 2025, month: 8, day: 22 })
    );
    const diningParser = new DiningParser();
    await queryParserAndAssertTimingsCorrect(
      [
        [Sun, 7, 0, Sun, 21, 0],
        [Mon, 7, 0, Mon, 21, 0],
        [Tue, 7, 0, Tue, 21, 0],
        [Wed, 7, 0, Wed, 21, 0],
        [Thur, 7, 0, Thur, 21, 0],
        [Fri, 7, 0, Fri, 21, 0],
        [Sat, 7, 0, Sat, 21, 0],
      ],
      diningParser
    );
  });
  test("basic", async () => {
    setUpArbitraryTest(
      [
        ["Friday", "August 22", "7:00 AM - 9:00 PM"],
        ["Saturday", "August 23", "7:00 AM - 9:00 PM"],
        ["Sunday", "August 24", "7:00 AM - 9:00 PM"],
        ["Monday", "August 25", "7:00 AM - 9:00 PM"],
        ["Tuesday", "August 26", "7:00 AM - 9:00 PM"],
        ["Wednesday", "August 27", "7:00 AM - 9:00 PM"],
        ["Thursday", "August 28", "7:00 AM - 9:00 PM"],
      ],
      DateTime.fromObject({ year: 2025, month: 8, day: 22 })
    );
    const diningParser = new DiningParser({
      timeSlotOverwrites: {
        113: {
          "8/23/25": ["CLOSED"],
        },
      },
    });
    await queryParserAndAssertTimingsCorrect(
      [
        [Sun, 7, 0, Sun, 21, 0],
        [Mon, 7, 0, Mon, 21, 0],
        [Tue, 7, 0, Tue, 21, 0],
        [Wed, 7, 0, Wed, 21, 0],
        [Thur, 7, 0, Thur, 21, 0],
        [Fri, 7, 0, Fri, 21, 0],
      ],
      diningParser
    );
  });
  test("basic", async () => {
    setUpArbitraryTest(
      [
        ["Friday", "August 22", "7:00 AM - 9:00 PM"],
        ["Saturday", "August 23", "7:00 AM - 9:00 PM"],
        ["Sunday", "August 24", "7:00 AM - 9:00 PM"],
        ["Monday", "August 25", "7:00 AM - 9:00 PM"],
        ["Tuesday", "August 26", "7:00 AM - 9:00 PM"],
        ["Wednesday", "August 27", "7:00 AM - 9:00 PM"],
        ["Thursday", "August 28", "7:00 AM - 9:00 PM"],
      ],
      DateTime.fromObject({ year: 2025, month: 8, day: 22 })
    );
    const diningParser = new DiningParser({
      timeSlotOverwrites: {
        113: {
          "8/23/25": ["2:00 AM - 3:00 AM"],
        },
      },
    });
    await queryParserAndAssertTimingsCorrect(
      [
        [Sun, 7, 0, Sun, 21, 0],
        [Mon, 7, 0, Mon, 21, 0],
        [Tue, 7, 0, Tue, 21, 0],
        [Wed, 7, 0, Wed, 21, 0],
        [Thur, 7, 0, Thur, 21, 0],
        [Fri, 7, 0, Fri, 21, 0],
        [Sat, 2, 0, Sat, 3, 0],
      ],
      diningParser
    );
  });
  test("overwrite everything", async () => {
    setUpArbitraryTest(
      [
        ["Friday", "August 22", "7:00 AM - 9:00 PM"],
        ["Saturday", "August 23", "7:00 AM - 9:00 PM"],
        ["Sunday", "August 24", "7:00 AM - 9:00 PM"],
        ["Monday", "August 25", "7:00 AM - 9:00 PM"],
        ["Tuesday", "August 26", "7:00 AM - 9:00 PM"],
        ["Wednesday", "August 27", "7:00 AM - 9:00 PM"],
        ["Thursday", "August 28", "7:00 AM - 9:00 PM"],
      ],
      DateTime.fromObject({ year: 2025, month: 8, day: 22 })
    );
    const diningParser = new DiningParser({
      timeSlotOverwrites: {
        113: {
          "8/22/25": ["2:00 AM - 3:00 AM"],
          "8/23/25": ["2:00 AM - 3:00 AM"],
          "8/24/25": ["2:00 AM - 3:00 AM"],
          "8/25/25": ["2:00 AM - 3:00 AM"],
          "8/26/25": ["2:00 AM - 3:00 AM"],
          "8/27/25": ["2:00 AM - 3:00 AM"],
          "8/28/25": ["2:00 AM - 3:00 AM"],
        },
      },
    });
    await queryParserAndAssertTimingsCorrect(
      [
        [Sun, 2, 0, Sun, 3, 0],
        [Mon, 2, 0, Mon, 3, 0],
        [Tue, 2, 0, Tue, 3, 0],
        [Wed, 2, 0, Wed, 3, 0],
        [Thur, 2, 0, Thur, 3, 0],
        [Fri, 2, 0, Fri, 3, 0],
        [Sat, 2, 0, Sat, 3, 0],
      ],
      diningParser
    );
  });
  test("overwrite with coalescing", async () => {
    setUpArbitraryTest(
      [
        ["Friday", "August 22", "7:00 AM - 9:00 PM"],
        ["Saturday", "August 23", "7:00 AM - 9:00 PM"],
        ["Sunday", "August 24", "7:00 AM - 9:00 PM"],
        ["Monday", "August 25", "7:00 AM - 9:00 PM"],
        ["Tuesday", "August 26", "7:00 AM - 9:00 PM"],
        ["Wednesday", "August 27", "7:00 AM - 9:00 PM"],
        ["Thursday", "August 28", "7:00 AM - 9:00 PM"],
      ],
      DateTime.fromObject({ year: 2025, month: 8, day: 22 })
    );
    const diningParser = new DiningParser({
      timeSlotOverwrites: {
        113: {
          "8/23/25": ["11:00 AM - 10:00 AM"],
        },
      },
    });
    await queryParserAndAssertTimingsCorrect(
      [
        [Mon, 7, 0, Mon, 21, 0],
        [Tue, 7, 0, Tue, 21, 0],
        [Wed, 7, 0, Wed, 21, 0],
        [Thur, 7, 0, Thur, 21, 0],
        [Fri, 7, 0, Fri, 21, 0],
        [Sat, 11, 0, Sun, 21, 0],
      ],
      diningParser
    );
  });
  test("overwrite everything, into the New Years", async () => {
    setUpArbitraryTest(
      [
        ["Tuesday", "December 30", "7:00 AM - 9:00 PM"],
        ["Wednesday", "December 31", "7:00 AM - 9:00 PM"],
        ["Thursday", "January 1", "7:00 AM - 9:00 PM"],
        ["Friday", "January 2", "7:00 AM - 9:00 PM"],
        ["Saturday", "January 3", "7:00 AM - 9:00 PM"],
        ["Sunday", "January 4", "7:00 AM - 9:00 PM"],
        ["Monday", "January 5", "7:00 AM - 9:00 PM"],
      ],
      DateTime.fromObject({ year: 2025, month: 12, day: 30 })
    );
    const diningParser = new DiningParser({
      timeSlotOverwrites: {
        113: {
          "8/23/25": ["2:00 AM - 10:00 AM"],
          "12/30/25": ["2:00 AM - 10:00 AM"],
          "12/31/25": ["2:00 AM - 10:00 AM"],
          "1/1/26": ["2:00 AM - 10:00 AM"], // typing this date just gave me an existential crisis. Thanks a lot.
          "1/2/26": ["2:00 AM - 10:00 AM"],
          "1/3/26": ["2:00 AM - 10:00 AM"],
          "1/4/26": ["2:00 AM - 10:00 AM"],
          "1/5/26": ["2:00 AM - 10:00 AM"],
        },
      },
    });
    await queryParserAndAssertTimingsCorrect(
      [
        [Sun, 2, 0, Sun, 10, 0],
        [Mon, 2, 0, Mon, 10, 0],
        [Tue, 2, 0, Tue, 10, 0],
        [Wed, 2, 0, Wed, 10, 0],
        [Thur, 2, 0, Thur, 10, 0],
        [Fri, 2, 0, Fri, 10, 0],
        [Sat, 2, 0, Sat, 10, 0],
      ],
      diningParser
    );
  });
});
