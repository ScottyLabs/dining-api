import { getHTMLResponse } from "../utils/requestUtils";
import { CheerioAPI, load } from "cheerio";
import LocationBuilder, { ILocation } from "../containers/locationBuilder";
import Coordinate from "../utils/coordinate";
import TimeBuilder from "../containers/timeBuilder";
import SpecialsBuilder, {
  SpecialSchema,
} from "../containers/specials/specialsBuilder";
import locationOverwrites from "../overwrites/locationOverwrites";

/**
 * Retrieves the HTML from the CMU Dining website and parses the information
 * found in it.
 */
export default class DiningParser {
  static readonly DINING_URL =
    "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/?page=listConcepts";
  static readonly DINING_SPECIALS_URL =
    "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Specials";
  static readonly DINING_SOUPS_URL =
    "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Soups";
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
      const conceptId = onClickAttr?.match(/Concept\/(\d+)/)?.[1];
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
    const latitude = locationUrl.slice(0, commaIndex);
    const longitude = locationUrl.slice(commaIndex + 1, locationUrl.length);
    return [parseFloat(latitude), parseFloat(longitude)];
  }

  private async retrieveDetailedInfoForLocation(builder: LocationBuilder) {
    const conceptLink = builder.getConceptLink();
    const conceptHTML = await getHTMLResponse(new URL(conceptLink));
    const $ = load(conceptHTML);
    builder.setURL(conceptLink);
    const description = $("div.description p").text().trim();
    builder.setDesc(description);

    const menuHref = $("div.navItems > a#getMenu").attr("href");
    if (menuHref) {
      builder.setMenu(menuHref);
    }

    builder.setLocation($("div.location a").text().trim());
    const locationHref = $("div.location a").attr("href");
    const name = builder.getName();

    if (name !== undefined && locationOverwrites[name] !== undefined) {
      builder.setCoordinates(locationOverwrites[name]);
    } else if (locationHref !== undefined) {
      const [lat, lng] = this.convertMapsLinkToCoordinates(locationHref);
      builder.setCoordinates(new Coordinate(lat, lng));
    }

    const timeBuilder = new TimeBuilder();
    const nextSevenDays = $("ul.schedule").find("li").toArray();
    for (const day of nextSevenDays) {
      const dayStr = load(day)("strong").text();
      const dataStr = load(day)
        .text()
        .replace(/\s\s+/g, " ")
        .replace(dayStr, "")
        .trim();
      const dataArr = dataStr.split(",");

      timeBuilder.addSchedule([dayStr, ...dataArr]);
    }
    builder.setTimes(timeBuilder.build());

    const onlineDiv = $("div.navItems.orderOnline").toArray();
    builder.setAcceptsOnlineOrders(onlineDiv.length > 0);
  }

  private async retrieveSpecials(
    url: URL
  ): Promise<Map<string, SpecialSchema[]>> {
    const specialsHTML = await getHTMLResponse(url);
    const $ = load(specialsHTML);
    const cards = $("div.card").toArray();

    const locationSpecialMap = new Map<string, SpecialSchema[]>();

    for (const card of cards) {
      const name = load(card)("h3.name").text().trim();
      const specialsList = load(card)("div.specialDetails").toArray();
      const specialsBuilder = new SpecialsBuilder();
      for (const special of specialsList) {
        const header = load(special)("strong").text().trim();
        const specialItemList = load(special)("li")
          .text()
          .replace(header, "")
          .trim();
        specialsBuilder.addSpecial(
          header,
          specialItemList.length > 0 ? specialItemList : undefined
        );
      }
      locationSpecialMap.set(name, specialsBuilder.build());
    }
    return locationSpecialMap;
  }

  async process(): Promise<ILocation[]> {
    await this.preprocess();
    const locationInfo = this.retrieveBasicLocationInfo();

    const [specials, soups] = await Promise.all([
      this.retrieveSpecials(new URL(DiningParser.DINING_SPECIALS_URL)),
      this.retrieveSpecials(new URL(DiningParser.DINING_SOUPS_URL)),
    ]);

    for (const builder of locationInfo) {
      const name = builder.getName();
      if (name !== undefined) {
        const specialList = specials.get(name);
        const soupList = soups.get(name);

        if (Array.isArray(specialList)) {
          builder.setSpecials(specialList);
        }

        if (Array.isArray(soupList)) {
          builder.setSoups(soupList);
        }
      }

      try {
        await this.retrieveDetailedInfoForLocation(builder);
      } catch (error) {
        console.error(`Failed to retrieve detailed info for ${name}:`, error);
        builder.invalidate();
      }
    }

    return locationInfo
      .filter((builder) => builder.isValid())
      .map((builder) => builder.build());
  }
}
