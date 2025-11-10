import {
  conceptIdToInternalIdTable,
  emailTable,
  locationDataTable,
  overwritesTable,
  specialsTable,
  timeOverwritesTable,
  timesTable,
} from "./schema";

import { db } from "./db";
import { notifySlack } from "utils/slack";
import { and, eq, gte } from "drizzle-orm";
import { parseTimeSlots } from "containers/timeBuilder";
import { IParsedTimeRange } from "containers/time/parsedTime";

/** More-so the database representation of a time range */
export interface ITimeRangeInternal {
  date: string;
  startMinutesSinceMidnight: number;
  endMinutesSinceMidnight: number;
}
export async function getSpecials(todayAsSQLString: string) {
  const data = await db
    .select()
    .from(specialsTable)
    .where(eq(specialsTable.date, todayAsSQLString));
  return data.reduce<
    Record<
      string,
      {
        specials?: { name: string; description: string }[];
        soups?: { name: string; description: string }[];
      }
    >
  >((acc, special) => {
    if (acc[special.locationId] === undefined) acc[special.locationId] = {};
    if (special.type === "special") {
      acc[special.locationId]!.specials = [
        ...(acc[special.locationId]!.specials ?? []),
        {
          name: special.name,
          description: special.description,
        },
      ];
    } else {
      acc[special.locationId]!.soups = [
        ...(acc[special.locationId]!.soups ?? []),
        {
          name: special.name,
          description: special.description,
        },
      ];
    }
    return acc;
  }, {});
}
/** Fetches non-overridden location data + open times */
export async function getLocationIdToDataMap(timeSearchCutoffStr: string) {
  const locationData = await db
    .select()
    .from(locationDataTable)
    .leftJoin(
      conceptIdToInternalIdTable,
      eq(locationDataTable.id, conceptIdToInternalIdTable.internalId)
    )
    .leftJoin(
      timesTable,
      and(
        eq(locationDataTable.id, timesTable.locationId),
        gte(timesTable.date, timeSearchCutoffStr)
      )
    );
  return locationData.reduce<
    Record<
      string,
      | Omit<typeof locationDataTable.$inferSelect, "id"> & {
          id: number;
        } & {
          times: ITimeRangeInternal[];
        }
    >
  >((acc, { location_data, location_times, concept_id_to_internal_id }) => {
    if (!acc[location_data.id]) {
      acc[location_data.id] = {
        ...location_data,
        id: parseInt(concept_id_to_internal_id?.externalId ?? "-1"),
        times: [],
      };
    }
    if (location_times !== null) {
      acc[location_data.id]!.times.push({
        startMinutesSinceMidnight: location_times.startTime,
        endMinutesSinceMidnight: location_times.endTime,
        date: location_times.date,
      });
    }
    return acc;
  }, {});
}
type RequiredProperty<T> = { [P in keyof T]: NonNullable<T[P]> };

export async function getGeneralOverrides() {
  return (await db.select().from(overwritesTable)).reduce<
    Record<
      string,
      Omit<RequiredProperty<typeof overwritesTable.$inferSelect>, "locationId"> // exclude locationId field, since that's our internal id
    >
  >(
    (acc, overwrite) => ({
      ...acc,
      [overwrite.locationId]: Object.fromEntries(
        Object.entries(overwrite).filter(([key, v]) => {
          return key !== "locationId" && v !== null;
        })
      ) as RequiredProperty<typeof overwritesTable.$inferSelect>,
    }),
    {}
  );
}

/**
 *
 * @param earliestDate should be in SQL form YYYY-MM-DD
 */
export async function getTimeOverrides(earliestDate: string) {
  const timeOverrides = await db
    .select()
    .from(timeOverwritesTable)
    .where(gte(timeOverwritesTable.date, earliestDate))
    .catch((e) => {
      notifySlack(`<!channel> Failed to fetch time overwrites with error ${e}`);
      return [];
    });
  const idToTimeOverrides = timeOverrides.reduce<{
    [locationId in string]: { [date in string]: IParsedTimeRange[] };
  }>((acc, override) => {
    return {
      ...acc,
      [override.locationId]: {
        ...acc[override.locationId],
        [override.date]: parseTimeSlots(override.timeString),
      },
    };
  }, {});
  return idToTimeOverrides;
}

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
