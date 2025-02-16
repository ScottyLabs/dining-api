import puppeteer, { Browser, Page } from "puppeteer";
import { AXIOS_RETRY_INTERVAL_MS, IS_TESTING } from "../config";

const wait = (ms: number) => {
  return new Promise((re) => setTimeout(re, ms));
};

export default class Scraper {
  private browser?: Browser;
  private page?: Page;
  private initialized: Boolean = false;

  async initialize() {
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();
    this.initialized = true;
  }

  async isInitialized(): Promise<Boolean> {
    return this.initialized;
  }

  async getHTML(url: URL, retriesLeft = 4): Promise<string> {
    if (!this.initialized) {
      throw new Error("Scraper not initialized");
    }
    try {
      console.log(`Scraping ${url}`);
      await this.page!.goto(url.toString());
      if (IS_TESTING || process.env.DEV) {
        await wait(1000);
      } else {
        await wait(10000);
      }
      const response = await this.page!.content();
      console.log({
        message: `Scraped ${url}`,
        html: response,
        url: url.toString(),
      });
      return response;
    } catch (err) {
      if (!IS_TESTING) console.error(err);
      if (retriesLeft > 0) {
        await wait(AXIOS_RETRY_INTERVAL_MS);
        return await this.getHTML(url, retriesLeft - 1);
      } else throw err;
    }
  }

  async close() {
    if (!this.initialized) {
      throw new Error("Scraper not initialized");
    }
    await this.browser!.close();
  }
}
