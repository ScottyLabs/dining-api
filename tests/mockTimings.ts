import { DateTime } from "luxon";
import DiningParser from "../src/parser/diningParser";
import { mockAxiosGETMethod } from "./mockAxios";
import { getFileContent } from "./utils";
import { IFullTimeRange } from "types";

export const Mon = 1,
  Tue = 2,
  Wed = 3,
  Thur = 4,
  Fri = 5,
  Sat = 6,
  Sun = 0;

function _sort(a: IFullTimeRange, b: IFullTimeRange) {
  if (a.day !== b.day) return a.day - b.day;
  if (a.startMinutesFromMidnight !== b.startMinutesFromMidnight)
    return a.startMinutesFromMidnight - b.startMinutesFromMidnight;
  return a.endMinutesFromMidnight - b.endMinutesFromMidnight;
}
/**
 *
 * @param times [startDay,startHour,startMinute,endDay,endHour,endMinute][] (order matters for input! Sunday comes first)
 * @param parser In case you want to pass in a custom parser with overwrites or something. If nothing is passed in, a default parser is assumed
 * The only reason start and end are bundled into one array is because prettier will autoformat it to two lines otherwise
 */
export async function queryParserAndAssertTimingsCorrect(
  times: [number, number, number, number, number][],
  parser?: DiningParser
) {
  const result = await (parser ?? new DiningParser()).process();
  const rootDay = DateTime.fromObject({ year: 2024, month: 9, day: 9 });
  expect(result.length).toBe(1);
  expect(result[0]!.times.sort(_sort)).toStrictEqual(
    times
      .map((time) => {
        const day = rootDay.plus({ days: (time[0] - Mon + 7) % 7 });
        return {
          year: day.year,
          month: day.month,
          day: day.day,
          startMinutesFromMidnight: time[1] * 60 + time[2],
          endMinutesFromMidnight: time[3] * 60 + time[4],
        };
      })
      .sort(_sort)
  );
}

export function setUpTimingTest(timeRows: Record<number, string>) {
  const fillInHTMLWithTimes = (html: string) => {
    html = html
      .replace("[MONDAY]", timeRows[Mon] ?? "CLOSED")
      .replace("[TUESDAY]", timeRows[Tue] ?? "CLOSED")
      .replace("[WEDNESDAY]", timeRows[Wed] ?? "CLOSED")
      .replace("[THURSDAY]", timeRows[Thur] ?? "CLOSED")
      .replace("[FRIDAY]", timeRows[Fri] ?? "CLOSED")
      .replace("[SATURDAY]", timeRows[Sat] ?? "CLOSED")
      .replace("[SUNDAY]", timeRows[Sun] ?? "CLOSED");
    return html;
  };
  mockAxiosGETMethod({
    conceptListHTML: getFileContent("html/listconcepts-just-113.html"),
    soupsHTML: getFileContent("html/blank.html"),
    specialsHTML: getFileContent("html/blank.html"),
    conceptHTML: (id) => {
      expect(id).toBe("113");
      return fillInHTMLWithTimes(
        getFileContent("html/concepts/113-tests.html")
      );
    },
    serverDate: DateTime.fromObject({
      year: 2024,
      month: 9,
      day: 9,
    }) as DateTime<true>, // this was the date when the test page was scraped
  });
}

/**
 * concept id is 113
 * @param data
 * @param serverDate (time the server "processed" the request. This value matters for overwrite times)
 */
export function setUpArbitraryTest(
  data: [
    [string, string, string],
    [string, string, string],
    [string, string, string],
    [string, string, string],
    [string, string, string],
    [string, string, string],
    [string, string, string]
  ],
  serverDate: DateTime
) {
  const fillInHtml = (html: string) => {
    const A_CHAR_CODE = "A".charCodeAt(0);
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 3; j++) {
        const square = `[${String.fromCharCode(A_CHAR_CODE + i)}${j + 1}]`;
        html = html.replace(square, data[i]![j]!);
      }
    }
    return html;
  };
  mockAxiosGETMethod({
    conceptListHTML: getFileContent("html/listconcepts-just-113.html"),
    soupsHTML: getFileContent("html/blank.html"),
    specialsHTML: getFileContent("html/blank.html"),
    conceptHTML: (id) => {
      expect(id).toBe("113");
      return fillInHtml(
        getFileContent("html/concepts/113-completely-customizable.html")
      );
    },
    serverDate,
  });
}
