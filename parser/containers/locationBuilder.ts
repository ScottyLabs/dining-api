import Coordinate from "../utils/coordinate";

interface ILocation {
  name: string;
  shortDescription: string;
  description: string;
  location: string;
  coordinates: Coordinate;
  acceptsOnlineOrders: boolean;
}

export default class LocationBuilder {
  private name: string;
  private shortDescription: string;
  private description: string;
  private location: string;
  private coordinates: Coordinate;
  private acceptsOnlineOrders: boolean;

  constructor() {}

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

  build(): ILocation {
    return {
      name: this.name,
      shortDescription: this.shortDescription,
      description: this.description,
      location: this.location,
      coordinates: this.coordinates,
      acceptsOnlineOrders: this.acceptsOnlineOrders,
    };
  }
}
