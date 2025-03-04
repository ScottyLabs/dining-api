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
  times: ITimeRange[];
  todaysSpecials?: ISpecial[];
  todaysSoups?: ISpecial[];
}
export interface ISpecial {
  title: string;
  description: string;
}

export interface ITimeMoment {
  day: DayOfTheWeek;
  hour: number;
  minute: number;
}

export interface ITimeRange {
  start: ITimeMoment;
  end: ITimeMoment;
}
export interface ICoordinate {
  lat: number;
  lng: number;
}

export interface ILocationCoordinateOverwrites {
  [conceptId: string]: {
    labelLatitude: number;
    labelLongitude: number;
  };
}

export enum DayOfTheWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
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
  DAY = "DAY",
  DATE = "DATE",
  TIME = "TIME",
  CLOSED = "CLOSED",
  TWENTYFOURHOURS = "TWENTYFOURHOURS",
}
