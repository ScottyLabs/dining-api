import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { DBType, initDBConnection } from "db/db";
import { addLocationDataToDb } from "db/updateLocation";
import { getAllLocations } from "db/getLocations";
import { DateTime } from "luxon";
import { ILocation } from "types";
import { test as baseTest } from "vitest";
import { Pool } from "pg";

const wait = (ms: number) => new Promise((re) => setTimeout(re, ms));
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
const locationOut = {
  id: 1,
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
};
const dbTest = baseTest.extend<{
  db: {
    db: DBType;
    container: StartedPostgreSqlContainer;
    pool: Pool;
  };
}>({
  db: async ({}, use) => {
    const container = await new PostgreSqlContainer("postgres:17.5")
      .withCopyDirectoriesToContainer([
        {
          source: `${__dirname}/../drizzle`,
          target: "/docker-entrypoint-initdb.d",
        },
      ])
      .start();
    const [pool, db] = initDBConnection(container.getConnectionUri());
    use({ container, pool, db });
  },
});

dbTest.afterEach(({ db }) => {
  db.pool.end();
  db.container.stop();
});
describe("DB", () => {
  dbTest.concurrent("works on basic insertion", async ({ db: { db } }) => {
    await addLocationDataToDb(db, locationIn);
    const dbResult = await getAllLocations(db, DateTime.now());
    expect(dbResult).toEqual([locationOut]);
  });
  dbTest.concurrent(
    "properly resets state on every new dbTest",
    async ({ db: { db } }) => {
      expect(await getAllLocations(db, DateTime.now())).toEqual([]);
    }
  );
  dbTest.concurrent("works on insertion with times", async ({ db: { db } }) => {
    await addLocationDataToDb(db, {
      ...locationIn,
      today: {
        year: 2025,
        month: 1,
        day: 1,
      },
      times: [
        {
          day: 1,
          month: 1,
          year: 2025,
          startMinutesFromMidnight: 5 * 60,
          endMinutesFromMidnight: 12 * 60,
        },
        {
          day: 1,
          month: 1,
          year: 2025,
          startMinutesFromMidnight: 5 * 60,
          endMinutesFromMidnight: 12 * 60,
        },
        {
          day: 1,
          month: 1,
          year: 2025,
          startMinutesFromMidnight: 14 * 60,
          endMinutesFromMidnight: 2 * 60,
        },
        {
          day: 7,
          month: 7,
          year: 2025,
          startMinutesFromMidnight: 14 * 60,
          endMinutesFromMidnight: 2 * 60,
        },
      ],
    });
    const dbResult = await getAllLocations(
      db,
      DateTime.fromObject({ year: 2025, month: 1, day: 2 })
    );
    expect(dbResult).toEqual([
      {
        ...locationOut,
        times: [
          {
            start: 1735725600000,
            end: 1735750800000,
          },
          {
            start: 1735758000000,
            end: 1735801200000,
          },
          {
            start: 1751911200000,
            end: 1751954400000,
          },
        ],
      },
    ]);
  });
  dbTest.concurrent(
    "works on insertion with times (tests search window)",
    async ({ db: { db } }) => {
      await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 1,
        },
        times: [
          {
            day: 1,
            month: 1,
            year: 2025,
            startMinutesFromMidnight: 5 * 60,
            endMinutesFromMidnight: 12 * 60,
          },
          {
            day: 1,
            month: 1,
            year: 2025,
            startMinutesFromMidnight: 5 * 60,
            endMinutesFromMidnight: 12 * 60,
          },
          {
            day: 1,
            month: 1,
            year: 2025,
            startMinutesFromMidnight: 14 * 60,
            endMinutesFromMidnight: 2 * 60,
          },
        ],
      });
      const dbResult = await getAllLocations(
        db,
        DateTime.fromObject({ year: 2025, month: 1, day: 3 }) // 2 days after latest time
      );
      expect(dbResult).toEqual([
        {
          ...locationOut,
          times: [],
        },
      ]);
    }
  );
  dbTest.concurrent(
    "works on insertion with times (DST - start 2AM -> 3AM) (3/9/25)",
    async ({ db: { db } }) => {
      await addLocationDataToDb(db, {
        ...locationIn,
        times: [
          {
            day: 9,
            month: 3,
            year: 2025,
            startMinutesFromMidnight: 5 * 60,
            endMinutesFromMidnight: 12 * 60,
          },
        ],
      });
      const dbResult = await getAllLocations(
        db,
        DateTime.fromObject({ year: 2025, month: 1, day: 3 }) // 2 days after latest time
      );
      expect(dbResult).toEqual([
        {
          ...locationOut,
          times: [
            {
              start: 1741510800000,
              end: 1741536000000,
            },
          ],
        },
      ]);
    }
  );
  dbTest.concurrent(
    "works on insertion with times (DST - end 2AM -> 1AM) (3/9/25) [if a place closes at 2 AM, we assume it's the second 2AM (I mean, the first 2AM technically doesn't exist...)",
    async ({ db: { db } }) => {
      await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 1,
        },
        times: [
          {
            day: 1,
            month: 11,
            year: 2025,
            startMinutesFromMidnight: 7 * 60,
            endMinutesFromMidnight: 2 * 60,
          },
        ],
      });
      const dbResult = await getAllLocations(
        db,
        DateTime.fromObject({ year: 2025, month: 1, day: 3 })
      );
      expect(dbResult).toEqual([
        {
          ...locationOut,
          times: [
            {
              start: 1761994800000,
              end: 1762066800000, // the second 2AM
            },
          ],
        },
      ]);
    }
  );
  dbTest.concurrent(
    "works on insertion with times (DST - end 2AM -> 1AM) (3/9/25) [if a place closes at 1:30 AM, we assume dbTest's the first 1:30 AM and not the second]",
    async ({ db: { db } }) => {
      await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 1,
        },
        times: [
          {
            day: 1,
            month: 11,
            year: 2025,
            startMinutesFromMidnight: 7 * 60,
            endMinutesFromMidnight: 1.5 * 60,
          },
        ],
      });
      const dbResult = await getAllLocations(
        db,
        DateTime.fromObject({ year: 2025, month: 1, day: 3 })
      );
      expect(dbResult).toEqual([
        {
          ...locationOut,
          times: [
            {
              start: 1761994800000,
              end: 1762061400000, // the first 1:30 AM
            },
          ],
        },
      ]);
    }
  );
  dbTest.concurrent("works on specials", async ({ db: { db } }) => {
    await addLocationDataToDb(db, {
      ...locationIn,
      today: {
        year: 2025,
        month: 1,
        day: 1,
      },
      times: [
        {
          day: 1,
          month: 1,
          year: 2025,
          startMinutesFromMidnight: 5 * 60,
          endMinutesFromMidnight: 12 * 60,
        },
        {
          day: 1,
          month: 1,
          year: 2025,
          startMinutesFromMidnight: 5 * 60,
          endMinutesFromMidnight: 12 * 60,
        },
        {
          day: 1,
          month: 1,
          year: 2025,
          startMinutesFromMidnight: 14 * 60,
          endMinutesFromMidnight: 2 * 60,
        },
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
    const dbResult = await getAllLocations(
      db,
      DateTime.fromObject({ year: 2025, month: 1, day: 1 })
    );
    expect(dbResult).toEqual([
      {
        ...locationOut,
        times: [
          {
            start: 1735725600000,
            end: 1735750800000,
          },
          {
            start: 1735758000000,
            end: 1735801200000,
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
    async ({ db: { db } }) => {
      await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 1,
        },
        times: [
          {
            day: 1,
            month: 1,
            year: 2025,
            startMinutesFromMidnight: 5 * 60,
            endMinutesFromMidnight: 12 * 60,
          },
          {
            day: 1,
            month: 1,
            year: 2025,
            startMinutesFromMidnight: 5 * 60,
            endMinutesFromMidnight: 12 * 60,
          },
          {
            day: 1,
            month: 1,
            year: 2025,
            startMinutesFromMidnight: 14 * 60,
            endMinutesFromMidnight: 2 * 60,
          },
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
      await addLocationDataToDb(db, {
        ...locationIn,
        today: {
          year: 2025,
          month: 1,
          day: 1,
        },
        times: [
          {
            day: 1,
            month: 1,
            year: 2025,
            startMinutesFromMidnight: 5 * 60,
            endMinutesFromMidnight: 12 * 60,
          },
          {
            day: 1,
            month: 1,
            year: 2025,
            startMinutesFromMidnight: 5 * 60,
            endMinutesFromMidnight: 12 * 60,
          },
          {
            day: 1,
            month: 1,
            year: 2025,
            startMinutesFromMidnight: 14 * 60,
            endMinutesFromMidnight: 2 * 60,
          },
        ],
        todaysSoups: [],
        todaysSpecials: [
          { title: "special 1", description: "desc 1" },
          { title: "special 2", description: "desc 2" },
        ],
      });
      const dbResult = await getAllLocations(
        db,
        DateTime.fromObject({ year: 2025, month: 1, day: 1 })
      );
      expect(dbResult).toEqual([
        {
          ...locationOut,
          times: [
            {
              start: 1735725600000,
              end: 1735750800000,
            },
            {
              start: 1735758000000,
              end: 1735801200000,
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
    }
  );
});
