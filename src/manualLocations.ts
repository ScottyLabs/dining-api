import { ILocation } from "types";

export const manualLocations: ILocation[] = [
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
    times: [
      {
        start: { day: 0, hour: 9, minute: 0 },
        end: { day: 0, hour: 22, minute: 0 },
      },
      {
        start: { day: 1, hour: 7, minute: 0 },
        end: { day: 1, hour: 23, minute: 0 },
      },
      {
        start: { day: 2, hour: 7, minute: 0 },
        end: { day: 2, hour: 23, minute: 0 },
      },
      {
        start: { day: 3, hour: 7, minute: 0 },
        end: { day: 3, hour: 23, minute: 0 },
      },
      {
        start: { day: 4, hour: 7, minute: 0 },
        end: { day: 4, hour: 23, minute: 0 },
      },
      {
        start: { day: 5, hour: 7, minute: 0 },
        end: { day: 5, hour: 23, minute: 0 },
      },
      {
        start: { day: 6, hour: 9, minute: 0 },
        end: { day: 6, hour: 23, minute: 0 },
      },
    ],
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
    times: [
      {
        start: { day: 0, hour: 11, minute: 0 },
        end: { day: 0, hour: 22, minute: 0 },
      },
      {
        start: { day: 1, hour: 11, minute: 0 },
        end: { day: 1, hour: 22, minute: 0 },
      },
      {
        start: { day: 2, hour: 11, minute: 0 },
        end: { day: 2, hour: 22, minute: 0 },
      },
      {
        start: { day: 3, hour: 11, minute: 0 },
        end: { day: 3, hour: 22, minute: 0 },
      },
      {
        start: { day: 4, hour: 11, minute: 0 },
        end: { day: 5, hour: 0, minute: 0 },
      },
      {
        start: { day: 5, hour: 11, minute: 0 },
        end: { day: 6, hour: 2, minute: 0 },
      },
      {
        start: { day: 6, hour: 11, minute: 0 },
        end: { day: 0, hour: 2, minute: 0 },
      },
    ],
    todaysSpecials: [],
    todaysSoups: [],
  },
];
