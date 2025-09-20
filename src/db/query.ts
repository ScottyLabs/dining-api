import { emailTable, overwritesTable } from "./schema";
import { ILocation } from "types";
import { db } from "./db";
import { notifySlack } from "utils/slack";

export async function getEmails(): Promise<{ name: string; email: string }[]> {
  const result = await db
    .select({
      name: emailTable.name,
      email: emailTable.email,
    })
    .from(emailTable);

  // Remove 'mailto:' if present
  return result.map((row) => ({
    name: row.name,
    email: row.email.replace(/^mailto:/, ""),
  }));
}

/**
 *
 * @returns object that maps ids to overrides, where each value in the override map is guaranteed to be non-null. (important!!)
 */
export async function getOverrides() {
  const overrides = await db
    .select()
    .from(overwritesTable)
    .catch((e) => {
      notifySlack(`<!channel> Failed to fetch overwrites with error ${e}`);
      return [];
    });

  const idToOverrideMap = overrides.reduce<{
    [conceptId in string]?: Partial<ILocation>;
  }>((accumulator, curLocation) => {
    const reformattedObjWithNonNullFields: Partial<ILocation> = {
      ...(curLocation.acceptsOnlineOrders !== null && {
        acceptsOnlineOrders: curLocation.acceptsOnlineOrders,
      }),
      ...(curLocation.description !== null && {
        description: curLocation.description,
      }),
      ...(curLocation.location !== null && { location: curLocation.location }),
      ...(curLocation.menu !== null && { menu: curLocation.menu }),
      ...(curLocation.name !== null && { name: curLocation.name }),
      ...(curLocation.shortDescription !== null && {
        shortDescription: curLocation.shortDescription,
      }),
      ...(curLocation.times !== null && { times: curLocation.times }),
      ...(curLocation.url !== null && { url: curLocation.url }),
      ...(curLocation.coordinateLat !== null &&
        curLocation.coordinateLng !== null && {
          coordinates: {
            lat: curLocation.coordinateLat,
            lng: curLocation.coordinateLng,
          },
        }),
    };
    return {
      ...accumulator,
      [curLocation.conceptId]: {
        ...Object.fromEntries(
          Object.entries(reformattedObjWithNonNullFields).filter(
            ([_, v]) => v !== null
          )
        ),
      },
    };
  }, {});
  return idToOverrideMap;
}
