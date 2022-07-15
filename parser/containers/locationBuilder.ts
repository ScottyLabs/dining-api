import Coordinate from "../utils/coordinate";

interface ILocation {
  conceptId: number;
  name?: string;
  shortDescription?: string;
  description?: string;
  menu?: string;
  location?: string;
  coordinates?: Coordinate;
  acceptsOnlineOrders?: boolean;
}

export default class LocationBuilder {
  static readonly CONCEPT_BASE_LINK =
    "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/?page=conceptDetails&conceptId=";

  private conceptId: number;
  private name?: string;
  private shortDescription?: string;
  private description?: string;
  private location?: string;
  private menu?: string;
  private coordinates?: Coordinate;
  private acceptsOnlineOrders?: boolean;

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

  setMenu(menuLink: string) {
    this.menu = menuLink;
    return this;
  }

  getConceptLink(): string {
    return LocationBuilder.CONCEPT_BASE_LINK + this.conceptId;
  }

  build(): ILocation {
    return {
      conceptId: this.conceptId,
      name: this.name,
      shortDescription: this.shortDescription,
      description: this.description,
      location: this.location,
      menu: this.menu,
      coordinates: this.coordinates,
      acceptsOnlineOrders: this.acceptsOnlineOrders,
    };
  }
}
