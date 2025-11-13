export const deprecatedNotice: ILocationOld[] = [
  {
    acceptsOnlineOrders: false,
    conceptId: -1111,
    description: "Please use the new /api/v2/locations endpoint",
    name: "This api format has been deprecated",
    location: "Now",
    times: [],
    url: "https://cmueats.com",
  },
];

interface ILocationOld {
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
interface ISpecial {
  title: string;
  description: string;
}

interface ITimeSlot {
  day: number;
  hour: number;
  minute: number;
}

interface ITimeRange {
  start: ITimeSlot;
  end: ITimeSlot;
}
interface ICoordinate {
  lat: number;
  lng: number;
}
