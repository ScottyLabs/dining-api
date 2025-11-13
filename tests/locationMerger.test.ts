import { ILocation } from "types";
import ScrapeResultMerger from "../src/utils/locationMerger";
import { DeeplyAllowMatchers } from "vitest";
const locationA: ILocation = {
  conceptId: 3,
  name: "Location Name",
  description: "Location Description",
  url: "http://example.com",
  location: "Location Address",
  times: [],
  acceptsOnlineOrders: true,
  shortDescription: undefined,
  coordinates: undefined,
  today: { day: 1, month: 1, year: 1 },
  menu: undefined,
  todaysSoups: undefined,
  todaysSpecials: undefined,
};
const locationAA: ILocation = {
  conceptId: 3,
  name: "Location Name",
  description: "Location Description",
  url: "http://example.com",
  location: "Location Address Changed",
  times: [],
  acceptsOnlineOrders: true,
  shortDescription: undefined,
  coordinates: undefined,
  today: { day: 1, month: 1, year: 1 },
  menu: undefined,
  todaysSoups: undefined,
  todaysSpecials: undefined,
};
const locationAAA: ILocation = {
  conceptId: 3,
  name: "Location Name",
  description: "Location Description",
  url: "http://example.com",
  location: "Location Address Changed",
  times: [],
  acceptsOnlineOrders: false,
  shortDescription: undefined,
  coordinates: undefined,
  today: { day: 1, month: 1, year: 1 },
  menu: undefined,
  todaysSoups: undefined,
  todaysSpecials: undefined,
};
const locationB: ILocation = {
  conceptId: 2,
  name: "Location Name",
  description: "Location Description",
  url: "http://example.com",
  location: "Location Address",
  times: [],
  acceptsOnlineOrders: true,
  shortDescription: undefined,
  coordinates: undefined,
  today: { day: 1, month: 1, year: 1 },
  menu: undefined,
  todaysSoups: undefined,
  todaysSpecials: undefined,
};
// https://stackoverflow.com/questions/40135684/is-there-an-array-equality-match-function-that-ignores-element-position-in-jest
const expectArrayEquivalence = <M>(
  actual: DeeplyAllowMatchers<M>[],
  expected: DeeplyAllowMatchers<M>[]
) => {
  expect(actual).toEqual(expect.arrayContaining(expected));
  expect(expected).toEqual(expect.arrayContaining(actual));
};
describe("merging", () => {
  test("", () => {
    const merger = new ScrapeResultMerger();
    merger.addLocation(locationA);
    merger.addLocation(locationAA);
    merger.addLocation(locationAAA);
    merger.addLocation(locationAAA);
    merger.addLocation(locationB);
    expectArrayEquivalence(merger.getMostFrequentLocations(), [
      locationAAA,
      locationB,
    ]);
  });
  test("highly necessary test", () => {
    const merger = new ScrapeResultMerger();
    merger.addLocation(locationA);
    merger.addLocation(locationAA);
    merger.addLocation(locationAAA);
    merger.addLocation(locationA);
    merger.addLocation(locationB);
    expectArrayEquivalence(merger.getMostFrequentLocations(), [
      locationA,
      locationB,
    ]);
  });
});
