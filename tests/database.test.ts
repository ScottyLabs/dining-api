import {
  addLocationDataToDb,
  addTimeOverride,
  addWeeklyTimeOverride,
} from "db/updateLocation";
import { getAllLocationsFromDB } from "db/getLocations";
import { DateTime } from "luxon";
import { ILocation } from "types";
import { overwritesTable } from "db/schema";
import { dbTest } from "./dbstub";

/** Something that you can get from DiningParser */
const locationIn: ILocation = {
  name: "dbTest",
  acceptsOnlineOrders: false,
  conceptId: 1,
  coordinates: { lat: 1, lng: 10 },
  description: "description",
  today: {
    year: 2025,
    month: 1,
    day: 1,
  },
  times: [],
  location: "location",
  menu: "menu",
  shortDescription: "hi",
  url: "https://hi.com",
  todaysSoups: [],
  todaysSpecials: [],
};

/** What getAllLocations() returns when `locationIn` has been added to the db */
const locationOut = {
  id: "DYNAMICALLY GENERATED, replace with real id",
  name: "dbTest",
  shortDescription: "hi",
  description: "description",
  url: "https://hi.com",
  menu: "menu",
  location: "location",
  coordinateLat: 1,
  coordinateLng: 10,
  acceptsOnlineOrders: false,
  times: [],
  todaysSoups: [],
  todaysSpecials: [],
  conceptId: "1",
};

describe("general location insertion tests", () => {
  dbTest.concurrent("works on basic insertion", async ({ ctx: { db } }) => {
    const id = await addLocationDataToDb(db, locationIn);
    const dbResult = await getAllLocationsFromDB(db, DateTime.now());
    expect(dbResult).toEqual([{ ...locationOut, id }]);
  });
  dbTest.concurrent(
    "properly resets state on every new dbTest",
    async ({ ctx: { db } }) => {
      expect(await getAllLocationsFromDB(db, DateTime.now())).toEqual([]);
    },
  );
  dbTest.concurrent(
    "works on insertion with times",
    async ({ ctx: { db } }) => {
      const id = await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 1,
        },
        times: [
          parseTime("1/1/25", "5:00 am", "12:00 pm"),
          parseTime("1/1/25", "5:00 am", "12:00 pm"),
          parseTime("1/1/25", "2:00 pm", "2:00 am"),
          parseTime("7/7/25", "2:00 pm", "2:00 am"),
        ],
      });
      const dbResult = await getAllLocationsFromDB(db, parseDate("1/2/25"));
      expect(dbResult).toEqual([
        {
          ...locationOut,
          id: id,
          times: [
            {
              start: timeToUnixTimestamp("1/1/25 5:00 AM"),
              end: timeToUnixTimestamp("1/1/25 12:00 PM"),
            },
            {
              start: timeToUnixTimestamp("1/1/25 2:00 PM"),
              end: timeToUnixTimestamp("1/2/25 2:00 AM"),
            },
            {
              start: timeToUnixTimestamp("7/7/25 2:00 PM"),
              end: timeToUnixTimestamp("7/8/25 2:00 AM"),
            },
          ],
        },
      ]);
    },
  );
  dbTest.concurrent(
    "works on insertion with times (tests search window)",
    async ({ ctx: { db } }) => {
      const id = await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 1,
        },
        times: [
          parseTime("1/1/25", "5:00 am", "12:00 pm"),
          parseTime("1/1/25", "5:00 am", "12:00 pm"),
          parseTime("1/1/25", "2:00 pm", "2:00 am"),
        ],
      });
      const dbResult = await getAllLocationsFromDB(
        db,
        parseDate("1/3/25"), // 2 days after latest time
      );
      expect(dbResult).toEqual([
        {
          ...locationOut,
          id: id,

          times: [],
        },
      ]);
    },
  );
  dbTest.concurrent(
    "works on insertion with times (tests search window)",
    async ({ ctx: { db } }) => {
      const id = await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 1,
        },
        times: [
          parseTime("1/1/25", "5:00 am", "12:00 pm"),
          parseTime("2/1/25", "5:00 am", "12:00 pm"),
        ],
      });
      const dbResult = await getAllLocationsFromDB(
        db,
        parseDate("1/3/25"), // 2 days after latest time
      );
      expect(dbResult).toEqual([
        {
          ...locationOut,
          id: id,
          times: [
            {
              start: timeToUnixTimestamp("2/1/25 5:00 AM"),
              end: timeToUnixTimestamp("2/1/25 12:00 PM"),
            },
          ],
        },
      ]);
    },
  );
  dbTest.concurrent(
    "works on insertion with times (DST - start 2AM -> 3AM) (3/9/25)",
    async ({ ctx: { db } }) => {
      const id = await addLocationDataToDb(db, {
        ...locationIn,
        times: [parseTime("3/9/25", "5:00 am", "12:00 pm")],
      });
      const dbResult = await getAllLocationsFromDB(db, parseDate("1/3/25"));
      expect(dbResult).toEqual([
        {
          ...locationOut,
          id: id,
          times: [
            {
              start: timeToUnixTimestamp("3/9/25 5:00 AM"),
              end: timeToUnixTimestamp("3/9/25 12:00 PM"),
            },
          ],
        },
      ]);
    },
  );
  dbTest.concurrent(
    "works on insertion with times (DST - start 2AM -> 3AM) (3/9/25)",
    async ({ ctx: { db } }) => {
      const id = await addLocationDataToDb(db, {
        ...locationIn,
        times: [parseTime("3/9/25", "2:30 am", "12:00 pm")], // 2:30 technically doesn't exist on that day
      });
      const dbResult = await getAllLocationsFromDB(db, parseDate("1/3/25"));
      expect(dbResult).toEqual([
        {
          ...locationOut,
          id: id,
          times: [
            {
              start: timeToUnixTimestamp("3/9/25 3:30 AM"), // 3:30 AM... this is certainly some behavior...
              end: timeToUnixTimestamp("3/9/25 12:00 PM"),
            },
          ],
        },
      ]);
    },
  );
  dbTest.concurrent(
    "works on insertion with times (DST - start 2AM -> 3AM) (3/9/25)",
    async ({ ctx: { db } }) => {
      const id = await addLocationDataToDb(db, {
        ...locationIn,
        times: [parseTime("3/8/25", "2:30 am", "2:15 am")], // 2:15 technically doesn't exist on that day
      });
      const dbResult = await getAllLocationsFromDB(db, parseDate("1/3/25"));
      expect(dbResult).toEqual([
        {
          ...locationOut,
          id: id,
          times: [
            {
              start: timeToUnixTimestamp("3/8/25 2:30 AM"), // 3:30 AM... this is certainly some behavior...
              end: timeToUnixTimestamp("3/9/25 3:15 AM"),
            },
          ],
        },
      ]);
    },
  );
  dbTest.concurrent(
    "works on insertion with times (DST - end 2AM -> 1AM) (11/2/25) [if a place closes at 2 AM, we assume it's the second 2AM (I mean, the first 2AM technically doesn't exist...)",
    async ({ ctx: { db } }) => {
      const id = await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 1,
        },
        times: [parseTime("11/1/25", "7:00 am", "2:00 am")],
      });
      const dbResult = await getAllLocationsFromDB(db, parseDate("1/3/25"));
      expect(dbResult).toEqual([
        {
          ...locationOut,
          id: id,
          times: [
            {
              start: timeToUnixTimestamp("11/1/25 7:00 AM"),
              end: timeToUnixTimestamp("11/2/25 2:00 AM"), // the second 2AM
            },
          ],
        },
      ]);
    },
  );
  dbTest.concurrent(
    "works on insertion with times (DST - end 2AM -> 1AM) (11/2/25) [if a place closes at 1:30 AM, we assume dbTest's the first 1:30 AM and not the second]",
    async ({ ctx: { db } }) => {
      const id = await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 1,
        },
        times: [parseTime("11/1/25", "7:00 am", "1:30 am")],
      });
      const dbResult = await getAllLocationsFromDB(db, parseDate("1/3/25"));
      expect(dbResult).toEqual([
        {
          ...locationOut,
          id: id,
          times: [
            {
              start: timeToUnixTimestamp("11/1/25 7:00 AM"),
              end: 1762061400000, // the first 1:30 AM EDT (timeToUnixTimestamp would give the second 1:30 AM EST due to DST fallback)
            },
          ],
        },
      ]);
    },
  );
  dbTest.concurrent("works on specials", async ({ ctx: { db } }) => {
    const id = await addLocationDataToDb(db, {
      ...locationIn,
      today: {
        year: 2025,
        month: 1,
        day: 1,
      },
      times: [
        parseTime("1/1/25", "5:00 am", "12:00 pm"),
        parseTime("1/1/25", "2:00 pm", "2:00am"),
      ],
      todaysSoups: [
        { title: "soup 1", description: "desc 1" },
        { title: "soup 2", description: "desc 2" },
      ],
      todaysSpecials: [
        { title: "special 1", description: "desc 1" },
        { title: "special 2", description: "desc 2" },
      ],
    });
    const dbResult = await getAllLocationsFromDB(db, parseDate("1/1/25"));
    expect(dbResult).toEqual([
      {
        ...locationOut,
        id: id,

        times: [
          {
            start: timeToUnixTimestamp("1/1/25 5:00 AM"),
            end: timeToUnixTimestamp("1/1/25 12:00 PM"),
          },
          {
            start: timeToUnixTimestamp("1/1/25 2:00 PM"),
            end: timeToUnixTimestamp("1/2/25 2:00 AM"),
          },
        ],
        todaysSoups: [
          {
            description: "desc 1",
            name: "soup 1",
          },
          {
            description: "desc 2",
            name: "soup 2",
          },
        ],
        todaysSpecials: [
          {
            description: "desc 1",
            name: "special 1",
          },
          {
            description: "desc 2",
            name: "special 2",
          },
        ],
      },
    ]);
  });
  dbTest.concurrent(
    "works on specials (overriding)",
    async ({ ctx: { db } }) => {
      const id1 = await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 1,
        },
        times: [
          parseTime("1/1/25", "5:00 am", "12:00 pm"),
          parseTime("1/1/25", "2:00 pm", "2:00 am"),
        ],
        todaysSoups: [
          { title: "soup 1", description: "desc 1" },
          { title: "soup 2", description: "desc 2" },
        ],
        todaysSpecials: [
          { title: "special 1", description: "desc 1" },
          { title: "special 2", description: "desc 2" },
        ],
      });
      const id2 = await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 1,
        },
        times: [
          parseTime("1/1/25", "5:00 am", "12:00 pm"),
          parseTime("1/1/25", "2:00 pm", "2:00 am"),
        ],
        todaysSoups: [],
        todaysSpecials: [
          { title: "special 1", description: "desc 1" },
          { title: "special 2", description: "desc 2" },
        ],
      });
      expect(id1).toEqual(id2);
      const dbResult = await getAllLocationsFromDB(db, parseDate("1/1/25"));
      expect(dbResult).toEqual([
        {
          ...locationOut,
          id: id1,
          times: [
            {
              start: timeToUnixTimestamp("1/1/25 5:00 AM"),
              end: timeToUnixTimestamp("1/1/25 12:00 PM"),
            },
            {
              start: timeToUnixTimestamp("1/1/25 2:00 PM"),
              end: timeToUnixTimestamp("1/2/25 2:00 AM"),
            },
          ],
          todaysSoups: [],
          todaysSpecials: [
            {
              description: "desc 1",
              name: "special 1",
            },
            {
              description: "desc 2",
              name: "special 2",
            },
          ],
        },
      ]);
    },
  );
  dbTest.concurrent("works on time overwrites", async ({ ctx: { db } }) => {
    const id = await addLocationDataToDb(db, {
      ...locationIn,
      times: [
        parseTime("1/1/25", "5:00 am", "5:00 pm"),
        parseTime("1/2/25", "5:00 am", "5:00 pm"),
        parseTime("1/3/25", "5:00 am", "5:00 pm"),
        parseTime("1/4/25", "5:00 am", "5:00 pm"),
        parseTime("1/5/25", "5:00 am", "5:00 pm"),
      ],
    });
    const success1 = await addTimeOverride(
      db,
      id,
      "1/1/25",
      "2:00 AM - 3:00 PM",
    );
    const success2 = await addTimeOverride(
      db,
      id,
      "1/1/25",
      "3:00 AM - 4:00 PM",
    ); // second one should overwrite the first one
    expect(success1).toBe(true);
    expect(success2).toBe(true);
    expect(await getAllLocationsFromDB(db, parseDate("1/1/25"))).toEqual([
      {
        ...locationOut,
        id: id,
        times: [
          {
            start: timeToUnixTimestamp("1/1/25 3:00 AM"),
            end: timeToUnixTimestamp("1/1/25 4:00 PM"),
          },
          {
            start: timeToUnixTimestamp("1/2/25 5:00 AM"),
            end: timeToUnixTimestamp("1/2/25 5:00 PM"),
          },
          {
            start: timeToUnixTimestamp("1/3/25 5:00 AM"),
            end: timeToUnixTimestamp("1/3/25 5:00 PM"),
          },
          {
            start: timeToUnixTimestamp("1/4/25 5:00 AM"),
            end: timeToUnixTimestamp("1/4/25 5:00 PM"),
          },
          {
            start: timeToUnixTimestamp("1/5/25 5:00 AM"),
            end: timeToUnixTimestamp("1/5/25 5:00 PM"),
          },
        ],
      },
    ]);
  });
  dbTest.concurrent("malformed time overwrites", async ({ ctx: { db } }) => {
    const id = await addLocationDataToDb(db, {
      ...locationIn,
      times: [
        parseTime("1/1/25", "5:00 am", "5:00 pm"),
        parseTime("1/2/25", "5:00 am", "5:00 pm"),
        parseTime("1/3/25", "5:00 am", "5:00 pm"),
        parseTime("1/4/25", "5:00 am", "5:00 pm"),
        parseTime("1/5/25", "5:00 am", "5:00 pm"),
      ],
    });

    const success = await addTimeOverride(db, id, "1/1/25", "moo");
    expect(success).toBe(true);
    expect(await getAllLocationsFromDB(db, parseDate("1/1/25"))).toEqual([
      {
        ...locationOut,
        id: id,
        times: [
          // 1/1/25 should be wiped because there is an overwrite -- it's just invalid
          {
            start: timeToUnixTimestamp("1/2/25 5:00 AM"),
            end: timeToUnixTimestamp("1/2/25 5:00 PM"),
          },
          {
            start: timeToUnixTimestamp("1/3/25 5:00 AM"),
            end: timeToUnixTimestamp("1/3/25 5:00 PM"),
          },
          {
            start: timeToUnixTimestamp("1/4/25 5:00 AM"),
            end: timeToUnixTimestamp("1/4/25 5:00 PM"),
          },
          {
            start: timeToUnixTimestamp("1/5/25 5:00 AM"),
            end: timeToUnixTimestamp("1/5/25 5:00 PM"),
          },
        ],
      },
    ]);
  });
  dbTest.concurrent(
    "point time overwrites take precedence over weekly time overwrites",
    async ({ ctx: { db } }) => {
      const locationId = await addLocationDataToDb(db, {
        ...locationIn,
        times: [
          parseTime("1/1/25", "5:00 am", "5:00 pm"),
          parseTime("1/2/25", "5:00 am", "5:00 pm"),
          parseTime("1/3/25", "5:00 am", "5:00 pm"),
          parseTime("1/4/25", "5:00 am", "5:00 pm"),
          parseTime("1/5/25", "5:00 am", "5:00 pm"),
        ],
      });

      const success = await addTimeOverride(
        db,
        locationId,
        "1/1/25",
        "5:00 AM - 6:00 AM",
      );
      await addWeeklyTimeOverride(db, locationId, 3, "9:00 PM - 10:00 PM");
      await addWeeklyTimeOverride(db, locationId, 3, "9:00 PM - 11:00 PM");
      await addWeeklyTimeOverride(db, locationId, 4, "9:00 PM - 11:00 PM");
      expect(success).toBe(true);
      expect(await getAllLocationsFromDB(db, parseDate("1/1/25"))).toEqual([
        {
          ...locationOut,
          id: locationId,
          times: [
            {
              start: timeToUnixTimestamp("1/1/25 5:00 AM"),
              end: timeToUnixTimestamp("1/1/25 6:00 AM"),
            },
            {
              start: timeToUnixTimestamp("1/2/25 9:00 PM"),
              end: timeToUnixTimestamp("1/2/25 11:00 PM"),
            },
            {
              start: timeToUnixTimestamp("1/3/25 5:00 AM"),
              end: timeToUnixTimestamp("1/3/25 5:00 PM"),
            },
            {
              start: timeToUnixTimestamp("1/4/25 5:00 AM"),
              end: timeToUnixTimestamp("1/4/25 5:00 PM"),
            },
            {
              start: timeToUnixTimestamp("1/5/25 5:00 AM"),
              end: timeToUnixTimestamp("1/5/25 5:00 PM"),
            },
          ],
        },
      ]);
    },
  );
  dbTest.concurrent("weekly time overwrites", async ({ ctx: { db } }) => {
    const locationId = await addLocationDataToDb(db, {
      ...locationIn,
      times: [
        parseTime("1/1/25", "5:00 am", "5:00 pm"),
        parseTime("1/2/25", "5:00 am", "5:00 pm"),
        parseTime("1/3/25", "5:00 am", "5:00 pm"),
        parseTime("1/4/25", "5:00 am", "5:00 pm"),
        parseTime("1/5/25", "5:00 am", "5:00 pm"),
      ],
    });

    await addWeeklyTimeOverride(db, locationId, 3, "9:00 PM - 10:00 PM");
    await addWeeklyTimeOverride(db, locationId, 3, "9:00 PM - 11:00 PM");
    await addWeeklyTimeOverride(db, locationId, 4, "9:00 PM - 11:00 PM");
    await addWeeklyTimeOverride(db, locationId, 5, "CLOSED");
    expect(await getAllLocationsFromDB(db, parseDate("1/1/25"))).toEqual([
      {
        ...locationOut,
        id: locationId,
        times: [
          {
            start: timeToUnixTimestamp("1/1/25 9:00 PM"),
            end: timeToUnixTimestamp("1/1/25 11:00 PM"),
          },
          {
            start: timeToUnixTimestamp("1/2/25 9:00 PM"),
            end: timeToUnixTimestamp("1/2/25 11:00 PM"),
          },
          {
            start: timeToUnixTimestamp("1/4/25 5:00 AM"),
            end: timeToUnixTimestamp("1/4/25 5:00 PM"),
          },
          {
            start: timeToUnixTimestamp("1/5/25 5:00 AM"),
            end: timeToUnixTimestamp("1/5/25 5:00 PM"),
          },
        ],
      },
    ]);
  });
  dbTest.concurrent("works on general overwrites", async ({ ctx: { db } }) => {
    const id = await addLocationDataToDb(db, {
      ...locationIn,
      acceptsOnlineOrders: false,
      menu: "bleh",
    });
    await db.insert(overwritesTable).values({
      locationId: id,
      acceptsOnlineOrders: true,
      menu: "overwritten menu",
    });

    expect(await getAllLocationsFromDB(db, parseDate("1/1/25"))).toEqual([
      {
        ...locationOut,
        id: id,
        acceptsOnlineOrders: true,
        menu: "overwritten menu",
      },
    ]);
  });
  dbTest.concurrent("two locations", async ({ ctx: { db } }) => {
    const id1 = await addLocationDataToDb(db, {
      ...locationIn,
      conceptId: 1,
    });
    const id2 = await addLocationDataToDb(db, {
      ...locationIn,
      conceptId: 2,
    });
    expect(id1).not.toEqual(id2);
    const locationData = await getAllLocationsFromDB(db, parseDate("1/1/25"));
    expect(locationData).toHaveLength(2);
    expect(locationData).toEqual(
      expect.arrayContaining([
        {
          ...locationOut,
          id: id1,
        },
        {
          ...locationOut,
          id: id2,
          conceptId: "2",
        },
      ]),
    );
  });
  dbTest.concurrent(
    "adding times for the next day",
    async ({ ctx: { db } }) => {
      const id1 = await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 1,
        },
        times: [
          parseTime("1/1/25", "7:00 AM", "2:00 PM"),
          parseTime("1/2/25", "7:00 AM", "2:00 PM"),
          parseTime("1/3/25", "7:00 AM", "2:00 PM"),
        ],
      });
      const id2 = await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 2,
        },
        times: [parseTime("1/3/25", "7:00 AM", "7:00 PM")],
      });
      expect(id1).toEqual(id2);
      expect(await getAllLocationsFromDB(db, parseDate("1/1/25"))).toEqual([
        {
          ...locationOut,
          id: id1,
          times: [
            {
              start: timeToUnixTimestamp("1/1/25 7:00 AM"),
              end: timeToUnixTimestamp("1/1/25 2:00 PM"),
            },
            {
              start: timeToUnixTimestamp("1/3/25 7:00 AM"),
              end: timeToUnixTimestamp("1/3/25 7:00 PM"),
            },
          ],
        },
      ]);
    },
  );
  dbTest.concurrent("time merging", async ({ ctx: { db } }) => {
    const id = await addLocationDataToDb(db, {
      ...locationIn,
      today: {
        year: 2025,
        month: 1,
        day: 1,
      },
      times: [
        parseTime("1/1/25", "7:00 AM", "2:00 PM"),
        parseTime("1/1/25", "2:00 AM", "12:00 PM"),
        parseTime("1/1/25", "2:01 PM", "9:00 PM"),
        parseTime("1/1/25", "9:00 PM", "11:59 PM"),
        parseTime("1/2/25", "12:00 AM", "11:59 PM"),
      ],
    });

    expect(await getAllLocationsFromDB(db, parseDate("1/1/25"))).toEqual([
      {
        ...locationOut,
        id: id,
        times: [
          {
            start: timeToUnixTimestamp("1/1/25 2:00 AM"),
            end: timeToUnixTimestamp("1/2/25 11:59 PM"),
          },
        ],
      },
    ]);
  });
  dbTest.concurrent.skip("stub", async ({ ctx: { db } }) => {
    const id = await addLocationDataToDb(db, {
      ...locationIn,
    });

    expect(await getAllLocationsFromDB(db, parseDate("1/1/25"))).toEqual([
      {
        ...locationOut,
      },
    ]);
  }); // just for reference
});

/**
 *
 * @param date in mm/dd/yy format
 */
function parseDate(date: string) {
  const dateParsed = DateTime.fromFormat(date, "M/d/yy");
  if (!dateParsed.isValid) throw new Error(`Invalid date string ${date}`);
  return dateParsed;
}
/**
 *
 * @param time ex. 2:00 AM (2:00AM is also fine)
 * @returns minutes since midnight for that time
 */
function _parseTime(time: string) {
  const [_, hour, minute, ampm] = [
    ...(/(\d*)\s*:\s*(\d*)\s*(AM|PM)/i.exec(time) ?? []),
  ];
  if (hour === undefined || minute === undefined || ampm === undefined)
    throw new Error(`Malformed time ${time}`);
  const hourNum = parseInt(hour);
  const minuteNum = parseInt(minute);
  if (isNaN(hourNum) || isNaN(minuteNum))
    throw new Error(`Malformed time ${time}`);
  const minutesSinceMidnight =
    (hourNum % 12) * 60 +
    minuteNum +
    (ampm.toLowerCase() === "pm" ? 12 * 60 : 0);
  return minutesSinceMidnight;
}
/**
 *
 * @param date ex. 2/3/25
 * @param startTime ex. 2:00 AM
 * @param endTime ex. 2:00 AM (can wrap to next day)
 */
function parseTime(date: string, startTime: string, endTime: string) {
  const parsedDate = parseDate(date);
  return {
    year: parsedDate.year,
    month: parsedDate.month,
    day: parsedDate.day,
    startMinutesFromMidnight: _parseTime(startTime),
    endMinutesFromMidnight: _parseTime(endTime),
  };
}

/**
 *
 * @param datetime
 * @returns timestamp, when datetime is interpreted in EST
 */
function timeToUnixTimestamp(datetime: string) {
  const parsedDate = DateTime.fromFormat(datetime, "M/d/yy h:mm a", {
    zone: "America/New_York", // important! enforces timezone
  });
  if (!parsedDate.isValid) throw new Error(`Malformed date string ${datetime}`);
  return parsedDate.toMillis();
}

const wait = (ms: number) => new Promise((re) => setTimeout(re, ms));
