import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import DiningParser from "./parser/diningParser";
import { ILocation } from "types";
import { env } from "env";
import { notifySlack } from "utils/slack";
import { node } from "@elysiajs/node";
import ScrapeResultMerger from "utils/locationMerger";
import { addLocationDataToDb } from "db/updateLocation";
import { deprecatedNotice } from "deprecationNotice";
import { getDiffsBetweenLocationData } from "utils/diff";
import { getAllLocationsFromDB } from "db/getLocations";
import { openapi } from "@elysiajs/openapi";
import { initDBConnection } from "db/db";
import { DateTime } from "luxon";
import { QueryUtils } from "db/dbQueryUtils";

/** only used for Slack debug diff logging */
let cachedLocations: ILocation[] = [];
async function reload(): Promise<void> {
  const now = new Date();
  console.log(`Reloading Dining API: ${now}`);
  const parser = new DiningParser();
  const locationMerger = new ScrapeResultMerger();

  for (let i = 0; i < env.NUMBER_OF_SCRAPES; i++) {
    // Wait a bit before starting the next round of scrapes.
    if (i > 0)
      await new Promise((resolve) =>
        setTimeout(resolve, env.INTER_SCRAPE_WAIT_INTERVAL)
      );

    const locations = await parser.process();
    locations.forEach((location) => locationMerger.addLocation(location));
  }
  const finalLocations = locationMerger.getMostFrequentLocations();
  if (finalLocations.length === 0) {
    notifySlack("<!channel> No data scraped! Skipping");
  } else {
    const diffs = getDiffsBetweenLocationData(cachedLocations, finalLocations);
    cachedLocations = finalLocations;

    if (diffs.length === 0) {
      notifySlack("Dining API reloaded (data unchanged)");
    } else {
      await notifySlack("Dining API reloaded with the following changes:");
      for (const diff of diffs) {
        await notifySlack(diff);
      }
    }

    await Promise.all(
      finalLocations.map((location) => addLocationDataToDb(db, location))
    );
  }
}
const [pool, db] = initDBConnection(env.DATABASE_URL);
export const app = new Elysia({ adapter: node() }).use(openapi()); // I don't trust bun (as a runtime) enough (Eric Xu - 7/18/2025). This may change in the future, but bun is currently NOT a full drop-in replacement for node and is still rather unstable from personal experience

app.onError(({ error, path, code }) => {
  if (code === "NOT_FOUND") {
    console.log(`Someone tried visiting ${path}, which does not exist :P`);
  } else {
    notifySlack(
      `<!channel> handling request on ${path} failed with error ${error}\n${
        error instanceof Error ? error.stack : "No stack trace"
      }`
    );
  }
});
app.use(cors());
app.onAfterHandle(({ response }) => {
  if (typeof response === "object") {
    // pretty print this
    return new Response(JSON.stringify(response, null, 4), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    }); // we can actually set proper content-type headers this way
  }
});

app.get("/", () => {
  return "ScottyLabs Dining API";
});
app.get(
  "/api/v2/locations",
  async () => await getAllLocationsFromDB(db, DateTime.now())
);
app.get("/api/emails", async () => await new QueryUtils(db).getEmails());

app.post(
  "/api/sendSlackMessage",
  async ({ body: { message } }) => {
    await notifySlack(message, env.SLACK_FRONTEND_WEBHOOK_URL);
  },
  {
    body: t.Object({
      message: t.String(),
    }),
  }
);

setInterval(() => {
  reload().catch(
    (er) => `Error in reload process: ${notifySlack(String(er))}\n${er.stack}`
  );
}, env.RELOAD_WAIT_INTERVAL);
reload().catch(
  (er) => `Error in reload process: ${notifySlack(String(er))}\n${er.stack}`
);

app.listen(env.PORT, ({ hostname, port }) => {
  notifySlack(`Dining API is running at ${hostname}:${port}`);
});

// DEPRECATED

app.get("/locations", async () => ({ locations: deprecatedNotice }));

app.get("/location/:name", async ({ params: { name } }) => {
  const filteredLocation = deprecatedNotice.filter((location) => {
    return location.name?.toLowerCase().includes(name.toLowerCase());
  });
  return {
    locations: filteredLocation,
  };
});

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
  }
);
