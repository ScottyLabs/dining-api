import axios from "axios";
import { AXIOS_RETRY_INTERVAL_MS, IS_TESTING } from "../config";

const wait = (ms: number) => {
  return new Promise((re) => setTimeout(re, ms));
};

export async function getHTMLResponse(url: URL, retriesLeft = 4): Promise<any> {
  try {
    const response = await axios.get(url.toString());
    return response.data;
  } catch (err) {
    if (!IS_TESTING) console.error(err);
    if (retriesLeft > 0) {
      await wait(AXIOS_RETRY_INTERVAL_MS);
      return await getHTMLResponse(url, retriesLeft - 1);
    } else throw err;
  }
}
