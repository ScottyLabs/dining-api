import { getHTMLResponse } from "../utils/requestUtils";
import { load } from "cheerio";
import LocationBuilder from "../containers/locationBuilder";
import { retrieveSpecials } from "../containers/specials/specialsBuilder";
import locationOverwrites from "overwrites/locationOverwrites";
import { ILocation } from "types";

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

  constructor() {}

  private getBasicLocationInfo(mainPageHTML: string): LocationBuilder[] {
    const mainContainer = load(mainPageHTML)("div.conceptCards");
    if (mainContainer === undefined) {
      throw new Error("Unable to load page");
    }
    const linkHeaders = mainContainer.find("div.card");
    if (linkHeaders === undefined) {
      return [];
    }
    return Array.from(linkHeaders).map((card) => new LocationBuilder(card));
  }

  async process(): Promise<ILocation[]> {
    const locationBuilders = this.getBasicLocationInfo(
      await getHTMLResponse(new URL(DiningParser.DINING_URL))
    );

    const [specials, soups] = await Promise.all([
      retrieveSpecials(
        await getHTMLResponse(new URL(DiningParser.DINING_SPECIALS_URL))
      ),
      retrieveSpecials(
        await getHTMLResponse(new URL(DiningParser.DINING_SOUPS_URL))
      ),
    ]);

    for (const builder of locationBuilders) {
      await builder.populateDetailedInfo(getHTMLResponse);
      builder.setSoup(soups);
      builder.setSpecials(specials);
      builder.overwriteLocation(locationOverwrites);
    }

    return locationBuilders.map((builder) => builder.build());
  }
}
