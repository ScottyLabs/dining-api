import { Client } from "pg";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
export async function initPgClient() {
  const container = await new PostgreSqlContainer("postgres:17.5").start();
  const pgClient = new Client({
    host: container.getHost(),
    port: container.getPort(),
    database: container.getDatabase(),
    user: container.getUsername(),
    password: container.getPassword(),
  });
  await pgClient.connect();
  return { container, pgClient };
}
