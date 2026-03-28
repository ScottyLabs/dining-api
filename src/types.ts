export interface IDate {
  year: number;
  /** 1-12 */
  month: number;
  /** 1-31 */
  day: number;
}
export interface ILocation {
  conceptId: number;
  name: string;
  shortDescription: string | undefined;
  description: string;
  url: string;
  grubhubUrl: string | undefined;
  menu: string | undefined;
  location: string;
  coordinates: ICoordinate | undefined;
  acceptsOnlineOrders: boolean;
  /** Assuming these times fall after today */
  times: IFullTimeRange[];
  /** used when figuring out which time entries to clear in the database. (we can't just look at `times` directly to figure that out, because it might as well be empty) (also, technically if this data is in the future, times won't be cleared properly. we hope that isn't the case though) */
  today: IDate;
  todaysSpecials: ISpecial[] | undefined;
  todaysSoups: ISpecial[] | undefined;
}
export interface IGrubhubData {
  object: {
    data: {
      content: {
        entity: {
          name: string;
          address: {
            street_address: string;
            address_locality: string;
          };
          restaurant_id: string;
        };
      }[];
    };
  };
}

export interface IGrubhubAuthResponse {
  session_handle: {
    access_token: string;
    refresh_token: string;
  };
}

export interface ISpecial {
  title: string;
  description: string;
}

export interface IFullTimeRange {
  year: number;
  month: number;
  day: number;
  startMinutesFromMidnight: number;
  /** Can be less than start if the time slot wraps around to the next day (eg. 2 PM - 2 AM) */
  endMinutesFromMidnight: number;
}
export interface ICoordinate {
  lat: number;
  lng: number;
}

export interface ILocationCoordinateOverwrites {
  [conceptId: string]: ICoordinate;
}

export interface IGrubhubLinkIds {
  [conceptId: string]: string;
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
