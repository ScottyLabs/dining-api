import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import DiningParser from "./parser/diningParser";
import { ILocation } from "types";
import { env } from "env";
import { notifySlack } from "utils/slack";
import { node } from "@elysiajs/node";
import { logDiffs } from "utils/diff";

let cachedLocations: ILocation[] = [];

class LocationMerger {
  majorityDict: Partial<
    Record<
      number,
      Partial<Record<string, { cnt: number; originalData: ILocation }>>
    >
  > = {}; // Partial type because the values don't exist initially
  addLocation(location: ILocation) {
    const majorityDictLocationData =
      this.majorityDict[location.conceptId] ?? {};
    const hashedVersion = JSON.stringify(location);

    majorityDictLocationData[hashedVersion] = {
      cnt: (majorityDictLocationData[hashedVersion]?.cnt ?? 0) + 1,
      originalData: location, // theoretically this should be the same as all previous versions
    };
    this.majorityDict[location.conceptId] = majorityDictLocationData;
  }
  getMostFrequentLocations() {
    return Object.entries(this.majorityDict).map(([conceptId, freqData]) => {
      if (freqData === undefined) {
        throw new Error(`Expected frequency data for concept id ${conceptId}`);
      }

      const bestMatch = Object.values(freqData).reduce((bestMatch, curVal) => {
        if (curVal === undefined) throw new Error();
        return bestMatch === undefined || curVal.cnt > bestMatch.cnt
          ? curVal
          : bestMatch;
      }, undefined);
      if (bestMatch === undefined) throw new Error();
      console.log(
        `${bestMatch.originalData.name} frequencies: ${Object.values(
          freqData
        ).map((val) => val?.cnt)}`
      );
      return bestMatch.originalData;
    });
  }
}

async function reload(): Promise<void> {
  const now = new Date();
  console.log(`Reloading Dining API: ${now}`);
  const parser = new DiningParser();
  const locationMerger = new LocationMerger();

  for (let i = 0; i < env.NUMBER_OF_SCRAPES; i++) {
    // Wait a bit before starting the next round of scrapes.
    if (i > 0)
      await new Promise((re) => setTimeout(re, env.INTER_SCRAPE_WAIT_INTERVAL));

    const locations = await parser.process();
    locations.forEach((location) => locationMerger.addLocation(location));
  }
  const finalLocations = locationMerger.getMostFrequentLocations();
  logDiffs(cachedLocations, finalLocations);
  if (
    cachedLocations !== undefined &&
    finalLocations.length < cachedLocations.length - 1
  ) {
    notifySlack(
      `<!channel> Ignored location fetch since it (likely) has missing data ${JSON.stringify(
        finalLocations
      )}`
    );
  } else {
    cachedLocations = finalLocations;

    notifySlack("Dining API cache reloaded");
  }
}

export const app = new Elysia({ adapter: node() }); // I don't trust bun enough (Eric Xu - 7/18/2025). This may change in the future, but bun is currently NOT a full drop-in replacement for node and is still rather unstable from personal experience

app.onError(({ error, path, code }) => {
  if (code === "NOT_FOUND") {
    notifySlack(`Someone tried visiting ${path}, which does not exist :P`);
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

app.get("/locations", () => ({ locations: cachedLocations }));

app.get("/location/:name", ({ params: { name } }) => {
  const filteredLocation = cachedLocations.filter((location) => {
    return location.name?.toLowerCase().includes(name.toLowerCase());
  });
  return {
    locations: filteredLocation,
  };
});

app.get("/locations/time/:day/:hour/:min", ({ params: { day, hour, min } }) => {
  const result = cachedLocations.filter((el) => {
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
});

// Update the cache every 30 minutes

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
