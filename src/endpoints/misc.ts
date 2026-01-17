import { db } from "db/db";
import { QueryUtils } from "db/dbQueryUtils";
import { getAllLocationsFromDB } from "db/getLocations";
import Elysia, { t } from "elysia";
import { DateTime } from "luxon";
import { notifySlack } from "utils/slack";
import { LocationsSchema } from "./schemas";
import { env } from "env";
import { reportsTable } from "db/schema";
import { fetchUserDetails } from "./auth";

export const miscEndpoints = new Elysia();
miscEndpoints.get(
  "/",
  () => {
    return "ScottyLabs Dining API";
  },
  { response: t.String({ examples: ["ScottyLabs Dining API"] }) }
);
miscEndpoints.get(
  "/v2/locations",
  async () => await getAllLocationsFromDB(db, DateTime.now()),
  {
    response: LocationsSchema,
    detail: {
      description:
        "The times array is guaranteed to be sorted and non-overlapping. Both start and end are inclusive boundaries",
    },
  }
);
miscEndpoints.get("/emails", async () => await new QueryUtils(db).getEmails(), {
  response: t.Array(
    t.Object({
      name: t.String({
        example: "Alice",
      }),
      email: t.String({
        example: "alice72@andrew.cmu.edu",
      }),
    })
  ),
});

miscEndpoints.post(
  "/sendSlackMessage",
  async ({ body: { message } }) => {
    await notifySlack(message, env.SLACK_FRONTEND_WEBHOOK_URL);
  },
  {
    body: t.Object({
      message: t.String(),
    }),
    detail: { hide: true },
  }
);

miscEndpoints.post(
  "/reportError",
  async ({cookie, body: { location_id, message } }) => {
    const session = cookie["session_id"]!.value as string | undefined;
    const userDetails = await fetchUserDetails(session);

    const userId = userDetails?.id;

    await notifySlack(`
        User (${userId}) has reported an error with location ${location_id}:
        ${message}
      `, env.SLACK_MAIN_CHANNEL_WEBHOOK_URL);
    db.insert(reportsTable).values({
      locationId: location_id,
      message: message,
      userId: userId,
    })
  },
  {
    body: t.Object({
      location_id: t.String(),
      message: t.String(),
    }),
    detail: {
      description:
        "Endpoint for reporting errors in information",
      },
  }
);
