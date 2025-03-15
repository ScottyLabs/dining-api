import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import DiningParser from "./parser/diningParser";
import { ILocation } from "types";

const PORT = process.env.PORT ?? 5010;
let cachedLocations: ILocation[];

const NUMBER_SCRAPES = 10;
const SCRAPE_WAIT_INTERVAL = 5000;

async function reload(): Promise<void> {
  const now = new Date();
  console.log(`Reloading Dining API: ${now}`);
  const parser = new DiningParser();
  let locations: ILocation[] = [];

  // majorityDict.get(restaurantId) is a Map<string, number>
  // where the keys are JSON.stringify-ed locations
  // and the values are the frequencies.
  const majorityDict = new Map<number, Map<string, number>>();
  for (let i = 0; i < NUMBER_SCRAPES; i++) {
    // Wait a bit before starting the next round of scrapes.
    await new Promise((re) => setTimeout(re, SCRAPE_WAIT_INTERVAL));

    const tempLocations = await parser.process();
    for (const location of tempLocations) {
      const locationString = JSON.stringify(location);
      if (!majorityDict.has(location.conceptId)) {
        majorityDict.set(location.conceptId, new Map<string, number>());
      }
      const subDict = majorityDict.get(location.conceptId)!;
      subDict.set(locationString, (subDict.get(locationString) ?? 0) + 1);
    }
  }

  // Populate the location array based on majorityDict.
  majorityDict.forEach((subDict, _) => {
    let pluralityLocationString: string = "";
    let pluralityFrequency: number = 0;
    subDict.forEach((freq, locationString) => {
      if (freq > pluralityFrequency) {
        pluralityLocationString = locationString;
        pluralityFrequency = freq;
      }
    });
    const location: ILocation = JSON.parse(pluralityLocationString);
    console.log(`${location.name ?? ""} frequencies: ${subDict.values().toArray()}`);
    locations.push(location);
  });

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

export const app = new Elysia();

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
    el.times?.forEach((element) => {
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
const interval = 1000 * 60 * 30;
setInterval(() => {
  reload().catch(console.error);
}, interval);

// Initial load and start the server
reload().then(() => {
  app.listen(PORT);

  console.log(
    `Dining API is running at ${app.server?.hostname}:${app.server?.port}`
  );
});
