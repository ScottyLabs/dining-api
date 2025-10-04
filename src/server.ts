import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import DiningParser from "./parser/diningParser";
import { ILocation } from "types";
import { env } from "env";
import { notifySlack } from "utils/slack";
import { node } from "@elysiajs/node";
import { getDiffsBetweenLocationData } from "utils/diff";
import LocationMerger from "utils/locationMerger";
import locationCoordinateOverwrites from "overwrites/locationCoordinateOverwrites";
import { timeSlotOverwrites } from "overwrites/timeOverwrites";
import { getEmails, getOverrides } from "db/query";

let cachedLocations: ILocation[] = [];
function getCachedLocations() {
  return applyOverrides(cachedLocations);
}
async function reload(): Promise<void> {
  const now = new Date();
  console.log(`Reloading Dining API: ${now}`);
  const parser = new DiningParser({
    locationCoordinateOverwrites,
    timeSlotOverwrites,
  });
  const locationMerger = new LocationMerger();

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
  }
}

async function applyOverrides(locations: ILocation[]): Promise<ILocation[]> {
  const overrides = await getOverrides();
  return locations.map((location) => {
    const overrideData = overrides[location.conceptId];
    if (overrideData === undefined) return location;
    return {
      ...location,
      ...overrideData,
    };
  });
}
export const app = new Elysia({ adapter: node() }); // I don't trust bun (as a runtime) enough (Eric Xu - 7/18/2025). This may change in the future, but bun is currently NOT a full drop-in replacement for node and is still rather unstable from personal experience

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

app.get("/", () => {
  return "ScottyLabs Dining API";
});

app.get("/locations", async () => ({ locations: await getCachedLocations() }));

app.get("/location/:name", async ({ params: { name } }) => {
  const filteredLocation = (await getCachedLocations()).filter((location) => {
    return location.name?.toLowerCase().includes(name.toLowerCase());
  });
  return {
    locations: filteredLocation,
  };
});

app.get(
  "/locations/time/:day/:hour/:min",
  async ({ params: { day, hour, min } }) => {
    const result = (await getCachedLocations()).filter((el) => {
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

app.get("/api/emails", getEmails);
app.get("/api/changes", async () => await getOverrides());

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
