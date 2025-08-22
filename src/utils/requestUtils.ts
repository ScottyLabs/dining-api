import axios from "axios";
import { notifySlack } from "./slack";
import { env } from "env";
import { DateTime } from "luxon";
const wait = (ms: number) => {
  return new Promise((re) => setTimeout(re, ms));
};
/**
 *
 * @param url
 * @param retriesLeft
 * @returns the serverDate returned is in EST time, since that's the timezone that the dining server operates in (ex. at midnight est, the 7-day times shift to the next day.)
 */
export async function getHTMLResponse(url: URL, retriesLeft = 4) {
  try {
    if (!env.IN_TEST_MODE) console.log(`Scraping ${url}`);
    const response = await axios.get(url.toString());
    if (!env.IN_TEST_MODE)
      console.log({
        message: `Scraped ${url}`,
        html: response.data,
        url: url.toString(),
      });
    console.log(response.headers.date, new Date());
    const attemptedParsedDate = DateTime.fromRFC2822(
      response.headers.date
    ).setZone("America/New_York");
    return {
      body: response.data,
      serverDate: attemptedParsedDate.isValid
        ? attemptedParsedDate
        : (DateTime.now().setZone("America/New_York") as DateTime<true>), // date should always be valid...
    };
  } catch (err: any) {
    notifySlack(`Error scraping ${url}\n${err.stack}`);
    if (retriesLeft > 0) {
      await wait(env.AXIOS_RETRY_INTERVAL_MS);
      return await getHTMLResponse(url, retriesLeft - 1);
    } else throw err;
  }
}
