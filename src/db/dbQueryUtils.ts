import {
  externalIdToInternalIdTable,
  emailTable,
  locationDataTable,
  overwritesTable,
  specialsTable,
  timeOverwritesTable,
  timesTable,
  weeklyTimeOverwritesTable,
} from "./schema";

import { DBType } from "./db";
import { notifySlack } from "utils/slack";
import { and, eq, gte } from "drizzle-orm";
import { parseTimeSlots } from "containers/timeBuilder";
import { ITimeSlot } from "containers/time/parsedTime";

type RequiredProperty<T> = { [P in keyof T]: NonNullable<T[P]> };

/** More-so the database representation of a time range */
export interface IDateTimeRange {
  date: string;
  startMinutesSinceMidnight: number;
  endMinutesSinceMidnight: number;
}
export class QueryUtils {
  db: DBType;
  constructor(db: DBType) {
    this.db = db;
  }

  async getSpecials(todayAsSQLString: string) {
    const data = await this.db
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
  async getLocationIdToDataMap(timeSearchCutoffStr: string) {
    const locationData = await this.db
      .select()
      .from(locationDataTable)
      .leftJoin(
        timesTable,
        and(
          eq(locationDataTable.id, timesTable.locationId),
          gte(timesTable.date, timeSearchCutoffStr),
        ),
      )
      .leftJoin(
        externalIdToInternalIdTable,
        eq(externalIdToInternalIdTable.internalId, locationDataTable.id),
      );

    return locationData.reduce<
      Record<
        string,
        typeof locationDataTable.$inferSelect & {
          times: IDateTimeRange[];
          conceptId: string | null;
        }
      >
    >((acc, { location_data, location_times, external_id_to_internal_id }) => {
      if (!acc[location_data.id]) {
        acc[location_data.id] = {
          ...location_data,
          times: [],
          conceptId: null,
        };
      }
      if (location_times !== null) {
        acc[location_data.id]!.times.push({
          startMinutesSinceMidnight: location_times.startTime,
          endMinutesSinceMidnight: location_times.endTime,
          date: location_times.date,
        });
      }
      if (external_id_to_internal_id !== null) {
        acc[location_data.id]!.conceptId =
          external_id_to_internal_id.externalId;
      }
      return acc;
    }, {});
  }

  async getGeneralOverrides() {
    return (await this.db.select().from(overwritesTable)).reduce<
      Record<
        string,
        Omit<
          RequiredProperty<typeof overwritesTable.$inferSelect>,
          "locationId"
        > // exclude locationId field, since that's our internal id
      >
    >(
      (acc, overwrite) => ({
        ...acc,
        [overwrite.locationId]: Object.fromEntries(
          Object.entries(overwrite).filter(([key, v]) => {
            return key !== "locationId" && v !== null;
          }),
        ) as RequiredProperty<typeof overwritesTable.$inferSelect>,
      }),
      {},
    );
  }

  /**
   *
   * @param earliestDate should be in SQL form YYYY-MM-DD
   */
  async getTimeOverrides(earliestDate: string) {
    const timeOverrides = await this.db
      .select()
      .from(timeOverwritesTable)
      .where(gte(timeOverwritesTable.date, earliestDate))
      .catch((e) => {
        notifySlack(
          `<!channel> Failed to fetch time overwrites with error ${e}`,
        );
        return [];
      });
    const idToPointOverrides = timeOverrides.reduce<{
      [locationId in string]: { [date in string]: ITimeSlot[] };
    }>((acc, override) => {
      return {
        ...acc,
        [override.locationId]: {
          ...acc[override.locationId],
          [override.date]: parseTimeSlots(override.timeString),
        },
      };
    }, {});
    const weeklyOverrides = await this.db
      .select()
      .from(weeklyTimeOverwritesTable);
    const idToWeeklyOverrides = weeklyOverrides.reduce<{
      [locationId in string]: { [weekday in number]: ITimeSlot[] };
    }>((acc, curOverride) => {
      return {
        ...acc,
        [curOverride.locationId]: {
          ...acc[curOverride.locationId],
          [curOverride.weekday]: parseTimeSlots(curOverride.timeString),
        },
      };
    }, {});
    return { idToPointOverrides, idToWeeklyOverrides };
  }

  async getEmails(): Promise<{ name: string; email: string }[]> {
    const result = await this.db
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
}
