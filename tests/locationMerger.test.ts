import ScrapeResultMerger from "../src/utils/locationMerger";
const locationA = {
  conceptId: 3,
  name: "Location Name",
  description: "Location Description",
  url: "http://example.com",
  location: "Location Address",
  times: [],
  acceptsOnlineOrders: true,
};
const locationAA = {
  conceptId: 3,
  name: "Location Name",
  description: "Location Description",
  url: "http://example.com",
  location: "Location Address Changed",
  times: [],
  acceptsOnlineOrders: true,
};
const locationAAA = {
  conceptId: 3,
  name: "Location Name",
  description: "Location Description",
  url: "http://example.com",
  location: "Location Address Changed",
  times: [],
  acceptsOnlineOrders: false,
};
const locationB = {
  conceptId: 2,
  name: "Location Name",
  description: "Location Description",
  url: "http://example.com",
  location: "Location Address",
  times: [],
  acceptsOnlineOrders: true,
};
// https://stackoverflow.com/questions/40135684/is-there-an-array-equality-match-function-that-ignores-element-position-in-jest
const expectArrayEquivalence = <T>(actual: T[], expected: T[]) => {
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
