import { Element, load } from "cheerio";
import { getHTMLResponse } from "utils/requestUtils";
import { LocationOverwrites } from "overwrites/locationOverwrites";
import { getTimeRangesFromString } from "./timeBuilder";
import { ICoordinate, ILocation, ISpecial, ITimeRange } from "../types";
import { sortAndMergeTimeRanges } from "utils/timeUtils";

/**
 * For building the location data structure
 */
export default class LocationBuilder {
  static readonly CONCEPT_BASE_LINK =
    "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/";

  private conceptId?: number;
  private name?: string;
  private shortDescription?: string;
  private description?: string;
  private url?: string;
  private location?: string;
  private menu?: string;
  private coordinates?: ICoordinate;
  private acceptsOnlineOrders?: boolean;
  private times?: ITimeRange[];
  private specials?: ISpecial[];
  private soups?: ISpecial[];

  constructor(card: Element) {
    const link = load(card)("h3.name.detailsLink");
    this.name = link.text().trim();

    const conceptId = link.attr("onclick")?.match(/Concept\/(\d+)/)?.[1];
    this.conceptId = conceptId !== undefined ? parseInt(conceptId) : undefined;

    this.shortDescription = load(card)("div.description").text().trim();
  }
  overwriteLocation(locationOverwrites: LocationOverwrites) {
    if (
      this.name !== undefined &&
      locationOverwrites[this.name] !== undefined
    ) {
      this.coordinates = locationOverwrites[this.name];
    }
  }
  setSoup(soupList: Record<string, ISpecial[]>) {
    if (this.name && soupList[this.name] !== undefined) {
      this.soups = soupList[this.name];
    }
  }
  setSpecials(specialList: Record<string, ISpecial[]>) {
    if (this.name && specialList[this.name] !== undefined) {
      this.specials = specialList[this.name];
    }
  }
  convertMapsLinkToCoordinates(link: string) {
    const atIndex = link.indexOf("@");
    const locationUrl = link.slice(atIndex + 1, link.length);
    const commaIndex = locationUrl.indexOf(",");
    const latitude = locationUrl.slice(0, commaIndex);
    const longitude = locationUrl.slice(commaIndex + 1, locationUrl.length);
    return { lat: parseFloat(latitude), lng: parseFloat(longitude) };
  }

  async populateDetailedInfo() {
    const conceptURL = this.getConceptLink();
    if (!conceptURL) return;

    const $ = load(await getHTMLResponse(conceptURL));
    this.url = conceptURL.toString();
    this.description = $("div.description p").text().trim();
    this.menu = $("div.navItems > a#getMenu").attr("href");
    this.location = $("div.location a").text().trim();
    this.acceptsOnlineOrders =
      $("div.navItems.orderOnline").toArray().length > 0;

    const locationHref = $("div.location a").attr("href");
    if (locationHref !== undefined) {
      this.coordinates = this.convertMapsLinkToCoordinates(locationHref);
    }

    const nextSevenDays = $("ul.schedule").find("li").toArray();
    this.times = sortAndMergeTimeRanges(
      nextSevenDays.flatMap((rowHTML) => getTimeRangesFromString(rowHTML))
    );
  }
  getConceptLink() {
    if (this.conceptId === undefined) return undefined;
    return new URL(LocationBuilder.CONCEPT_BASE_LINK + this.conceptId);
  }

  build(): ILocation {
    if (
      this.times === undefined ||
      this.acceptsOnlineOrders === undefined ||
      this.description === undefined ||
      this.url === undefined ||
      this.location === undefined ||
      this.conceptId === undefined
    ) {
      throw Error(
        "Didn't finish configuring location before building metadata!"
      );
      // All fetches were good - yet we have missing data. This is a problem.
    }

    return {
      conceptId: this.conceptId,
      name: this.name,
      shortDescription: this.shortDescription,
      description: this.description,
      url: this.url,
      location: this.location,
      menu: this.menu,
      coordinates: this.coordinates,
      acceptsOnlineOrders: this.acceptsOnlineOrders,
      times: this.times,
      todaysSpecials: this.specials,
      todaysSoups: this.soups,
    };
  }
}
