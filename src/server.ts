import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import DiningParser from "./parser/diningParser";
import { ILocation } from "types";
import { env } from "env";
import { notifySlack } from "utils/slack";
import { node } from "@elysiajs/node";

let cachedLocations: ILocation[];

async function reload(): Promise<void> {
  const now = new Date();
  console.log(`Reloading Dining API: ${now}`);
  const parser = new DiningParser();
  let locations: ILocation[] = [];

  // majorityDict.get(restaurantName) is a Map<string, number>
  // where the keys are JSON.stringify-ed lists of times
  // and the values are the frequencies
  const majorityDict = new Map<string, Map<string, number>>();
  for (let i = 0; i < env.NUMBER_OF_SCRAPES; i++) {
    // Wait a bit before starting the next round of scrapes.
    if (i > 0)
      await new Promise((re) => setTimeout(re, env.INTER_SCRAPE_WAIT_INTERVAL));

    const tempLocations = await parser.process();

    for (const location of tempLocations) {
      console.log(location.name);
      const timesString = JSON.stringify(location.times);
      if (!majorityDict.has(location.name!)) {
        majorityDict.set(location.name!, new Map<string, number>());
      }
      const subDict = majorityDict.get(location.name!)!;
      subDict.set(timesString, (subDict.get(timesString) ?? 0) + 1);
    }

    // On the first scrape, also populate the locations array.
    // This is to get all the descriptions and menus and such.
    // We will replace the times after populating majorityDict.
    if (i == 0) {
      locations = tempLocations;
    }
  }

  for (const location of locations) {
    const subDict = majorityDict.get(location.name!)!;
    let pluralityTimes: string = "";
    let pluralityFrequency: number = 0;
    subDict.forEach((freq, times) => {
      if (freq > pluralityFrequency) {
        pluralityTimes = times;
        pluralityFrequency = freq;
      }
    });
    console.log(`${location.name!} frequencies: ${subDict.values().toArray()}`);
    location.times = JSON.parse(pluralityTimes);
  }

  if (
    cachedLocations !== undefined &&
    locations.length < cachedLocations.length - 1
  ) {
    console.log(
      "Ignored location fetch since it (likely) has missing data",
      locations
    );
  } else {
    cachedLocations = locations;
    console.log("Dining API cache reloaded");
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
