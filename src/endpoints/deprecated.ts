import Elysia from "elysia";

const deprecatedNotice: ILocationOld[] = [
  {
    acceptsOnlineOrders: false,
    conceptId: -1111,
    description:
      "Please use the new https://api.cmueats.com/v2/locations endpoint. See /openapi for schema details",
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
export const deprecatedEndpoints = new Elysia();

deprecatedEndpoints.get(
  "/locations",
  async () => ({ locations: deprecatedNotice }),
  {
    detail: {
      tags: ["Deprecated"],
      hide: true,
    },
  }
);

deprecatedEndpoints.get(
  "/location/:name",
  async ({ params: { name } }) => {
    const filteredLocation = deprecatedNotice.filter((location) => {
      return location.name?.toLowerCase().includes(name.toLowerCase());
    });
    return {
      locations: filteredLocation,
    };
  },
  {
    detail: {
      hide: true,
    },
  }
);

deprecatedEndpoints.get(
  "/locations/time/:day/:hour/:min",
  async ({ params: { day, hour, min } }) => {
    const result = deprecatedNotice.filter((el) => {
      let returning = false;
      el.times.forEach((element) => {
        const startMins =
          element.start.day * 1440 +
          element.start.hour * 60 +
          element.start.minute;
        const endMins =
          element.end.day * 1440 + element.end.hour * 60 + element.end.minute;
        const currentMins =
          parseInt(day) * 1440 + parseInt(hour) * 60 + parseInt(min);
        if (currentMins >= startMins && currentMins < endMins) {
          returning = true;
        }
      });
      return returning;
    });
    return { locations: result };
  },
  {
    detail: {
      hide: true,
    },
  }
);
