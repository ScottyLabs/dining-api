import axios from "axios";
import DiningParser from "../src/parser/diningParser";

import { getFileContent, last } from "./utils";

jest.mock("axios");

test.skip("the whole thing, including locationOverwrites", async () => {
  mockOutAxios({
    conceptListFilePath: "html/listconcepts.html",
    specialsFilePath: "html/specials.html",
    soupsFilePath: "html/soups.html",
    getConceptFilePath: (locationId: string) =>
      ["92", "110", "113", "175"].includes(locationId)
        ? `html/concepts/${locationId}.html`
        : "html/blank.html",
  });
  const parser = new DiningParser();
  expect(await parser.process()).toEqual(expectedLocationData);
});

test.skip(
  "parser throws on repeated axios error",
  async () => {
    mockOutAxios({});
    const parser = new DiningParser();

    await expect(async () => {
      await parser.process();
    }).rejects.toThrow("not found!");
  },
  10 * 1000
);

describe("time edge cases", () => {
  test("standard, duplicate string, gap between time strings", async () => {
    mockOutAxios({
      conceptListFilePath: "html/listconcepts-just-113.html",
      soupsFilePath: "html/blank.html",
      specialsFilePath: "html/blank.html",
      getConceptFilePath: (id) => {
        expect(id).toBe("113");
        return "html/concepts/113-tests-1.html";
      },
    });
    const parser = new DiningParser();
    const result = await parser.process();

    expect(result).toEqual([
      {
        acceptsOnlineOrders: true,
        conceptId: 113,
        coordinates: { lat: 40.444107, lng: -79.942206 },
        description: "aaa",
        location: "Cohon Center, Second floor",
        menu: "https://apps.studentaffairs.cmu.edu/dining/dashboard_images/Production/menus/113/8.5x14-MealBlock.pdf",
        name: "AU BON PAIN AT SKIBO CAFÉ",
        shortDescription:
          "Coffee/tea, espresso, soup, sandwiches/salads, grab-n-go, yogurt parfaits, fruit, snacks",
        times: [
          {
            start: { day: 0, hour: 11, minute: 0 },
            end: { day: 0, hour: 14, minute: 0 },
          },
          {
            start: { day: 0, hour: 15, minute: 0 },
            end: { day: 0, hour: 15, minute: 1 },
          },
          {
            start: { day: 0, hour: 16, minute: 0 },
            end: { day: 0, hour: 21, minute: 0 },
          },
          {
            start: { day: 2, hour: 0, minute: 0 },
            end: { day: 2, hour: 23, minute: 59 },
          },
          {
            start: { day: 3, hour: 0, minute: 0 },
            end: { day: 3, hour: 23, minute: 59 },
          },
          {
            start: { day: 4, hour: 7, minute: 0 },
            end: { day: 4, hour: 22, minute: 0 },
          },
          {
            start: { day: 5, hour: 11, minute: 0 },
            end: { day: 5, hour: 16, minute: 0 },
          },
          {
            start: { day: 6, hour: 11, minute: 0 },
            end: { day: 6, hour: 14, minute: 0 },
          },
          {
            start: { day: 6, hour: 16, minute: 0 },
            end: { day: 6, hour: 21, minute: 0 },
          },
        ],
        todaysSoups: undefined,
        todaysSpecials: undefined,
        url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/113",
      },
    ]);
  });
  test("12AM, same/different opening/closing times", async () => {
    mockOutAxios({
      conceptListFilePath: "html/listconcepts-just-113.html",
      soupsFilePath: "html/blank.html",
      specialsFilePath: "html/blank.html",
      getConceptFilePath: (id) => {
        expect(id).toBe("113");
        return "html/concepts/113-tests-2.html";
      },
    });
    const parser = new DiningParser();
    const result = await parser.process();

    expect(result).toEqual([
      {
        acceptsOnlineOrders: true,
        conceptId: 113,
        coordinates: { lat: 40.444107, lng: -79.942206 },
        description: "aaa",
        location: "Cohon Center, Second floor",
        menu: "https://apps.studentaffairs.cmu.edu/dining/dashboard_images/Production/menus/113/8.5x14-MealBlock.pdf",
        name: "AU BON PAIN AT SKIBO CAFÉ",
        shortDescription:
          "Coffee/tea, espresso, soup, sandwiches/salads, grab-n-go, yogurt parfaits, fruit, snacks",
        times: [
          {
            start: { day: 0, hour: 8, minute: 0 },
            end: { day: 0, hour: 16, minute: 0 },
          },
          {
            start: { day: 1, hour: 11, minute: 0 },
            end: { day: 1, hour: 23, minute: 59 },
          },
          {
            start: { day: 2, hour: 0, minute: 0 },
            end: { day: 2, hour: 23, minute: 59 },
          },
          {
            start: { day: 3, hour: 0, minute: 0 },
            end: { day: 3, hour: 23, minute: 59 },
          },
          {
            start: { day: 4, hour: 8, minute: 0 },
            end: { day: 4, hour: 16, minute: 0 },
          },
          {
            start: { day: 5, hour: 8, minute: 0 },
            end: { day: 5, hour: 16, minute: 0 },
          },
          {
            start: { day: 6, hour: 8, minute: 0 },
            end: { day: 6, hour: 16, minute: 0 },
          },
        ],
        todaysSoups: undefined,
        todaysSpecials: undefined,
        url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/113",
      },
    ]);
  });
  test("overlapping times", async () => {
    mockOutAxios({
      conceptListFilePath: "html/listconcepts-just-113.html",
      soupsFilePath: "html/blank.html",
      specialsFilePath: "html/blank.html",
      getConceptFilePath: (id) => {
        expect(id).toBe("113");
        return "html/concepts/113-tests-3.html";
      },
    });
    const parser = new DiningParser();
    const result = await parser.process();

    expect(result).toEqual([
      {
        acceptsOnlineOrders: true,
        conceptId: 113,
        coordinates: { lat: 40.444107, lng: -79.942206 },
        description: "aaa",
        location: "Cohon Center, Second floor",
        menu: "https://apps.studentaffairs.cmu.edu/dining/dashboard_images/Production/menus/113/8.5x14-MealBlock.pdf",
        name: "AU BON PAIN AT SKIBO CAFÉ",
        shortDescription:
          "Coffee/tea, espresso, soup, sandwiches/salads, grab-n-go, yogurt parfaits, fruit, snacks",
        times: [
          {
            start: { day: 1, hour: 8, minute: 0 },
            end: { day: 1, hour: 21, minute: 0 },
          },
          {
            start: { day: 2, hour: 8, minute: 0 },
            end: { day: 2, hour: 21, minute: 0 },
          },
          {
            start: { day: 3, hour: 8, minute: 0 },
            end: { day: 3, hour: 21, minute: 0 },
          },
          {
            start: { day: 4, hour: 8, minute: 0 },
            end: { day: 4, hour: 21, minute: 0 },
          },
          {
            start: { day: 5, hour: 6, minute: 0 },
            end: { day: 5, hour: 16, minute: 0 },
          },
          {
            start: { day: 5, hour: 19, minute: 0 },
            end: { day: 5, hour: 23, minute: 59 },
          },
        ],
        todaysSoups: undefined,
        todaysSpecials: undefined,
        url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/113",
      },
    ]);
  });
});

const ALL_LOCATIONS_URL =
  "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/?page=listConcepts";
const SPECIALS_URL =
  "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Specials";
const SOUPS_URL =
  "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Soups";
const LOCATION_URL_PREFIX =
  "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/";

/**
 *
 * @param filePathObject if the file path is not provided or points to an invalid file, the mocked axios will error out.
 */
function mockOutAxios({
  conceptListFilePath,
  specialsFilePath,
  soupsFilePath,
  getConceptFilePath,
}: {
  conceptListFilePath?: string;
  specialsFilePath?: string;
  soupsFilePath?: string;
  getConceptFilePath?: (locationId: string) => string;
}) {
  (axios.get as jest.Mock).mockImplementation(async (url: string) => {
    const localFilePath = getFilePath(url);
    if (localFilePath === undefined) throw new Error(`${url} not found!`);
    return getFileContent(localFilePath);
  });

  const getFilePath = (url: string) => {
    if (url === ALL_LOCATIONS_URL && conceptListFilePath)
      return conceptListFilePath;
    if (url === SPECIALS_URL && specialsFilePath) return specialsFilePath;
    if (url === SOUPS_URL && soupsFilePath) return soupsFilePath;
    if (url.startsWith(LOCATION_URL_PREFIX) && getConceptFilePath)
      return getConceptFilePath(last(url.split("/")));
    return undefined;
  };
}

const expectedLocationData = [
  {
    conceptId: 113,
    name: "AU BON PAIN AT SKIBO CAFÉ",
    shortDescription:
      "Coffee/tea, espresso, soup, sandwiches/salads, grab-n-go, yogurt parfaits, fruit, snacks",
    description:
      "At Au Bon Pain café bakery, each signature recipe is uniquely crafted. You can enjoy delicious hot or iced coffee and teas, espresso drinks, a variety of cold beverages, soup, a customized made-to-order breakfast or lunch sandwich or salad, or you can grab a pre-made salad, sandwich, wrap, yogurt parfait, fresh fruit or snack. There is always something new to try ... healthy choices, comfort food, indulgent treats … try them all!  For nutritional information about Au Bon Pain's menu items, please click here <a>https://www.aubonpain.com/nutrition</a> To place an Au Bon Pain catering order, please contact 1-800-765-4227 or visit http://aubonpain.com/cateringFor on-campus assistance, call 412-621-1934.",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/113",
    location: "Cohon Center, Second floor",
    menu: "https://web.archive.org/web/20230806004812/https://apps.studentaffairs.cmu.edu/dining/dashboard_images/Production/menus/113/abp-menu6.pdf",
    coordinates: { lat: 40.444107, lng: -79.942206 },
    acceptsOnlineOrders: true,
    times: [
      {
        start: { day: 0, hour: 16, minute: 30 },
        end: { day: 0, hour: 20, minute: 0 },
      },
      {
        start: { day: 1, hour: 8, minute: 0 },
        end: { day: 1, hour: 20, minute: 0 },
      },
      {
        start: { day: 2, hour: 8, minute: 0 },
        end: { day: 2, hour: 20, minute: 0 },
      },
      {
        start: { day: 3, hour: 8, minute: 0 },
        end: { day: 3, hour: 20, minute: 0 },
      },
      {
        start: { day: 4, hour: 8, minute: 0 },
        end: { day: 4, hour: 20, minute: 0 },
      },
      {
        start: { day: 5, hour: 8, minute: 0 },
        end: { day: 5, hour: 23, minute: 59 },
      },
      {
        start: { day: 6, hour: 16, minute: 30 },
        end: { day: 6, hour: 20, minute: 0 },
      },
    ],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 184,
    name: "CIAO BELLA",
    shortDescription: "Customizable pasta plates",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/184",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 95,
    name: "DE FER COFFEE & TEA AT MAGGIE MURPH CAFÉ",
    shortDescription:
      "Locally-roasted specialty coffee, tea, and scratch-made food",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/95",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 134,
    name: "E.A.T. (EVENINGS AT TEPPER) - ROHR COMMONS",
    shortDescription: "Dinner options at Tepper are Grubhub only!",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/134",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.444902436996365, lng: -79.94550403887685 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 178,
    name: "THE EDGE CAFE & MARKET",
    shortDescription: "Vaad-certified kosher bagels, pizza, bourekas & more!",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/178",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.4426740207827, lng: -79.94023230189542 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 88,
    name: "EGG SHOPPE - GRUBHUB ONLY",
    shortDescription:
      "Breakfast available only on Grubhub for pickup in Schatz.",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/88",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 103,
    name: "ENTROPY+",
    shortDescription:
      "On-campus convenience store, serving snacks, grab-and-go meals, coffee, & more",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/103",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.442923, lng: -79.942103 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 92,
    name: "THE EXCHANGE",
    shortDescription:
      "Deli and breakfast sandwiches, daily hot entrées, grab-and-go.",
    description:
      "The Exchange offers custom deli sandwiches, soups, hot entrées, fresh baked goods, fruit, yogurt parfaits, snack and energy bars, and other grab-and-go items. The designated coffee bar includes hot brewed La Prima coffee, specialty and organic teas, cold beverages, and bottled juices.",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/92",
    location: "Posner Hall, 1st Floor",
    menu: "https://web.archive.org/web/20240721001349/https://apps.studentaffairs.cmu.edu/dining/dashboard_images/Production/menus/92/menu-exchange-2024-25-v2.pdf",
    coordinates: { lat: 40.441499, lng: -79.941951 },
    acceptsOnlineOrders: false,
    times: [
      {
        start: { day: 1, hour: 8, minute: 0 },
        end: { day: 1, hour: 15, minute: 0 },
      },
      {
        start: { day: 2, hour: 8, minute: 0 },
        end: { day: 2, hour: 15, minute: 0 },
      },
      {
        start: { day: 3, hour: 8, minute: 0 },
        end: { day: 3, hour: 15, minute: 0 },
      },
      {
        start: { day: 4, hour: 8, minute: 0 },
        end: { day: 4, hour: 15, minute: 0 },
      },
      {
        start: { day: 5, hour: 8, minute: 0 },
        end: { day: 5, hour: 15, minute: 0 },
      },
    ],
    todaysSpecials: [
      {
        title: "Brunch at The EXCHANGE Every Saturday",
        description:
          "Come and Enjoy our Plated Brunch with Eggs Bacon Sausages French Toast Waffles Offerings Change Every Week",
      },
    ],
    todaysSoups: [
      {
        title: "Potato and Bacon Chowder",
        description: "Crispy Bacon Green Onions and Red Bliss Potatoes",
      },
      {
        title: "Hearty Potato Bacon Chowder",
        description: "Finished with Fresh Scallions",
      },
    ],
  },
  {
    conceptId: 126,
    name: "FOOD HALL AT RESNIK",
    shortDescription: "Summer all-you-care-to-eat: OPENS JUNE 24!",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/126",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 173,
    name: "FORBES AVENUE SUBS - ROHR COMMONS",
    shortDescription:
      "Made-to-order deli-style subs and wraps. Vegan options available.",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/173",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.44496374074576, lng: -79.9454977063049 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 91,
    name: "EL GALLO DE ORO",
    shortDescription:
      "Mexican cuisine, burritos and burrito bowls, tacos, quesadillas, salads",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/91",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.443152, lng: -79.942049 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 139,
    name: "GRANO PIZZA",
    shortDescription:
      "Hand-stretched, personal-sized pizzas on a New York or focaccia-style crust",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/139",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 110,
    name: "HUNAN EXPRESS",
    shortDescription: "Asian cuisine, rice bowls, boba/bubble tea, smoothies",
    description:
      "Authentic Chinese cuisine, featuring sauces made with bone broth, choose your base of noodles or rice and build your own meal with General Tso’s chicken, stir fry tofu, seasonal vegetables and pork ribs in black bean sauce. Braised fish, spring rolls, pork dumplings, red bean rice cakes are available daily. Enjoy fruit smoothies and build-your-own milk or fruit boba tea, with bubble toppings like tapioca, rainbow jelly, lychee jelly and popping boba.",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/110",
    location: "Newell-Simon Atrium",
    menu: "https://web.archive.org/web/20240901003526/https://apps.studentaffairs.cmu.edu/dining/dashboard_images/Production/menus/110/Fall Menus 2024 (25).pdf",
    coordinates: { lat: 40.443486, lng: -79.945528 },
    acceptsOnlineOrders: true,
    times: [
      {
        start: { day: 0, hour: 12, minute: 0 },
        end: { day: 0, hour: 20, minute: 0 },
      },
      {
        start: { day: 1, hour: 10, minute: 30 },
        end: { day: 1, hour: 20, minute: 0 },
      },
      {
        start: { day: 2, hour: 10, minute: 30 },
        end: { day: 2, hour: 20, minute: 0 },
      },
      {
        start: { day: 3, hour: 10, minute: 30 },
        end: { day: 3, hour: 20, minute: 0 },
      },
      {
        start: { day: 4, hour: 10, minute: 30 },
        end: { day: 4, hour: 20, minute: 0 },
      },
      {
        start: { day: 5, hour: 10, minute: 30 },
        end: { day: 5, hour: 20, minute: 0 },
      },
    ],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 115,
    name: "ROHR CAFÉ  - LA PRIMA",
    shortDescription:
      "La Prima's second location on campus serving Italian-style coffee and food",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/115",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.443551, lng: -79.944798 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 136,
    name: "MILLIE'S COFFEE 'N' CREAMERY - ROHR COMMONS",
    shortDescription:
      "NOW OPEN! Sustainably sourced coffee, ice cream, and vegan gelato.",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/136",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.44487, lng: -79.945319 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 127,
    name: "NOURISH",
    shortDescription:
      "Closed until fall semester: Grab and go available in Entropy",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/127",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.4438318, lng: -79.9422587 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 94,
    name: "LA PRIMA ESPRESSO",
    shortDescription:
      "Italian-style coffee, pastries, grab-and-go sandwiches, salads, and sides",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/94",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.442611, lng: -79.945857 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 186,
    name: "REDHAWK COFFEE",
    shortDescription:
      "Local coffee roaster serving specialty coffee, tea, baked goods, and grab-and-go food.",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/186",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 174,
    name: "REVOLUTION NOODLE",
    shortDescription:
      "Customizable Malatang Noodle bowls, from the owners of Hunan Express",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/174",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 108,
    name: "SCHATZ DINING ROOM",
    shortDescription: "All-you-care-to-eat residential dining hall",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/108",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.44318, lng: -79.942498 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 180,
    name: "SCOTTY'S MARKET BY SALEM'S",
    shortDescription:
      "International and conventional groceries, savory grilled meats and hot meals.",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/180",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 190,
    name: "STACK'D DESSERT BAR",
    shortDescription:
      "Cool down this summer with milkshakes, ice cream sundaes and floats!",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/190",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 188,
    name: "STACK'D UNDERGROUND",
    shortDescription:
      "Smashed burgers, Nashville-style chicken an gourmet grilled cheese",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/188",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 148,
    name: "STEPHANIE'S - MARKET C",
    shortDescription:
      "Fresh sandwiches, wraps and salads, snacks, sweets, gourmet coffee and cold beverages",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/148",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.4461, lng: -79.951 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 82,
    name: "TAHINI",
    shortDescription: "Fresh Mediterranean, Certified Kosher Cuisine",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/82",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.44258976615644, lng: -79.93993708177102 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 168,
    name: "TARTAN FOOD TRUCK",
    shortDescription: "Campus food truck",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/168",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 114,
    name: "TASTE OF INDIA",
    shortDescription: "Taste of India provide a vibrant tastes of India.",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/114",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.44257994858966, lng: -79.94024963683377 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 185,
    name: "TEPPER TAQUERIA",
    shortDescription:
      "Mexican-style street tacos, burritos, quesadillas, bowls, and nachos",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/185",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 138,
    name: "TRUE BURGER",
    shortDescription:
      "Unique, hand-crafted signature sandwiches and smash burgers",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/138",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 98,
    name: "URBAN REVOLUTION - GRUBHUB ONLY",
    shortDescription: "Grubhub-only, featuring fresh-carved rotisserie options",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/98",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 155,
    name: "WILD BLUE SUSHI - RUGE ATRIUM",
    shortDescription:
      "Fresh prepared sushi, hot rice bowls, bubble tea and coffee",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/155",
    location: "",
    menu: undefined,
    coordinates: undefined,
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
  {
    conceptId: 84,
    name: "ZEBRA LOUNGE",
    shortDescription:
      "hot and iced coffee and espresso drinks, pastries, sushi, bagels, pizza",
    description: "",
    url: "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/84",
    location: "",
    menu: undefined,
    coordinates: { lat: 40.441633, lng: -79.943015 },
    acceptsOnlineOrders: false,
    times: [],
    todaysSpecials: undefined,
    todaysSoups: undefined,
  },
];
