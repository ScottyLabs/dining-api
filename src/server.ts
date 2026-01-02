import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { env } from "env";
import { notifySlack } from "utils/slack";
import { node } from "@elysiajs/node";
import { deprecatedNotice } from "deprecationNotice";
import { getAllLocationsFromDB } from "db/getLocations";
import { openapi } from "@elysiajs/openapi";
import { db } from "db/db";
import { DateTime, Settings } from "luxon";
import { QueryUtils } from "db/dbQueryUtils";
import { refreshDB } from "reload";
import { LocationsSchema } from "schemas";
import { authPlugin, fetchUserDetails } from "auth";

Settings.defaultZone = "America/New_York";

export const app = new Elysia({ adapter: node() }).use(
  openapi({
    // references: fromTypes("src/server.ts"), // welp I can't get this to work
    documentation: {
      tags: [],
      info: {
        title: "CMU Dining API",
        version: "2.0.0",
      },
    },
  })
); // I don't trust bun (as a runtime) enough (Eric Xu - 7/18/2025). This may change in the future, but bun is currently NOT a full drop-in replacement for node and is still rather unstable from personal experience

app.onError(({ error, path, code }) => {
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
app.use(cors());
app.use(authPlugin);
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

app.get(
  "/",
  () => {
    return "ScottyLabs Dining API";
  },
  { response: t.String({ examples: ["ScottyLabs Dining API"] }) }
);
app.get(
  "/v2/locations",
  async () => await getAllLocationsFromDB(db, DateTime.now()),
  { response: LocationsSchema }
);
app.get("/emails", async () => await new QueryUtils(db).getEmails(), {
  response: t.Array(
    t.Object({
      name: t.String({
        example: ["Alice"],
      }),
      email: t.String({
        example: "alice72@andrew.cmu.edu",
      }),
    })
  ),
});

app.post(
  "/sendSlackMessage",
  async ({ body: { message } }) => {
    await notifySlack(message, env.SLACK_FRONTEND_WEBHOOK_URL);
  },
  {
    body: t.Object({
      message: t.String(),
    }),
  }
);
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
app.get(
  "/whoami",
  async ({ cookie }) => {
    return {
      user: await fetchUserDetails(cookie["session_id"]!.value as string),
    };
  },
  {
    response: t.Object({
      user: t.Nullable(
        t.Object({
          googleId: t.String(),
          id: t.Number(),
          email: t.String(),
          firstName: t.Nullable(t.String()),
          lastName: t.Nullable(t.String()),
          pictureUrl: t.Nullable(t.String()),
        })
      ),
    }),
  }
);

// DEPRECATED

app.get("/locations", async () => ({ locations: deprecatedNotice }), {
  detail: {
    tags: ["Deprecated"],
    hide: true,
  },
});

app.get(
  "/location/:name",
  async ({ params: { name } }) => {
    const filteredLocation = deprecatedNotice.filter((location) => {
      return location.name?.toLowerCase().includes(name.toLowerCase());
    });
    return {
      locations: filteredLocation,
    };
  },
  {
    detail: {
      tags: ["Deprecated"],
      hide: true,
    },
  }
);

app.get(
  "/locations/time/:day/:hour/:min",
  async ({ params: { day, hour, min } }) => {
    const result = deprecatedNotice.filter((el) => {
      let returning = false;
      el.times.forEach((element) => {
        const startMins =
          element.start.day * 1440 +
          element.start.hour * 60 +
          element.start.minute;
        const endMins =
          element.end.day * 1440 + element.end.hour * 60 + element.end.minute;
        const currentMins =
          parseInt(day) * 1440 + parseInt(hour) * 60 + parseInt(min);
        if (currentMins >= startMins && currentMins < endMins) {
          returning = true;
        }
      });
      return returning;
    });
    return { locations: result };
  },
  {
    detail: {
      tags: ["Deprecated"],
      hide: true,
    },
  }
);
app.listen(env.PORT, ({ hostname, port }) => {
  notifySlack(`Dining API is running at ${hostname}:${port}`);
});
