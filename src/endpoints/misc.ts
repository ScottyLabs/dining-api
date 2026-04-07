import { db } from "db/db";
import { QueryUtils } from "db/dbQueryUtils";
import { getAllLocationsFromDB } from "db/getLocations";
import Elysia, { t } from "elysia";
import { DateTime } from "luxon";
import { notifySlack } from "utils/slack";
import { LocationsSchema } from "./schemas";
import { env } from "env";
import { eq } from "drizzle-orm"
import { readFile } from "node:fs/promises";
import path from "node:path";

import { locationDataTable, reportsTable } from "db/schema";
import { fetchUserDetails } from "./auth";

import { sendEmail } from "utils/email";

const menuImagesDir = path.resolve(process.cwd(), "public", "menu_images");

function withTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeImagePath(imageValue: string) {
  const trimmedValue = imageValue.trim().replace(/^\/+/, "");
  return trimmedValue.startsWith("menu_images/")
    ? trimmedValue
    : `menu_images/${trimmedValue}`;
}

function toAbsoluteImageUrl(requestUrl: string, imageValue: string) {
  if (/^https?:\/\//i.test(imageValue)) return imageValue;
  const normalizedPath = normalizeImagePath(imageValue)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const baseUrl = env.MENU_IMAGE_BASE_URL?.trim();

  if (baseUrl) {
    return new URL(normalizedPath, withTrailingSlash(baseUrl)).toString();
  }

  return new URL(normalizedPath, withTrailingSlash(new URL(requestUrl).origin)).toString();
}

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
  async ({ request }) => {
    const locations = await getAllLocationsFromDB(db, DateTime.now());
    return locations.map((location) => ({
      ...location,
      images: location.images.map((image) =>
        toAbsoluteImageUrl(request.url, image),
      ),
    }));
  },
  {
    response: LocationsSchema,
    detail: {
      description:
        "The times array is guaranteed to be sorted and non-overlapping. Both start and end are inclusive boundaries",
    },
  },
);
miscEndpoints.get("/menu_images/:filename", async ({ params: { filename } }) => {
  const normalizedFilename = filename.replace(/^\/+/, "");
  const filePath = path.resolve(menuImagesDir, normalizedFilename);
  if (!filePath.startsWith(menuImagesDir)) {
    throw new Response("Invalid filename", { status: 400 });
  }

  try {
    const file = await readFile(filePath);
    const extension = path.extname(normalizedFilename).toLowerCase();
    const contentType =
      extension === ".jpg" || extension === ".jpeg"
        ? "image/jpeg"
        : extension === ".webp"
          ? "image/webp"
          : "image/png";
    return new Response(file, {
      headers: { "Content-Type": contentType },
    });
  } catch {
    throw new Response("Not found", { status: 404 });
  }
});
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
  async ({ cookie, body: { locationId, message } }) => {
    const session = cookie["session_id"]!.value as string | undefined;
    const userDetails = await fetchUserDetails(session);

    const userId = userDetails?.id;

    const reports = await db.select().from(locationDataTable).where(eq(locationDataTable.id, locationId))
    if (reports.length == 0) {
      throw new Response(`Invalid location id ${locationId}`, {
        status: 400,
      });
    }

    if (reports.length > 1) {
      throw new Response(`
          Expected 1 restaurant corresponding to id=${locationId}. Somehow got 2.
        `, { status: 500 }) // this should be unreachable
    }

    const locationName = reports[0]?.name ?? "Unnamed"
    createReport(
      {
        locationName,
        locationId,
        message,
      }
    ).catch(console.error)

    await db.insert(reportsTable).values({
      locationId,
      message,
      userId,
    })

    return {}
  },
  {
    body: t.Object({
      locationId: t.String(),
      message: t.String({ minLength: 1, maxLength: 512 }),
    }),
    detail: {
      description:
        "Endpoint for reporting errors in information",
    },
  }
);

async function createReport({
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
