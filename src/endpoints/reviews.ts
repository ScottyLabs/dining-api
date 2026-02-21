import Elysia, { status, t } from "elysia";
import { fetchUserDetails } from "./auth";
import { eq } from "drizzle-orm"
import {
  addStarReview,
  deleteStarReview,
  getAllTagReviewsForLocation,
  getStarSummary,
  getTagSummary,
  updateTagReview,
} from "db/reviews";
import { db } from "db/db";
import { reportsTable } from "db/schema";

export const reviewEndpoints = new Elysia();
reviewEndpoints
  .resolve(async ({ cookie }) => {
    const session = cookie["session_id"]!.value as string | undefined;
    const userDetails = await fetchUserDetails(session);

    return {
      user: userDetails,
    };
  })
  .get(
    "/v2/locations/:locationId/reviews/summary",
    async ({ params: { locationId }, user }) => {
      const [starData, tagData] = await Promise.all([
        getStarSummary(db, { locationId, userId: user?.id }),
        getTagSummary(db, { locationId, userId: user?.id }),
      ]);
      return {
        starData,
        tagData,
      };
    },
    {
      response: t.Object({
        starData: t.Object({
          avg: t.Nullable(t.Number()),
          personalRating: t.Nullable(t.Number()),
          buckets: t.Array(t.Number(), {
            example: [0, 1, 0, 4, 12, 4],
            description:
              "Count of ratings of star rating [{.5},{1,1.5},{2,2.5},{3,3.5},{4,4.5},{5}",
          }),
        }),
        tagData: t.Array(
          t.Object({
            id: t.Number(),
            name: t.String(),
            totalVotes: t.Number(),
            totalLikes: t.Number(),
            myReview: t.Nullable(
              t.Object({
                vote: t.Boolean(),
                text: t.Nullable(t.String()),
                createdAt: t.Number(),
                updatedAt: t.Number(),
              })
            ),
          })
        ),
      }),
    }
  )
  .put(
    "/v2/locations/:locationId/reviews/stars/me",
    async ({ user, params: { locationId }, body: { stars } }) => {
      if (user === null) throw status("Unauthorized");
      await addStarReview(db, { locationId, rating: stars, userId: user.id });
      return new Response("{}", { status: 201 });
    },
    {
      body: t.Object({
        stars: t.Number({ minimum: 0.5, maximum: 5, multipleOf: 0.5 }),
      }),
    }
  )
  .delete(
    "/v2/locations/:locationId/reviews/stars/me",
    async ({ user, params: { locationId } }) => {
      if (user === null) throw status("Unauthorized");
      await deleteStarReview(db, { locationId, userId: user.id });
      return new Response("{}", { status: 200 });
    }
  )
  .put(
    "/v2/locations/:locationId/reviews/tags/:tagId/me",
    async ({ user, params: { locationId, tagId }, body: { voteUp, text } }) => {
      if (user === null) throw status("Unauthorized");
      if (isNaN(parseInt(tagId)))
        throw new Response("Invalid tag ID: must be a valid integer", {
          status: 400,
        });
      await updateTagReview(db, {
        locationId,
        userId: user.id,
        tagId: parseInt(tagId),
        text: text?.replaceAll(/\n(?=\n\n)/g, "") ?? null, // limit consecutive newlines to at most 2
        voteUp,
      });
      return new Response("{}", { status: 201 });
    },
    {
      body: t.Object({
        voteUp: t.Nullable(t.Boolean()),
        text: t.Nullable(t.String({ maxLength: 1000 })),
      }),
    }
  )
  .get(
    "/v2/locations/:locationId/reviews/tags",
    async ({ params: { locationId } }) => {
      return await getAllTagReviewsForLocation(db, { locationId });
    },
    {
      response: t.Array(
        t.Object({
          writtenReview: t.String(),
          tagName: t.String(),
          id: t.Number(),
          tagId: t.Number(),
          userId: t.Number(),
          locationId: t.String(),
          vote: t.Boolean(),
          createdAt: t.Number(),
          updatedAt: t.Number(),
        })
      ),
    }
  )
  .get(
    "/v2/locations/:locationId/reports",
    async ({ params: { locationId } }) => {
      const reports = await db.select().from(reportsTable).where(eq(reportsTable.locationId, locationId))

      return reports
    },
    {
      response: t.Array(
        t.Object({
          id: t.Number(),
          userId: t.Nullable(t.Number()),
          createdAt: t.Date(),
          locationId: t.String(),
          message: t.String()
        })
      )
    }
  );
