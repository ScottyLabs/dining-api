import { DBType } from "db/db";
import { addLocationDataToDb } from "db/updateLocation";
import { env } from "env";
import DiningParser from "parser/diningParser";
import { ILocation } from "types";
import { getDiffsBetweenLocationData } from "utils/diff";
import ScrapeResultMerger from "utils/locationMerger";
import { notifySlack } from "utils/slack";

/** only used for Slack debug diff logging */
let cachedLocations: ILocation[] = [];
export async function refreshDB(db: DBType): Promise<void> {
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
      finalLocations.map((location) => addLocationDataToDb(db, location))
    );
  }
}
