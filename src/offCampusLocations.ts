import { ILocation, ITimeRange } from "./types";
import { getHoursFromMapsUrl } from "./utils/googlePlaces";

interface OffCampusLocationConfig {
  conceptId: number;
  name: string;
  shortDescription?: string;
  description: string;
  url: string;
  location: string;
  coordinates: { lat: number; lng: number };
  placeID: string; // Google Maps placeID https://developers.google.com/maps/documentation/places/web-service/place-id
  acceptsOnlineOrders: boolean;
  menu?: string;
}

// Configuration for off-campus locations
const offCampusConfigs: OffCampusLocationConfig[] = [
  {
    conceptId: 1000,
    name: "Subway",
    shortDescription: "Fresh sandwiches and salads",
    description:
      "Casual counter-serve chain for build-your-own sandwiches & salads, with health-conscious options.",
    url: "https://restaurants.subway.com/united-states/pa/pittsburgh/418-s-craig-st",
    location: "418 S Craig Street",
    coordinates: { lat: 40.44599962703451, lng: -79.94919324906529 },
    placeID: "ChIJaZRsnybyNIgRWid8HF7P3VM",
    acceptsOnlineOrders: true,
    menu: "https://www.subway.com/en-us/menunutrition/menu",
  },
  {
    conceptId: 1001,
    name: "Vocelli Pizza",
    shortDescription: "Classic Italian Qualitiy Pizza",
    description:
      "East Coast-based chain serving artisanal pizzas & other Italian sandwiches & salads.",
    url: "https://www.vocellipizza.com/",
    location: "4740 Baum Blvd",
    coordinates: { lat: 40.45408790404438, lng: -79.94888634802547 },
    placeID: "ChIJEVREwDvyNIgR5I1spfNKEVY",
    acceptsOnlineOrders: true,
    menu: "https://www.vocellipizza.com/menu/pizza/",
  },
];

/**
 * Builds off-campus locations with hours fetched from Google Places API
 */
export async function buildOffCampusLocations(): Promise<ILocation[]> {
  const locations: ILocation[] = [];

  for (const config of offCampusConfigs) {
    let times: ITimeRange[] = [];

    // Try to fetch hours from Google Places API
    try {
      console.log(`Fetching hours for ${config.name} from Google Places...`);
      const googleHours = await getHoursFromMapsUrl(config.placeID);
      if (googleHours.length > 0) {
        times = googleHours;
        console.log(
          `Successfully fetched ${googleHours.length} time periods for ${config.name}`
        );
      }
    } catch (error) {
      console.warn(
        `Failed to fetch Google Places hours for ${config.name}:`,
        error
      );
      console.log(`Using fallback static hours for ${config.name}`);
    }

    // Build the location object
    const location: ILocation = {
      conceptId: config.conceptId,
      name: config.name,
      shortDescription: config.shortDescription,
      description: config.description,
      url: config.url,
      location: config.location,
      menu: config.menu,
      coordinates: config.coordinates,
      acceptsOnlineOrders: config.acceptsOnlineOrders,
      times: times,
      todaysSpecials: [],
      todaysSoups: [],
    };

    locations.push(location);
  }

  return locations;
}

// Export static locations for backwards compatibility
export const manualLocations: ILocation[] = [];
