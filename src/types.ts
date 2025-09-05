export interface ILocation {
  conceptId: number;
  name: string;
  shortDescription?: string;
  description: string;
  url: string;
  menu?: string;
  location: string;
  coordinates?: ICoordinate;
  acceptsOnlineOrders: boolean;
  times: ITimeRange[];
  todaysSpecials?: ISpecial[];
  todaysSoups?: ISpecial[];
}
export interface ISpecial {
  title: string;
  description: string;
}

export interface ITimeSlot {
  /**
   * 0 - 6 where 0 = Sunday
   */
  day: number;
  hour: number;
  minute: number;
}

export interface ITimeRange {
  start: ITimeSlot;
  end: ITimeSlot;
}
export interface ICoordinate {
  lat: number;
  lng: number;
}

export interface ILocationCoordinateOverwrites {
  [conceptId: string]: ICoordinate;
}

export enum MonthOfTheYear {
  JANUARY = 1,
  FEBRUARY = 2,
  MARCH = 3,
  APRIL = 4,
  MAY = 5,
  JUNE = 6,
  JULY = 7,
  AUGUST = 8,
  SEPTEMBER = 9,
  OCTOBER = 10,
  NOVEMBER = 11,
  DECEMBER = 12,
}

export enum TimeInfoType {
  TIME = "TIME",
  CLOSED = "CLOSED",
  TWENTYFOURHOURS = "TWENTYFOURHOURS",
}
