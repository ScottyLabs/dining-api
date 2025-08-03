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

  async process(includeManual: boolean = true): Promise<ILocation[]> {
    const locationBuilders =
      await this.initializeLocationBuildersFromMainPage();
    const manualLocations: ILocation[] = [
      {
        conceptId: 9998,
        name: "Subway",
        shortDescription:
          "Off-Campus, Flex-only location serving sandwiches, wraps, and salads.",
        description:
          "Casual counter-serve chain for build-your-own sandwiches & salads, with health-conscious options. Accepts CMU Flex and DineX dollars",
        url: "https://www.subway.com/en-us/",
        location: "Off-Campus",
        menu: "https://www.subway.com/en-us/menunutrition/menu",
        coordinates: { lat: 40.44468, lng: -79.94888 },
        acceptsOnlineOrders: false,
        times: [
          {
            start: { day: 0, hour: 9, minute: 0 },
            end: { day: 0, hour: 22, minute: 0 },
          },
          {
            start: { day: 1, hour: 7, minute: 0 },
            end: { day: 1, hour: 23, minute: 0 },
          },
          {
            start: { day: 2, hour: 7, minute: 0 },
            end: { day: 2, hour: 23, minute: 0 },
          },
          {
            start: { day: 3, hour: 7, minute: 0 },
            end: { day: 3, hour: 23, minute: 0 },
          },
          {
            start: { day: 4, hour: 7, minute: 0 },
            end: { day: 4, hour: 23, minute: 0 },
          },
          {
            start: { day: 5, hour: 7, minute: 0 },
            end: { day: 5, hour: 23, minute: 0 },
          },
          {
            start: { day: 6, hour: 9, minute: 0 },
            end: { day: 6, hour: 23, minute: 0 },
          },
        ],
      },
      {
        conceptId: 9999,
        name: "Vocelli Pizza",
        shortDescription:
          "Off-Campus, Flex-only location serving pizza and Italian dishes. Delivers to on-campus locations.",
        description:
          "Pittsburgh-based chain serving artisanal pizzas & other Italian sandwiches & salads. Accepts CMU Flex and DineX dollars and delivers to on-campus locations.",
        url: "https://www.vocellipizza.com/",
        location: "Off-Campus",
        menu: "https://www.vocellipizza.com/menu",
        coordinates: { lat: 40.454081, lng: -79.948794 },
        acceptsOnlineOrders: true,
        times: [
          {
            start: { day: 0, hour: 11, minute: 0 },
            end: { day: 0, hour: 22, minute: 0 },
          },
          {
            start: { day: 1, hour: 11, minute: 0 },
            end: { day: 1, hour: 22, minute: 0 },
          },
          {
            start: { day: 2, hour: 11, minute: 0 },
            end: { day: 2, hour: 22, minute: 0 },
          },
          {
            start: { day: 3, hour: 11, minute: 0 },
            end: { day: 3, hour: 22, minute: 0 },
          },
          {
            start: { day: 4, hour: 11, minute: 0 },
            end: { day: 5, hour: 0, minute: 0 },
          },
          {
            start: { day: 5, hour: 11, minute: 0 },
            end: { day: 6, hour: 2, minute: 0 },
          },
          {
            start: { day: 6, hour: 11, minute: 0 },
            end: { day: 0, hour: 2, minute: 0 },
          },
        ],
      },
    ];

    const [specials, soups] = await this.fetchSpecials();

    for (const builder of locationBuilders) {
      await builder.populateDetailedInfo();
      builder.setSoup(soups);
      builder.setSpecials(specials);
      builder.overwriteLocationCoordinates(locationCoordinateOverwrites);
    }

    return [
      ...locationBuilders.map((builder) => builder.build()),
      ...(includeManual ? manualLocations : []),
    ];
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
