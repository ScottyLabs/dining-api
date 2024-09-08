import { DayOfTheWeek } from "../utils/timeUtils";
import { ISpecial } from "./specials/specialsBuilder";

export interface ILocation {
  conceptId: number;
  name?: string;
  shortDescription?: string;
  description: string;
  url: string;
  menu?: string;
  location: string;
  coordinates?: ICoordinate;
  acceptsOnlineOrders: boolean;
  times: ITime[];
  todaysSpecials?: ISpecial[];
  todaysSoups?: ISpecial[];
}

interface IMomentTime {
  day: DayOfTheWeek;
  hour: number;
  minute: number;
}

export interface ITime {
  start: IMomentTime;
  end: IMomentTime;
}
export interface ICoordinate {
  lat: number;
  lng: number;
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
  private coordinates?: ICoordinate;
  private acceptsOnlineOrders?: boolean;
  private times?: ITime[];
  private specials?: ISpecial[];
  private soups?: ISpecial[];
  private valid: boolean = true;

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

  setCoordinates(coordinates: ICoordinate): LocationBuilder {
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

  setTimes(times: ITime[]) {
    this.times = times;
    return this;
  }

  setSpecials(specials: ISpecial[]) {
    this.specials = specials;
    return this;
  }

  setSoups(soups: ISpecial[]) {
    this.soups = soups;
    return this;
  }

  getConceptLink(): string {
    return LocationBuilder.CONCEPT_BASE_LINK + this.conceptId;
  }

  getName(): string | undefined {
    return this.name;
  }
  invalidate() {
    this.valid = false;
  }
  isValid() {
    return this.valid;
  }
  build(): ILocation {
    if (!this.valid) throw Error("Location has been invalidated!");
    if (
      this.times === undefined ||
      this.acceptsOnlineOrders === undefined ||
      this.description === undefined ||
      this.url === undefined ||
      this.location === undefined
    ) {
      throw Error(
        "Didn't finish configuring restaurant before building metadata!"
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
