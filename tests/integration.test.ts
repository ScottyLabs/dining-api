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
test("ok", () => {});
test("the whole thing, including locationOverwrites", async () => {
  mockAxiosGETMethodWithFilePaths({
    conceptListFilePath: "html/listconcepts.html",
    specialsFilePath: "html/specials.html",
    soupsFilePath: "html/soups.html",
    getConceptFilePath: (conceptId: string) =>
      ["92", "110", "113", "175", "108", "168"].includes(conceptId)
        ? `html/concepts/${conceptId}.html`
        : "html/blank.html",
    serverDate: DateTime.fromObject({
      year: 2024,
      month: 8,
      day: 5,
    }) as DateTime<true>,
  });
  const parser = new DiningParser();
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
    serverDate: DateTime.fromObject({
      year: 2024,
      month: 8,
      day: 5,
    }) as DateTime<true>,
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
    mockAxiosGETMethodWithFilePaths({
      serverDate: DateTime.fromObject({
        year: 2024,
        month: 8,
        day: 5,
      }) as DateTime<true>,
    });
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
      [Tue, 0, 0, 23, 59],
      [Wed, 0, 0, 23, 59],
      [Thur, 0, 0, 23, 59],
      [Fri, 0, 0, 23, 59],
    ]);
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
    await queryParserAndAssertTimingsCorrect([
      [Mon, 0, 0, 23, 59],
      [Tue, 0, 0, 23, 59],
      [Wed, 0, 0, 23, 59],
      [Thur, 0, 0, 23, 59],
      [Fri, 0, 0, 23, 59],
      [Sat, 0, 0, 23, 59],
      [Sun, 0, 0, 23, 59],
    ]);
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
    await queryParserAndAssertTimingsCorrect([
      [Mon, 0, 0, 23, 59],
      [Tue, 0, 0, 23, 59],
      [Wed, 0, 0, 23, 59],
      [Thur, 0, 0, 23, 59],
      [Fri, 0, 0, 23, 59],
      [Sat, 0, 0, 2, 59],
      [Sat, 3, 0, 23, 59],
      [Sun, 0, 0, 23, 59],
    ]);
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
    await queryParserAndAssertTimingsCorrect([
      [Mon, 0, 0, 23, 59],
      [Sun, 0, 0, 23, 59],
    ]);
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
    await queryParserAndAssertTimingsCorrect([
      [Sat, 7, 0, 2, 0],
      [Sun, 1, 0, 17, 0],
    ]);
  });
  test("loop-back time coalescing (wrapping on saturday, but it overlaps with multiple ranges on sunday)", async () => {
    setUpTimingTest({
      [Mon]: "",
      [Tue]: "",
      [Wed]: "",
      [Thur]: "",
      [Fri]: "",
      [Sat]: "7:00 AM - 2:00 AM",
      [Sun]: "12:00 AM - 12:35 AM, 1:00 AM - 5:00 PM", // sunday is represented as 0
    });
    await queryParserAndAssertTimingsCorrect([
      [Sat, 7, 0, 2, 0],
      [Sun, 0, 0, 0, 35],
      [Sun, 1, 0, 17, 0],
    ]);
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
    await queryParserAndAssertTimingsCorrect([
      [Mon, 0, 0, 23, 59],
      [Tue, 0, 0, 23, 59],
      [Wed, 0, 0, 23, 59],
      [Thur, 0, 0, 23, 59],
      [Fri, 0, 0, 23, 59],
      [Sat, 0, 0, 10, 0],
      [Sat, 9, 0, 2, 0],
      [Sun, 0, 0, 23, 59],
    ]); // this should be the default return value if it's open all week
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
    await queryParserAndAssertTimingsCorrect([
      [Mon, 0, 0, 23, 59],
      [Tue, 0, 0, 23, 59],
      [Wed, 0, 0, 23, 59],
      [Thur, 0, 0, 23, 59],
      [Fri, 0, 0, 23, 59],
      [Sat, 0, 0, 10, 0],
      [Sat, 9, 0, 2, 0],
      [Sun, 0, 0, 0, 5],
      [Sun, 0, 10, 23, 59],
    ]); // this should be the default return value if it's open all week
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
    await queryParserAndAssertTimingsCorrect([
      [Thur, 7, 0, 2, 0],
      [Fri, 1, 0, 17, 0],
    ]);
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
      [Wed, 0, 0, 23, 59],
      [Thur, 7, 0, 2, 0],
      [Fri, 1, 0, 17, 0],
      [Sun, 0, 0, 23, 59],
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
    await queryParserAndAssertTimingsCorrect([
      [Sun, 0, 0, 0, 5],
      [Sun, 9, 0, 23, 59],
      [Mon, 0, 0, 3, 5],
      [Mon, 3, 0, 2, 0],
      [Tue, 1, 0, 21, 0],
      [Tue, 21, 1, 23, 59],
      [Tue, 0, 0, 15, 0],
      [Wed, 0, 0, 23, 59],
      [Thur, 0, 0, 23, 59],
      [Fri, 0, 0, 23, 59],
      [Sat, 0, 0, 10, 0],
      [Sat, 9, 0, 7, 5],
    ]);
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
      [Sun, 0, 5, 0, 10],
      [Sun, 9, 0, 23, 59],
      [Mon, 0, 0, 3, 5],
      [Mon, 3, 0, 2, 0],
      [Tue, 1, 0, 21, 0],
      [Tue, 21, 1, 23, 59],
      [Tue, 0, 0, 15, 0],
      [Wed, 0, 0, 23, 59],
      [Thur, 0, 0, 23, 59],
      [Fri, 0, 0, 23, 59],
      [Sat, 0, 0, 10, 0],
      [Sat, 9, 0, 0, 2],
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
      [Thur, 2, 0, 2, 0],
      [Fri, 1, 0, 1, 0],
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
      [Sun, 15, 12, 23, 30],
      [Mon, 9, 0, 17, 0],
      [Tue, 10, 0, 18, 0],
      [Wed, 11, 0, 19, 0],
      [Thur, 12, 0, 20, 0],
      [Fri, 13, 0, 21, 0],
      [Sat, 14, 0, 22, 0],
    ]);
  });
  test("duplicated time string", async () => {
    setUpTimingTest({
      [Sun]: "9:00 AM - 4:00 PM, 9:00 AM - 4:00 PM",
    });
    await queryParserAndAssertTimingsCorrect([
      [Sun, 9, 0, 16, 0],
      [Sun, 9, 0, 16, 0],
    ]); // we keep all duplicates as-is now
  });

  test("gap between time strings", async () => {
    setUpTimingTest({
      [Sun]: "4:00 PM - 9:00 PM, 11:00 AM - 2:00 PM, 3:00 PM - 3:01 PM",
      [Thur]: "7:00 AM - 10:00 PM",
      [Fri]: "11:00 AM - 4:00 PM, 11:00 AM - 4:00 PM",
      [Sat]: "11:00 AM - 2:00 PM, 4:00 PM - 9:00 PM",
    });

    await queryParserAndAssertTimingsCorrect([
      [Sun, 11, 0, 14, 0],
      [Sun, 15, 0, 15, 1],
      [Sun, 16, 0, 21, 0],
      [Thur, 7, 0, 22, 0],
      [Fri, 11, 0, 16, 0],
      [Fri, 11, 0, 16, 0],
      [Sat, 11, 0, 14, 0],
      [Sat, 16, 0, 21, 0],
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
      [Mon, 0, 0, 23, 59],
      [Tue, 2, 0, 23, 59],
      [Wed, 11, 0, 23, 59],
      [Thur, 18, 0, 23, 59],
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
      [Wed, 8, 0, 16, 0],
      [Wed, 8, 0, 14, 0],
      [Thur, 8, 0, 16, 0],
      [Thur, 8, 0, 14, 0],
      [Fri, 8, 0, 16, 0],
      [Fri, 9, 0, 16, 0],
      [Sat, 9, 0, 16, 0],
      [Sat, 8, 0, 16, 0],
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
      [Mon, 8, 0, 16, 0],
      [Mon, 14, 0, 21, 0],
      [Tue, 14, 0, 21, 0],
      [Tue, 8, 0, 16, 0],
      [Wed, 8, 0, 21, 0],
      [Wed, 14, 0, 16, 0],
      [Thur, 14, 0, 16, 0],
      [Thur, 8, 0, 21, 0],
      [Fri, 7, 0, 16, 0],
      [Fri, 6, 0, 14, 0],
      [Fri, 19, 0, 23, 59],
    ]);
  });
  test("partial all day", async () => {
    setUpTimingTest({
      [Wed]: "open 24 hours",
      [Thur]: "open 24 hours",
      [Fri]: "open 24 hours",
    });
    await queryParserAndAssertTimingsCorrect([
      [Wed, 0, 0, 23, 59],
      [Thur, 0, 0, 23, 59],
      [Fri, 0, 0, 23, 59],
    ]);
  });
  test("partial all day, over the weekend", async () => {
    setUpTimingTest({
      [Sat]: "open 24 hours",
      [Sun]: "open 24 hours",
      [Mon]: "open 24 hours",
    });
    await queryParserAndAssertTimingsCorrect([
      [Sat, 0, 0, 23, 59],
      [Sun, 0, 0, 23, 59],
      [Mon, 0, 0, 23, 59],
    ]);
  });
  test("partial all day, over the weekend", async () => {
    setUpTimingTest({
      [Sat]: "7:00 AM - 12:01 AM",
      [Sun]: "open 24 hours",
      [Mon]: "open 24 hours",
    });
    await queryParserAndAssertTimingsCorrect([
      [Sat, 7, 0, 0, 1],
      [Sun, 0, 0, 23, 59],
      [Mon, 0, 0, 23, 59],
    ]);
  });
  test("another one", async () => {
    setUpTimingTest({
      [Sat]: "7:00 AM - 12:01 AM",
    });
    await queryParserAndAssertTimingsCorrect([[Sat, 7, 0, 0, 1]]);
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
    await queryParserAndAssertTimingsCorrect([
      [Mon, 0, 0, 23, 59],
      [Mon, 2, 0, 3, 0],
    ]);
  });
});
