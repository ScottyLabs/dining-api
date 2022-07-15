import { getHTMLResponse } from "../utils/requestUtils";
import { CheerioAPI, load } from "cheerio";
import LocationBuilder from "../../parser/containers/locationBuilder";
import Coordinate from "../../parser/utils/coordinate";

export default class DiningParser {
  static readonly DINING_BASE_URL = "https://apps.studentaffairs.cmu.edu";
  static readonly DINING_URL =
    "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/?page=listConcepts";
  static readonly DINING_SPECIALS_URL =
    "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/?page=specials";
  static readonly DINING_SOUPS_URL =
    "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/?page=soups";
  static readonly DINING_MENUS_BASE_URL =
    "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/";

  private $?: CheerioAPI;

  constructor() {}

  private async preprocess() {
    const mainPageHTML = await getHTMLResponse(
      new URL(DiningParser.DINING_URL)
    );
    this.$ = load(mainPageHTML);
  }

  private retrieveBasicLocationInfo(): LocationBuilder[] {
    const mainContainer = this.$?.("div.conceptCards");
    if (mainContainer === undefined) {
      throw new Error("Unable to load page");
    }
    const linkHeaders = mainContainer?.find("div.card");
    if (linkHeaders === undefined) {
      return [];
    }
    const info = Array.from(linkHeaders).map((card) => {
      const link = load(card)("h3.name.detailsLink");
      const onClickAttr = link.attr("onclick");
      const conceptId = onClickAttr?.match(/conceptId=(\d+)/)?.[1];
      if (conceptId === undefined) {
        return undefined;
      }
      const name = link.text().trim();
      const shortDesc = load(card)("div.description").text().trim();

      const builder = new LocationBuilder(parseInt(conceptId));
      if (name !== undefined) {
        builder.setName(name);
      }
      if (shortDesc !== undefined) {
        builder.setShortDesc(shortDesc);
      }
      return builder;
    });
    return info.filter((item): item is LocationBuilder => item !== undefined);
  }

  private convertMapsLinkToCoordinates(link: string): [number, number] {
    const atIndex = link.indexOf("@");
    const locationUrl = link.slice(atIndex + 1, link.length);
    const commaIndex = locationUrl.indexOf(",");
    const latitude = locationUrl.slice(commaIndex + 1, locationUrl.length);
    const longitude = locationUrl.slice(0, commaIndex);
    return [parseFloat(latitude), parseFloat(longitude)];
  }

  private async retrieveDetailedInfoForLocation(builder: LocationBuilder) {
    const conceptLink = builder.getConceptLink();
    const conceptHTML = await getHTMLResponse(new URL(conceptLink));
    const $ = load(conceptHTML);
    const description = $("div.description").text().trim();
    builder.setDesc(description);

    const script = $("script").contents().text();
    if (script.includes("#getMenu")) {
      const matches = script.match(/'(conceptAssets\/menus\/.+)'/);
      if (matches?.[1]) {
        builder.setMenu(DiningParser.DINING_MENUS_BASE_URL + matches?.[1]);
      }
    }

    builder.setLocation($("div.location a").text().trim());
    const locationHref = $("div.location a").attr("href");
    if (locationHref) {
      const [lat, lng] = this.convertMapsLinkToCoordinates(locationHref);
      builder.setCoordinates(new Coordinate(lat, lng));
    }
    console.log(builder);
  }

  async process() {
    await this.preprocess();
    const locationInfo = await this.retrieveBasicLocationInfo();
    for (const builder of locationInfo) {
      this.retrieveDetailedInfoForLocation(builder);
    }
  }
}
