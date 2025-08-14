import { ILocation, ITimeRange } from "types";

import axios from "axios";
import { env } from "env";

const APPLE_MAPKIT_API_KEY = env.APPLE_MAPKIT_API_KEY;

async function getLocationHours(placeId: string): Promise<ITimeRange[]> {
  const url = `https://maps-api.apple.com/v1/place/${placeId}`;
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${APPLE_MAPKIT_API_KEY}`,
    },
  });

  const hours = response.data.hours;

  return hours.map((hrs: any) => {
    const [openHour, openMinute] = hrs.open.split(":").map(Number);
    const [closeHour, closeMinute] = hrs.close.split(":").map(Number);
    return {
      start: { day: hrs.day, hour: openHour, minute: openMinute },
      end: { day: hrs.day, hour: closeHour, minute: closeMinute },
    };
  });
}

export async function manualLocations(): Promise<ILocation[]> {
  return [
    {
      conceptId: 9998,
      name: "Subway",
      shortDescription:
        "Off-Campus, Flex-only location serving sandwiches, wraps, and salads.",
      description:
        "Casual counter-serve chain for build-your-own sandwiches & salads, with health-conscious options. Accepts CMU Flex and DineX dollars",
      url: "https://www.subway.com/en-us/",
      location: "Off-Campus",
      menu: "https://www.subway.com/en-us/menunutrition/menu",
      coordinates: { lat: 40.44468, lng: -79.94888 },
      acceptsOnlineOrders: false,
      times: await getLocationHours("ICD9EF6DD5983D114"),
      todaysSpecials: [],
      todaysSoups: [],
    },
    {
      conceptId: 9999,
      name: "Vocelli Pizza",
      shortDescription:
        "Off-Campus, Flex-only location serving pizza and Italian dishes. Delivers to on-campus locations.",
      description:
        "Pittsburgh-based chain serving artisanal pizzas & other Italian sandwiches & salads. Accepts CMU Flex and DineX dollars and delivers to on-campus locations.",
      url: "https://www.vocellipizza.com/",
      location: "Off-Campus",
      menu: "https://www.vocellipizza.com/menu",
      coordinates: { lat: 40.454081, lng: -79.948794 },
      acceptsOnlineOrders: true,
      times: await getLocationHours("IE8B037C904D02263"),
      todaysSpecials: [],
      todaysSoups: [],
    },
  ];
}
