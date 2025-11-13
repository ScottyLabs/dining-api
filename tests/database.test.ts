import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { _disconnectPoolConnection, initDB } from "db/db";
import { addLocationDataToDb } from "db/updateLocation";
import { getAllLocations } from "db/getLocations";
import { DateTime } from "luxon";
import { ILocation } from "types";
const wait = (ms: number) => new Promise((re) => setTimeout(re, ms));
const locationIn: ILocation = {
  name: "test",
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
  name: "test",
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
describe("Redis", () => {
  let container: StartedPostgreSqlContainer;

  beforeEach(async () => {
    container = await new PostgreSqlContainer("postgres:17.5")
      .withCopyDirectoriesToContainer([
        {
          source: `${__dirname}/../drizzle`,
          target: "/docker-entrypoint-initdb.d",
        },
      ])
      .start();
    initDB(container.getConnectionUri());
  }, 120 * 1000);

  afterEach(async () => {
    _disconnectPoolConnection();
    await container.stop();
  });

  it("works on basic insertion", async () => {
    await addLocationDataToDb(locationIn);
    const dbResult = await getAllLocations(DateTime.now());
    expect(dbResult).toEqual([locationOut]);
  });
  it("properly resets state on every new test", async () => {
    expect(await getAllLocations(DateTime.now())).toEqual([]);
  });
  it("works on insertion with times", async () => {
    await addLocationDataToDb({
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
  it("works on insertion with times (tests search window)", async () => {
    await addLocationDataToDb({
      name: "test",
      acceptsOnlineOrders: false,
      conceptId: 1,
      coordinates: { lat: 1, lng: 10 },
      description: "description",
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
      location: "location",
      menu: "menu",
      shortDescription: "hi",
      url: "https://hi.com",
      todaysSoups: [],
      todaysSpecials: [],
    });
    const dbResult = await getAllLocations(
      DateTime.fromObject({ year: 2025, month: 1, day: 3 }) // 2 days after latest time
    );
    expect(dbResult).toEqual([
      {
        id: 1,
        name: "test",
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
      },
    ]);
  });
  it("works on insertion with times (DST - start 2AM -> 3AM) (3/9/25)", async () => {
    await addLocationDataToDb({
      name: "test",
      acceptsOnlineOrders: false,
      conceptId: 1,
      coordinates: { lat: 1, lng: 10 },
      description: "description",
      today: {
        year: 2025,
        month: 1,
        day: 1,
      },
      times: [
        {
          day: 9,
          month: 3,
          year: 2025,
          startMinutesFromMidnight: 5 * 60,
          endMinutesFromMidnight: 12 * 60,
        },
      ],
      location: "location",
      menu: "menu",
      shortDescription: "hi",
      url: "https://hi.com",
      todaysSoups: [],
      todaysSpecials: [],
    });
    const dbResult = await getAllLocations(
      DateTime.fromObject({ year: 2025, month: 1, day: 3 }) // 2 days after latest time
    );
    expect(dbResult).toEqual([
      {
        id: 1,
        name: "test",
        shortDescription: "hi",
        description: "description",
        url: "https://hi.com",
        menu: "menu",
        location: "location",
        coordinateLat: 1,
        coordinateLng: 10,
        acceptsOnlineOrders: false,
        times: [
          {
            start: 1741510800000,
            end: 1741536000000,
          },
        ],
        todaysSoups: [],
        todaysSpecials: [],
      },
    ]);
  });
  it("works on insertion with times (DST - end 2AM -> 1AM) (3/9/25) [if a place closes at 2 AM, we assume it's the second 2 AM and not the first (why? arbitrary)]", async () => {
    await addLocationDataToDb({
      name: "test",
      acceptsOnlineOrders: false,
      conceptId: 1,
      coordinates: { lat: 1, lng: 10 },
      description: "description",
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
      location: "location",
      menu: "menu",
      shortDescription: "hi",
      url: "https://hi.com",
      todaysSoups: [],
      todaysSpecials: [],
    });
    const dbResult = await getAllLocations(
      DateTime.fromObject({ year: 2025, month: 1, day: 3 })
    );
    expect(dbResult).toEqual([
      {
        id: 1,
        name: "test",
        shortDescription: "hi",
        description: "description",
        url: "https://hi.com",
        menu: "menu",
        location: "location",
        coordinateLat: 1,
        coordinateLng: 10,
        acceptsOnlineOrders: false,
        times: [
          {
            start: 1761994800000,
            end: 1762066800000, // the second 2AM
          },
        ],
        todaysSoups: [],
        todaysSpecials: [],
      },
    ]);
  });
  it("works on insertion with times (DST - end 2AM -> 1AM) (3/9/25) [if a place closes at 1:30 AM, we assume it's the first 1:30 AM and not the second]", async () => {
    await addLocationDataToDb({
      name: "test",
      acceptsOnlineOrders: false,
      conceptId: 1,
      coordinates: { lat: 1, lng: 10 },
      description: "description",
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
      location: "location",
      menu: "menu",
      shortDescription: "hi",
      url: "https://hi.com",
      todaysSoups: [],
      todaysSpecials: [],
    });
    const dbResult = await getAllLocations(
      DateTime.fromObject({ year: 2025, month: 1, day: 3 })
    );
    expect(dbResult).toEqual([
      {
        id: 1,
        name: "test",
        shortDescription: "hi",
        description: "description",
        url: "https://hi.com",
        menu: "menu",
        location: "location",
        coordinateLat: 1,
        coordinateLng: 10,
        acceptsOnlineOrders: false,
        times: [
          {
            start: 1761994800000,
            end: 1762061400000, // the first 1:30 AM
          },
        ],
        todaysSoups: [],
        todaysSpecials: [],
      },
    ]);
  });
  it("works on specials", async () => {
    await addLocationDataToDb({
      name: "test",
      acceptsOnlineOrders: false,
      conceptId: 1,
      coordinates: { lat: 1, lng: 10 },
      description: "description",
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
      location: "location",
      menu: "menu",
      shortDescription: "hi",
      url: "https://hi.com",
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
      DateTime.fromObject({ year: 2025, month: 1, day: 1 })
    );
    expect(dbResult).toEqual([
      {
        id: 1,
        name: "test",
        shortDescription: "hi",
        description: "description",
        url: "https://hi.com",
        menu: "menu",
        location: "location",
        coordinateLat: 1,
        coordinateLng: 10,
        acceptsOnlineOrders: false,
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
  it("works on specials (overriding)", async () => {
    await addLocationDataToDb({
      name: "test",
      acceptsOnlineOrders: false,
      conceptId: 1,
      coordinates: { lat: 1, lng: 10 },
      description: "description",
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
      location: "location",
      menu: "menu",
      shortDescription: "hi",
      url: "https://hi.com",
      todaysSoups: [
        { title: "soup 1", description: "desc 1" },
        { title: "soup 2", description: "desc 2" },
      ],
      todaysSpecials: [
        { title: "special 1", description: "desc 1" },
        { title: "special 2", description: "desc 2" },
      ],
    });
    await addLocationDataToDb({
      name: "test",
      acceptsOnlineOrders: false,
      conceptId: 1,
      coordinates: { lat: 1, lng: 10 },
      description: "description",
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
      location: "location",
      menu: "menu",
      shortDescription: "hi",
      url: "https://hi.com",
      todaysSoups: [],
      todaysSpecials: [
        { title: "special 1", description: "desc 1" },
        { title: "special 2", description: "desc 2" },
      ],
    });
    const dbResult = await getAllLocations(
      DateTime.fromObject({ year: 2025, month: 1, day: 1 })
    );
    expect(dbResult).toEqual([
      {
        id: 1,
        name: "test",
        shortDescription: "hi",
        description: "description",
        url: "https://hi.com",
        menu: "menu",
        location: "location",
        coordinateLat: 1,
        coordinateLng: 10,
        acceptsOnlineOrders: false,
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
  });
});
