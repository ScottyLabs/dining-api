import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { env } from "env";
import { notifySlack } from "utils/slack";
import { node } from "@elysiajs/node";
import { deprecatedEndpoints } from "endpoints/deprecated";
import { openapi } from "@elysiajs/openapi";
import { db } from "db/db";
import { Settings } from "luxon";
import { refreshDB } from "reload";
import { authEndpoints } from "endpoints/auth";
import { miscEndpoints } from "endpoints/misc";
import { reviewEndpoints } from "endpoints/reviews";
import { populateTags } from "db/seed";

Settings.defaultZone = "America/New_York";

populateTags(db);

export const app = new Elysia({ adapter: node() }).use(
  openapi({
    // references: fromTypes("src/server.ts"), // welp I can't get this to work
    documentation: {
      tags: [],
      info: {
        title: "CMU Dining API",
        version: "2.0.0",
        description:
          "Hello!~ Thanks for checking out the cmueats api. Have a great day!",
      },
    },
  })
); // I don't trust bun (as a runtime) enough (Eric Xu - 7/18/2025). This may change in the future, but bun is currently NOT a full drop-in replacement for node and is still rather unstable from personal experience

app.onError(({ error, path, code }) => {
  if (code === 401) return; // unauthorized
  if (code === "NOT_FOUND") {
    console.log(`Someone tried visiting ${path}, which does not exist :P`);
  } else {
    notifySlack(
      `<!channel> handling request on ${path} failed with error ${error} ${code}\n${
        error instanceof Error ? error.stack : "No stack trace"
      }`
    );
  }
});

app.onAfterHandle(({ responseValue }) => {
  if (
    typeof responseValue === "object" &&
    !(responseValue instanceof Response)
  ) {
    // pretty print this JSON response
    return new Response(JSON.stringify(responseValue, null, 4), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    }); // we can actually set proper content-type headers this way
  }
});
app.use(cors());
app.use(authEndpoints);
app.use(deprecatedEndpoints);
app.use(miscEndpoints);
app.use(reviewEndpoints);

if (!env.DEV_DONT_FETCH) {
  setInterval(() => {
    refreshDB(db).catch(
      (er) => `Error in reload process: ${notifySlack(String(er))}\n${er.stack}`
    );
  }, env.RELOAD_WAIT_INTERVAL);
  refreshDB(db).catch(
    (er) => `Error in reload process: ${notifySlack(String(er))}\n${er.stack}`
  );
}

app.listen(env.PORT, ({ hostname, port }) => {
  notifySlack(`Dining API is running at ${hostname}:${port}`);
});
