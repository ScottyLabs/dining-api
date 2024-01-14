import express from "express";
import cors from "cors";
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

const app = express();

app.use(cors());

app.get("/", (_req, res) => {
  res.send("ScottyLabs Dining API");
});

app.get("/locations", (_req, res) => {
  res.json({ locations: cached });
});

app.get("/location/:name", (req, res) => {
  const filteredLocation = cached.filter((location) => {
    return location.name?.toLowerCase().includes(req.params.name.toLowerCase());
  });
  res.json({
    locations: filteredLocation,
  });
});

app.get("/location/time/:day/:hour/:min", (req, res) => {
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
        parseInt(req.params.day) * 1440 +
        parseInt(req.params.hour) * 60 +
        parseInt(req.params.min);
      if (currentMins >= startMins && currentMins < endMins) {
        returning = true;
      }
    });
    return returning;
  });
  res.json({ locations: result });
});

// Cache TTL: 3 hours
const interval = 1000 * 60 * 60 * 3;
setInterval(() => {
  reload().catch(console.error);
}, interval);

reload().then(() => {
  app.listen(PORT, () => {
    console.log("Dining API cache loaded and listening on port " + PORT);
  });
});
