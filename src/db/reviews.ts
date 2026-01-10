// good reference: https://www.kishokanth.com/blog/partial-matching-objects-and-arrays-in-jest

import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { DBType } from "./db";
import { starReviewTable, tagListTable, tagReviewTable } from "./schema";
import { conflictUpdateSet } from "./util";

/**
 * Assuming we're starting from an empty db
 */
export async function initializeTags(db: DBType, tags: string[]) {
  await db
    .insert(tagListTable)
    .values(tags.map((tag, i) => ({ name: tag, sortOrder: i * 10 })));
}
export async function updateTagReview(
  db: DBType,
  {
    tagId,
    locationId,
    userId,
    voteUp,
    text,
  }: {
    tagId: number;
    locationId: string;
    userId: number;
    voteUp: boolean | undefined;
    text: string | undefined;
  }
) {
  if (voteUp === undefined) {
    // delete the review
    await db
      .delete(tagReviewTable)
      .where(
        and(
          eq(tagReviewTable.locationId, locationId),
          and(
            eq(tagReviewTable.tagId, tagId),
            eq(tagReviewTable.userId, userId)
          )
        )
      );
  } else {
    await db
      .insert(tagReviewTable)
      .values({
        tagId,
        locationId,
        userId,
        vote: voteUp,
        writtenReview: text,
      })
      .onConflictDoUpdate({
        target: [
          tagReviewTable.locationId,
          tagReviewTable.tagId,
          tagReviewTable.userId,
        ],
        set: conflictUpdateSet(tagReviewTable, [
          "updatedAt",
          "vote",
          "writtenReview",
        ]),
      });
  }
}
export async function addStarReview(
  db: DBType,
  {
    locationId,
    userId,
    rating,
  }: { locationId: string; userId: number; rating: number }
) {
  await db
    .insert(starReviewTable)
    .values({
      locationId,
      userId,
      starRating: rating,
    })
    .onConflictDoUpdate({
      target: [starReviewTable.locationId, starReviewTable.userId],
      set: conflictUpdateSet(starReviewTable, ["updatedAt", "starRating"]),
    });
}
export async function deleteStarReview(
  db: DBType,
  { locationId, userId }: { locationId: string; userId: number }
) {
  await db
    .delete(starReviewTable)
    .where(
      and(
        eq(starReviewTable.locationId, locationId),
        eq(starReviewTable.userId, userId)
      )
    );
}
export async function getStarSummary(
  db: DBType,
  { locationId, userId }: { locationId: string; userId: number | undefined }
) {
  const allStarReviews = await db
    .select({
      starRating: starReviewTable.starRating,
      userId: starReviewTable.userId,
    })
    .from(starReviewTable)
    .where(eq(starReviewTable.locationId, locationId));
  const avg = allStarReviews.length
    ? allStarReviews.reduce<number>(
        (acc, { starRating }) => acc + starRating,
        0
      ) / allStarReviews.length
    : null;
  const buckets = [0, 0, 0, 0, 0, 0];
  for (const { starRating } of allStarReviews) {
    buckets[Math.floor(starRating)]!++;
  }
  const personalRating =
    allStarReviews.find((review) => review.userId === userId)?.starRating ??
    null;
  return { avg, personalRating, buckets };
}
/**
 * Fetch percentage summaries for every tag under that location, as well as a user's own ratings if they exist
 */
export async function getTagSummary(
  db: DBType,
  { locationId, userId }: { locationId: string; userId: number | undefined }
) {
  // left join tags on the tag reviews corresponding to that location, grouping by tag id.
  const subQuery = db
    .select({
      id: tagListTable.id,
      name: tagListTable.name,
      order: tagListTable.sortOrder,
      total: sql<number>`cast(count(${tagReviewTable.id}) as int)`.as("total"),
      likes:
        sql<number>`cast(count(*) filter (where ${tagReviewTable.vote}) as int)`.as(
          "likes"
        ),
    })
    .from(tagListTable)
    .leftJoin(
      tagReviewTable,
      and(
        eq(tagListTable.id, tagReviewTable.tagId),
        eq(tagReviewTable.locationId, locationId)
      )
    )
    .groupBy(tagListTable.id)
    .as("sq");
  // Then join on user's own reviews for that location
  const data = (
    await db
      .select()
      .from(subQuery)
      .leftJoin(
        tagReviewTable,
        and(
          and(
            eq(subQuery.id, tagReviewTable.tagId),
            eq(tagReviewTable.locationId, locationId)
          ),
          eq(tagReviewTable.userId, userId ?? -1)
        )
      )
  ).sort((tag1, tag2) => tag1.sq.order - tag2.sq.order);

  return data.map((tagData) => ({
    id: tagData.sq.id,
    name: tagData.sq.name,
    totalVotes: tagData.sq.total,
    totalLikes: tagData.sq.likes,
    myReview: tagData.tag_reviews
      ? {
          vote: tagData.tag_reviews.vote,
          text: tagData.tag_reviews.writtenReview,
          createdAt: tagData.tag_reviews.createdAt.getTime(),
          updatedAt: tagData.tag_reviews.updatedAt.getTime(),
        }
      : null,
  }));
}

export async function getAllTagReviewsForLocation(
  db: DBType,
  { locationId }: { locationId: string }
) {
  const reviews = await db
    .select()
    .from(tagReviewTable)
    .where(
      and(
        eq(tagReviewTable.locationId, locationId),
        isNotNull(tagReviewTable.writtenReview)
      )
    )
    .innerJoin(tagListTable, eq(tagReviewTable.tagId, tagListTable.id))
    .orderBy(desc(tagReviewTable.updatedAt));
  return reviews.map(({ tag_list, tag_reviews }) => ({
    ...tag_reviews,
    writtenReview: tag_reviews.writtenReview!, // we can make this assertion since we filtered out the NULL values in the SQL query above
    tagName: tag_list.name,
    createdAt: tag_reviews.createdAt.getTime(),
    updatedAt: tag_reviews.updatedAt.getTime(),
  }));
}
