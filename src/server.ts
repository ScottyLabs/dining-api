import { Hono }  from 'hono';
import { cors } from 'hono/cors';
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

const app = new Hono();

app.use(cors());

app.get("/", (c) => {
  return c.text("ScottyLabs Dining API");
});

app.get("/locations", (c) => {
  return c.json({ locations: cached });
});

app.get("/location/:name", (c) => {
  const filteredLocation = cached.filter((location) => {
    return location.name?.toLowerCase().includes(c.req.param('name').toLowerCase());
  });
  return c.json({
    locations: filteredLocation,
  });
});

app.get("/locations/time/:day/:hour/:min", (c) => {
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
        parseInt(c.req.param('day')) * 1440 +
        parseInt(c.req.param('hour')) * 60 +
        parseInt(c.req.param('min'));
      if (currentMins >= startMins && currentMins < endMins) {
        returning = true;
      }
    });
    return returning;
  });
  return c.json({ locations: result });
});

// Cache TTL: 3 hours
const interval = 1000 * 60 * 60 * 3;
setInterval(() => {
  reload().catch(console.error);
}, interval);

reload().then(() => {
  Bun.serve ({
    fetch: app.fetch,
    port: PORT
  });
  console.log("Dining API cache loaded and listening on port " + PORT);
});
