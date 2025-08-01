import { getHTMLResponse } from "../utils/requestUtils";
import { load } from "cheerio";
import LocationBuilder from "../containers/locationBuilder";
import { retrieveSpecials } from "../containers/specials/specialsBuilder";
import { ILocation, ISpecial } from "types";
import locationCoordinateOverwrites from "overwrites/locationCoordinateOverwrites";

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

  constructor() {}

  async process(): Promise<ILocation[]> {
    const locationBuilders =
      await this.initializeLocationBuildersFromMainPage();

    const [specials, soups] = await this.fetchSpecials();

    for (const builder of locationBuilders) {
      await builder.populateDetailedInfo();
      builder.setSoup(soups);
      builder.setSpecials(specials);
      builder.overwriteLocationCoordinates(locationCoordinateOverwrites);
    }

    return locationBuilders.map((builder) => builder.build());
  }

  private async initializeLocationBuildersFromMainPage(): Promise<
    LocationBuilder[]
  > {
    const mainPageHTML = await getHTMLResponse(
      new URL(DiningParser.DINING_URL)
    );
    const mainContainer = load(mainPageHTML)("div.conceptCards");
    const linkHeaders = mainContainer.find("div.card");

    if (linkHeaders.length === 0) {
      throw new Error("Unable to load page");
    }
    return Array.from(linkHeaders).map((card) => new LocationBuilder(card));
  }

  private async fetchSpecials(): Promise<
    [Record<number, ISpecial[]>, Record<number, ISpecial[]>]
  > {
    return await Promise.all([
      retrieveSpecials(
        await getHTMLResponse(new URL(DiningParser.DINING_SPECIALS_URL))
      ),
      retrieveSpecials(
        await getHTMLResponse(new URL(DiningParser.DINING_SOUPS_URL))
      ),
    ]);
  }
}
