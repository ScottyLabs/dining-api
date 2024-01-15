import { Elysia }  from 'elysia';
import { cors } from '@elysiajs/cors';
import DiningParser from "./parser/diningParser";
import { ILocation } from "./containers/locationBuilder";

const PORT = process.env.PORT ?? 5010;
let cached: ILocation[];

async function reload(): Promise<void> {
  console.log("Loading Dining API...");
  const parser = new DiningParser();
  cached = await parser.process();

  console.log("Dining API cache reloaded");
}

const app = new Elysia();

app.use(cors());

app.get("/", () => {
  return "ScottyLabs Dining API";
});

app.get("/locations", () => ({ locations: cached }));

app.get("/location/:name", ({ params: { name } }) => {
  const filteredLocation = cached.filter((location) => {
    return location.name?.toLowerCase().includes(name.toLowerCase());
  });
  return ({
    locations: filteredLocation,
  });
});

app.get("/locations/time/:day/:hour/:min", ({ params: { day, hour, min } }) => {
  const result = cached.filter((el) => {
    let returning = false;
    el.times?.forEach((element) => {
      const startMins =
        element.start.day * 1440 +
        element.start.hour * 60 +
        element.start.minute;
      const endMins =
        element.end.day * 1440 + element.end.hour * 60 + element.end.minute;
        const currentMins =
        parseInt(day) * 1440 +
        parseInt(hour) * 60 +
        parseInt(min);
      if (currentMins >= startMins && currentMins < endMins) {
        returning = true;
      }
    });
    return returning;
  });
  return ({ locations: result });
});

// Cache TTL: 3 hours
const interval = 1000 * 60 * 60 * 3;
setInterval(() => {
  reload().catch(console.error);
}, interval);

reload().then(() => {
  app.listen(PORT);

  console.log(
    `Dining API is running at ${app.server?.hostname}:${app.server?.port}`
  );
});
