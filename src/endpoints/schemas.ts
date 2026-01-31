import { t } from "elysia";

export const LocationSchema = t.Object({
  times: t.Array(
    t.Object({
      start: t.Number({ examples: [+new Date()] }),
      end: t.Number({ examples: [+new Date()] }),
    })
  ),

  todaysSoups: t.Array(
    t.Object({
      name: t.String(),
      description: t.String(),
    })
  ),

  todaysSpecials: t.Array(
    t.Object({
      name: t.String(),
      description: t.String(),
    })
  ),

  name: t.Nullable(t.String({ examples: ["Schatz"] })),
  location: t.String(),
  ratingsAvg: t.Nullable(t.Number()),
  shortDescription: t.Nullable(t.String()),
  description: t.String(),
  url: t.String(),
  menu: t.Nullable(t.String()),
  coordinateLat: t.Nullable(t.Number()),
  coordinateLng: t.Nullable(t.Number()),
  acceptsOnlineOrders: t.Boolean(),

  id: t.String(),
  conceptId: t.Nullable(t.String()),
});

export const LocationsSchema = t.Array(LocationSchema);
