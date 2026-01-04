import { ILocationCoordinateOverwrites } from "types";
import { DBType } from "./db";
import { externalIdToInternalIdTable, overwritesTable } from "./schema";
import { conflictUpdateSet } from "./util";

export async function applyOverrides(
  db: DBType,
  overrides: ILocationCoordinateOverwrites
) {
  const idMappingTable = await db.select().from(externalIdToInternalIdTable);
  const idMapping = idMappingTable.reduce<Record<string, string>>(
    (acc, { internalId, externalId, type }) => {
      if (type === "concept_id")
        return {
          ...acc,
          [externalId]: internalId,
        };
      return acc;
    },
    {}
  );
  const updates = Object.entries(overrides)
    .map(([conceptId, { lat, lng }]) => {
      return {
        coordinateLat: lat,
        coordinateLng: lng,
        locationId: idMapping[conceptId]!,
      };
    })
    .filter((a) => a.locationId !== undefined);
  await db
    .insert(overwritesTable)
    .values(updates)
    .onConflictDoUpdate({
      target: overwritesTable.locationId,
      set: conflictUpdateSet(overwritesTable, [
        "coordinateLat",
        "coordinateLng",
      ]),
    });
}
