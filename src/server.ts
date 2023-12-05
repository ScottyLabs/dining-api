import express from "express";
import cors from "cors";
import DiningParser from "./parser/diningParser";
import { ILocation } from "./containers/locationBuilder";

const PORT = process.env.PORT ?? 5010;
let cached: ILocation[];

async function reload(callback?: () => void): Promise<void> {
  try {
    const parser = new DiningParser();
    cached = await parser.process();
    cached.forEach((location) => {
      location.times.sort((timeA, timeB) => {
        const startA = timeA.start;
        const startB = timeB.start;

        if (startA.day !== startB.day) return startA.day - startB.day;
        if (startA.hour !== startB.hour) return startA.hour - startB.hour;
        return startA.minute - startB.minute;
      });
    });

    if (callback) {
      callback();
    }

    console.log("Dining API cache reloaded");
  } catch (err) {
    console.error(err);
  }
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
setInterval(reload, interval);

reload(() => {
  app.listen(PORT, () => {
    console.log("Dining API cache loaded and listening on port " + PORT);
  });
});
