import axios from "axios";
import { ITimeRange, DayOfTheWeek } from "../types";
import { env } from "../env";

/**
 * Fetches place details including opening hours from Google Places API (New)
 */
export async function getPlaceDetails(placeId: string) {
  if (!env.GOOGLE_PLACES_API_KEY) {
    throw new Error("GOOGLE_PLACES_API_KEY not configured");
  }

  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": "AIzaSyBHV2QtCm37lzgUIXYArsNYBpeSMWPmg88", //env.GOOGLE_PLACES_API_KEY,
    "X-Goog-FieldMask": "regularOpeningHours,displayName,formattedAddress",
  };

  try {
    console.log("getting details");
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching place details:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);
    throw error;
  }
}

/**
 * Converts Google Places opening hours to ITimeRange format
 */
export function convertGoogleHoursToTimeRanges(
  openingHours: any
): ITimeRange[] {
  if (!openingHours?.periods) {
    console.log("No opening hours periods found");
    return [];
  }

  const timeRanges: ITimeRange[] = [];

  for (const period of openingHours.periods) {
    if (!period.open) continue;

    // Google uses the same enum as DayOfTheWeek
    const startDay = period.open.day;
    const startHour = period.open.hour;
    const startMinute = period.open.minute;

    // Handle closing time
    let endDay = startDay;
    let endHour = 23;
    let endMinute = 59;

    if (period.close) {
      endDay = period.close.day;
      endHour = period.close.hour;
      endMinute = period.close.minute;
    }

    timeRanges.push({
      start: {
        day: startDay as DayOfTheWeek,
        hour: startHour,
        minute: startMinute,
      },
      end: {
        day: endDay as DayOfTheWeek,
        hour: endHour,
        minute: endMinute,
      },
    });
  }

  return timeRanges;
}
/**
 * Fetches opening hours for a location from Google Maps URL
 */
export async function getHoursFromMapsUrl(
  placeID: string
): Promise<ITimeRange[]> {
  const placeDetails = await getPlaceDetails(placeID);
  return convertGoogleHoursToTimeRanges(placeDetails.regularOpeningHours);
}
