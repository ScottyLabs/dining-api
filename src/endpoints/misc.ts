import { db } from "db/db";
import { QueryUtils } from "db/dbQueryUtils";
import { getAllLocationsFromDB } from "db/getLocations";
import Elysia, { t } from "elysia";
import { DateTime } from "luxon";
import { notifySlack } from "utils/slack";
import { LocationsSchema } from "./schemas";
import { env } from "env";
import { sendEmail } from "utils/email";

export const miscEndpoints = new Elysia();
miscEndpoints.get(
  "/",
  () => {
    return "ScottyLabs Dining API";
  },
  { response: t.String({ examples: ["ScottyLabs Dining API"] }) },
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
  },
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
    }),
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
  },
);
miscEndpoints.post(
  "/report",
  async ({ body: { message, locationId, locationName } }) => {
    runBackgroundJobForErrorReport({ locationName, locationId, message }).catch(
      console.error,
    );
    return {};
  },
  {
    body: t.Object({
      locationName: t.String(),
      locationId: t.String(),
      message: t.String({ maxLength: 300, minLength: 1 }),
    }),
  },
);
async function runBackgroundJobForErrorReport({
  locationName,
  locationId,
  message,
}: {
  locationName: string;
  locationId: string;
  message: string;
}) {
  const received = await sendEmail(
    env.ALERT_EMAIL_SEND,
    env.ALERT_EMAIL_CC,
    `[CMU Eats] Report for ${locationName}`,
    `${message}\n\nBest,\nCMU Eats automated report system`,
  );
  await notifySlack(
    `Report for ${locationName} (\`${locationId}\`): ${message} \nEmailed: ${received.join(", ")}`,
    env.SLACK_MAIN_CHANNEL_WEBHOOK_URL,
  );
}
