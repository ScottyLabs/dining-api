import { DayOfTheWeek } from "../utils/timeUtils";
import Coordinate from "../utils/coordinate";
import { SpecialSchema } from "./specials/specialsBuilder";

export interface ILocation {
  conceptId: number;
  name?: string;
  shortDescription?: string;
  description: string;
  url: string;
  menu?: string;
  location: string;
  coordinates?: Coordinate;
  acceptsOnlineOrders: boolean;
  times: TimeSchema[];
  todaysSpecials?: SpecialSchema[];
  todaysSoups?: SpecialSchema[];
}

interface MomentTimeSchema {
  day: DayOfTheWeek;
  hour: number;
  minute: number;
}

export interface TimeSchema {
  start: MomentTimeSchema;
  end: MomentTimeSchema;
}

/**
 * For building the location data structure
 */
export default class LocationBuilder {
  static readonly CONCEPT_BASE_LINK =
    "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/";

  private conceptId: number;
  private name?: string;
  private shortDescription?: string;
  private description?: string;
  private url?: string;
  private location?: string;
  private menu?: string;
  private coordinates?: Coordinate;
  private acceptsOnlineOrders?: boolean;
  private times?: TimeSchema[];
  private specials?: SpecialSchema[];
  private soups?: SpecialSchema[];

  constructor(conceptId: number) {
    this.conceptId = conceptId;
  }

  setName(name: string): LocationBuilder {
    this.name = name;
    return this;
  }

  setShortDesc(shortDesc: string): LocationBuilder {
    this.shortDescription = shortDesc;
    return this;
  }

  setDesc(desc: string): LocationBuilder {
    this.description = desc;
    return this;
  }

  setCoordinates(coordinates: Coordinate): LocationBuilder {
    this.coordinates = coordinates;
    return this;
  }

  setLocation(location: string): LocationBuilder {
    this.location = location;
    return this;
  }

  setAcceptsOnlineOrders(acceptsOnlineOrders: boolean) {
    this.acceptsOnlineOrders = acceptsOnlineOrders;
    return this;
  }

  setURL(url: string) {
    this.url = url;
    return this;
  }

  setMenu(menuLink: string) {
    this.menu = menuLink;
    return this;
  }

  setTimes(times: TimeSchema[]) {
    this.times = times;
    return this;
  }

  setSpecials(specials: SpecialSchema[]) {
    this.specials = specials;
    return this;
  }

  setSoups(soups: SpecialSchema[]) {
    this.soups = soups;
    return this;
  }

  getConceptLink(): string {
    return LocationBuilder.CONCEPT_BASE_LINK + this.conceptId;
  }

  getName(): string | undefined {
    return this.name;
  }

  build(): ILocation {
    if (this.times === undefined || this.acceptsOnlineOrders === undefined || this.description === undefined
      || this.url === undefined || this.location === undefined) throw Error("Didn't finish configuring restaurant before building metadata!");

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
