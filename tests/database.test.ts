import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { _disconnectPoolConnection, initDB } from "db/db";
import { addLocationDataToDb } from "db/updateLocation";
import { getAllLocations } from "db/getLocations";
const wait = (ms: number) => new Promise((re) => setTimeout(re, ms));
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
  });

  afterEach(async () => {
    _disconnectPoolConnection();
    await container.stop();
  });

  it("works on basic insertion", async () => {
    await addLocationDataToDb({
      name: "test",
      acceptsOnlineOrders: false,
      conceptId: 1,
      coordinates: { lat: 1, lng: 1 },
      description: "description",
      earliestDayToOverride: undefined,
      times: [],
      location: "location",
      menu: "menu",
      shortDescription: "hi",
      url: "https://hi.com",
      todaysSoups: undefined,
      todaysSpecials: undefined,
    });
    const dbResult = await getAllLocations();
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
        coordinateLng: 1,
        acceptsOnlineOrders: false,
        times: [],
        todaysSoups: undefined,
        todaysSpecials: undefined,
      },
    ]);
  });
  it("properly resets state on every new test", async () => {
    expect(await getAllLocations()).toEqual([]);
  });
});
