import { Client } from "pg";
import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { initPgClient } from "./postgresClient";

describe.only("Redis", () => {
  let container: StartedPostgreSqlContainer;
  let pgClient: Client;

  beforeAll(async () => {
    const init = await initPgClient();
    container = init.container;
    pgClient = init.pgClient;
  });

  afterAll(async () => {
    await pgClient.end();
    await container.stop();
  });

  it("works", async () => {
    console.log(container.getConnectionUri());
    const result = await pgClient.query("SELECT 1");
    expect(result.rows[0]).toEqual({ "?column?": 1 });
  });
});
