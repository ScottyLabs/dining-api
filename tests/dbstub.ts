import {
  StartedPostgreSqlContainer,
  PostgreSqlContainer,
} from "@testcontainers/postgresql";
import { DBType, initDBConnection } from "db/db";
import { Pool } from "pg";
import { test as baseTest } from "vitest";

export const dbTest = baseTest.extend<{
  ctx: {
    db: DBType;
    container: StartedPostgreSqlContainer;
    pool: Pool;
  };
}>({
  ctx: async ({}, use) => {
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

dbTest.afterEach(({ ctx }) => {
  ctx.pool.end();
  ctx.container.stop();
});
