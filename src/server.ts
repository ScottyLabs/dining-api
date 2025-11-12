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
import { getEmails } from "db/dbQueryUtils";
import { getAllLocations } from "db/getLocations";
import { openapi } from "@elysiajs/openapi";
import { initDB } from "db/db";
import { DateTime } from "luxon";

/** only used for Slack debug diff logging */
let cachedLocations: ILocation[] = [];
async function reload(): Promise<void> {
  return;
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
      finalLocations.map((location) => addLocationDataToDb(location))
    );
  }
}

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
app.get("/api/v2/locations", async () => await getAllLocations(DateTime.now()));
app.get("/api/emails", getEmails);

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

initDB(env.DATABASE_URL);
// Initial load and start the server
reload()
  .then(() => {
    app.listen(env.PORT, ({ hostname, port }) => {
      notifySlack(`Dining API is running at ${hostname}:${port}`);
    });
  })
  .catch(async (er) => {
    await notifySlack("<!channel> Dining API startup failed!!");
    await notifySlack(`*Error caught*\n${er.stack}`);
    process.exit(1);
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
