import DiningParser from "../src/parser/diningParser";
import { mockAxiosGET } from "./mockAxios";
import { getFileContent } from "./utils";

enum DayOfTheWeek {
  SUNDAY = "SUNDAY",
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
}
export const Mon = DayOfTheWeek.MONDAY,
  Tue = DayOfTheWeek.TUESDAY,
  Wed = DayOfTheWeek.WEDNESDAY,
  Thur = DayOfTheWeek.THURSDAY,
  Fri = DayOfTheWeek.FRIDAY,
  Sat = DayOfTheWeek.SATURDAY,
  Sun = DayOfTheWeek.SUNDAY;

/**
 *
 * @param times [startDay,startHour,startMinute,endDay,endHour,endMinute][] (order matters for input! Sunday comes first)
 * The only reason start and end are bundled into one array is because prettier will autoformat it to two lines otherwise
 */
export async function queryParserAndAssertTimingsCorrect(
  times: [DayOfTheWeek, number, number, DayOfTheWeek, number, number][]
) {
  const parser = new DiningParser();
  const result = await parser.process();
  expect(result.length).toBe(1);
  expect(result[0].times).toEqual(
    times.map((time) => {
      return {
        start: {
          day: mapDayOfWeekToAPIReturnValue(time[0]),
          hour: time[1],
          minute: time[2],
        },
        end: {
          day: mapDayOfWeekToAPIReturnValue(time[3]),
          hour: time[4],
          minute: time[5],
        },
      };
    })
  );
}

function mapDayOfWeekToAPIReturnValue(day: DayOfTheWeek) {
  return (
    {
      [Sun]: 0,
      [Mon]: 1,
      [Tue]: 2,
      [Wed]: 3,
      [Thur]: 4,
      [Fri]: 5,
      [Sat]: 6,
    } satisfies Record<DayOfTheWeek, number>
  )[day];
}

export function setUpTimingTest(
  timeRows: Partial<Record<DayOfTheWeek, string>>
) {
  const fillInHTMLWithTimes = (html: string) => {
    // could be in a for loop, open to changes
    html = html.replace("[MONDAY]", timeRows[Mon] ?? "CLOSED");
    html = html.replace("[TUESDAY]", timeRows[Tue] ?? "CLOSED");
    html = html.replace("[WEDNESDAY]", timeRows[Wed] ?? "CLOSED");
    html = html.replace("[THURSDAY]", timeRows[Thur] ?? "CLOSED");
    html = html.replace("[FRIDAY]", timeRows[Fri] ?? "CLOSED");
    html = html.replace("[SATURDAY]", timeRows[Sat] ?? "CLOSED");
    html = html.replace("[SUNDAY]", timeRows[Sun] ?? "CLOSED");
    return html;
  };
  mockAxiosGET({
    conceptListHTML: getFileContent("html/listconcepts-just-113.html"),
    soupsHTML: getFileContent("html/blank.html"),
    specialsHTML: getFileContent("html/blank.html"),
    conceptHTML: (id) => {
      expect(id).toBe("113");
      return fillInHTMLWithTimes(
        getFileContent("html/concepts/113-tests.html")
      );
    },
  });
}
