import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import DiningParser from "./parser/diningParser";
import { ILocation } from "types";

const PORT = process.env.PORT ?? 5010;
let cachedLocations: ILocation[];

async function reload(): Promise<void> {
  const now = new Date();
  console.log(`Reloading Dining API: ${now}`);
  const parser = new DiningParser();
  const locations = await parser.process();
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

// Check the time every 10 minutes and reload if between 11:45 and 11:55PM.
// Doing this avoids problems with daylight saving time.
// We choose this range of times to avoid "edge cases"
// (for example, we don't want to start scraping at 11:59:59).
const interval = 1000 * 60 * 10;
setInterval(() => {
  // ensure we get the correct time zone
  // TODO: can anyone find a better solution to this...
  const timeStr: String = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    timeZone: "America/New_York",
  }); // this returns a string [hours]:[minutes]
  const hm = timeStr.split(":").map((x) => parseInt(x));
  const hr = hm[0];
  const min = hm[1];
  if (hr == 23 && 45 <= min && min < 55) {
    reload().catch(console.error);
  }
}, interval);

reload().then(() => {
  app.listen(PORT);

  console.log(
    `Dining API is running at ${app.server?.hostname}:${app.server?.port}`
  );
});
