import axios from "axios";
import { notifySlack } from "./slack";
import { env } from "env";

const wait = (ms: number) => {
  return new Promise((re) => setTimeout(re, ms));
};

export async function getHTMLResponse(
  url: URL,
  retriesLeft = 4
): Promise<string> {
  try {
    if (!env.IN_TEST_MODE) console.log(`Scraping ${url}`);
    const response = await axios.get(url.toString());
    if (!env.IN_TEST_MODE)
      console.log({
        message: `Scraped ${url}`,
        html: response.data,
        url: url.toString(),
      });

    return response.data;
  } catch (err: any) {
    notifySlack(`Error scraping ${url}\n${err.stack}`);
    if (retriesLeft > 0) {
      await wait(env.AXIOS_RETRY_INTERVAL_MS);
      return await getHTMLResponse(url, retriesLeft - 1);
    } else throw err;
  }
}
