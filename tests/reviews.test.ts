import {
  addStarReview,
  deleteStarReview,
  getAllTagReviewsForLocation,
  getStarSummary,
  getTagSummary,
  initializeTags,
  updateTagReview,
} from "db/reviews";
import { dbTest } from "./dbstub";
import { createUserSession, DBUser, fetchUserSession } from "db/auth";
import { addLocationDataToDb } from "db/updateLocation";
import { ILocation } from "types";
import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { DBType } from "db/db";
import { Pool } from "pg";
const locationIn: ILocation = {
  name: "dbTest",
  acceptsOnlineOrders: false,
  conceptId: 1,
  coordinates: { lat: 1, lng: 10 },
  description: "description",
  today: {
    year: 2025,
    month: 1,
    day: 1,
  },
  times: [],
  location: "location",
  menu: "menu",
  shortDescription: "hi",
  url: "https://hi.com",
  todaysSoups: [],
  todaysSpecials: [],
};

const reviewTest = dbTest.extend<{
  ctx: {
    db: DBType;
    container: StartedPostgreSqlContainer;
    pool: Pool;
    locationId1: string;
    locationId2: string;
    user1: DBUser;
    user2: DBUser;
  };
}>({
  ctx: async ({ ctx: { db, container, pool } }, use) => {
    // seed data with test locations, test users, and tags
    const locationId1 = await addLocationDataToDb(db, locationIn);
    const locationId2 = await addLocationDataToDb(db, {
      ...locationIn,
      conceptId: 9,
    });
    const userSessionId1 = await createUserSession(db, {
      googleId: "g",
      firstName: "",
      lastName: "",
      email: "a1@cmu.edu",
      pfpURL: undefined,
    });
    const user1 = (await fetchUserSession(db, userSessionId1!))!;
    const userSessionId2 = await createUserSession(db, {
      googleId: "g2",
      firstName: "",
      lastName: "",
      email: "a2@cmu.edu",
      pfpURL: undefined,
    });
    const user2 = (await fetchUserSession(db, userSessionId2!))!;
    await initializeTags(db, [
      "Food (nutrition)",
      "Food (taste)",
      "Food (portion size)",
      "Fair pricing (blocks)",
      "Fair pricing (card)",
      "Dietary Accommodations",
      "Staff/Service",
      "Environment",
      "Opening hours",
    ]);
    use({ db, container, pool, locationId1, locationId2, user1, user2 });
  },
});

describe("location review tests", () => {
  reviewTest.concurrent(
    "add and fetch tag review",
    async ({ ctx: { db, locationId1, user1, locationId2, user2 } }) => {
      await updateTagReview(db, {
        locationId: locationId1,
        userId: user1.id,
        tagId: 1,
        voteUp: true,
        text: "good",
      });
      await updateTagReview(db, {
        locationId: locationId1,
        userId: user1.id,
        tagId: 1,
        voteUp: false,
        text: "bad",
      });
      await updateTagReview(db, {
        locationId: locationId2,
        userId: user1.id,
        tagId: 1,
        voteUp: true,
        text: "good",
      });
      const tagSummary1 = await getTagSummary(db, {
        locationId: locationId1,
        userId: user1.id,
      });
      const tagSummary2 = await getTagSummary(db, {
        locationId: locationId1,
        userId: user2.id,
      });

      expect(tagSummary1.length).toBe(9);
      expect(tagSummary1).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            totalVotes: 1,
            totalLikes: 0,
            myReview: expect.objectContaining({ vote: false, text: "bad" }),
          }),
        ])
      );
      expect(tagSummary2).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            totalVotes: 1,
            totalLikes: 0,
            myReview: null, // this person has not reviewed this tag
          }),
        ])
      );
      const allReviewsForLocation1 = await getAllTagReviewsForLocation(db, {
        locationId: locationId1,
      });
      const allReviewsForLocation2 = await getAllTagReviewsForLocation(db, {
        locationId: locationId2,
      });
      expect(allReviewsForLocation1).toHaveLength(1);
      expect(allReviewsForLocation2).toHaveLength(1);
      expect(allReviewsForLocation1[0]).toMatchObject({
        tagId: 1,
        userId: user1.id,
        locationId: locationId1,
        vote: false,
        writtenReview: "bad",
        tagName: "Food (nutrition)",
      });
      expect(allReviewsForLocation2[0]).toMatchObject({
        tagId: 1,
        userId: user1.id,
        locationId: locationId2,
        vote: true,
        writtenReview: "good",
        tagName: "Food (nutrition)",
      });
    }
  );
  reviewTest.concurrent(
    "add and get star ratings",
    async ({ ctx: { db, locationId1, user1, locationId2, user2 } }) => {
      await addStarReview(db, {
        locationId: locationId1,
        userId: user1.id,
        rating: 2.5,
      });
      await addStarReview(db, {
        locationId: locationId1,
        userId: user1.id,
        rating: 3.5, // nvm changed rating
      });
      await addStarReview(db, {
        locationId: locationId1,
        userId: user2.id,
        rating: 5,
      });
      expect(
        await getStarSummary(db, { locationId: locationId1, userId: user1.id })
      ).toEqual({
        avg: 4.25,
        personalRating: 3.5,
        buckets: [0, 0, 0, 1, 0, 1],
      });
      expect(
        await getStarSummary(db, { locationId: locationId1, userId: user2.id })
      ).toEqual({ avg: 4.25, personalRating: 5, buckets: [0, 0, 0, 1, 0, 1] });
      expect(
        await getStarSummary(db, { locationId: locationId2, userId: user1.id })
      ).toEqual({
        avg: null,
        personalRating: null,
        buckets: [0, 0, 0, 0, 0, 0],
      });
      expect(
        await getStarSummary(db, { locationId: locationId2, userId: user2.id })
      ).toEqual({
        avg: null,
        personalRating: null,
        buckets: [0, 0, 0, 0, 0, 0],
      });
    }
  );
  reviewTest.concurrent(
    "add malformed rating",
    async ({ ctx: { db, locationId1, user1, locationId2, user2 } }) => {
      expect(
        addStarReview(db, {
          locationId: locationId1,
          userId: user2.id,
          rating: 2.3,
        })
      ).rejects.toThrowError();
      expect(
        addStarReview(db, {
          locationId: locationId1,
          userId: user2.id,
          rating: 0,
        })
      ).rejects.toThrowError();
      expect(
        addStarReview(db, {
          locationId: locationId1,
          userId: user2.id,
          rating: -2,
        })
      ).rejects.toThrowError();
      expect(
        await getStarSummary(db, { locationId: locationId1, userId: user1.id })
      ).toEqual({
        avg: null,
        personalRating: null,
        buckets: [0, 0, 0, 0, 0, 0],
      }); // no change to rating
    }
  );
  reviewTest.concurrent(
    "delete rating",
    async ({ ctx: { db, locationId1, user1, user2 } }) => {
      await addStarReview(db, {
        locationId: locationId1,
        userId: user1.id,
        rating: 2.5,
      });
      await deleteStarReview(db, {
        locationId: locationId1,
        userId: user1.id,
      });
      expect(
        await getStarSummary(db, { locationId: locationId1, userId: user1.id })
      ).toEqual({
        avg: null,
        personalRating: null,
        buckets: [0, 0, 0, 0, 0, 0],
      });
      expect(
        await getStarSummary(db, { locationId: locationId1, userId: user2.id })
      ).toEqual({
        avg: null,
        personalRating: null,
        buckets: [0, 0, 0, 0, 0, 0],
      });
    }
  );

  reviewTest.concurrent(
    "delete tag review",
    async ({ ctx: { db, locationId1, user1, locationId2, user2 } }) => {
      await updateTagReview(db, {
        locationId: locationId1,
        userId: user1.id,
        tagId: 1,
        voteUp: true,
        text: "good",
      });
      await updateTagReview(db, {
        locationId: locationId1,
        userId: user1.id,
        tagId: 1,
        voteUp: null,
        text: null,
      });
      const tagSummary1 = await getTagSummary(db, {
        locationId: locationId1,
        userId: user1.id,
      });
      const tagSummary2 = await getTagSummary(db, {
        locationId: locationId1,
        userId: user2.id,
      });

      expect(tagSummary1.length).toBe(9);
      expect(tagSummary1).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            totalVotes: 0,
            totalLikes: 0,
            myReview: null,
          }),
        ])
      );
      expect(tagSummary2).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            totalVotes: 0,
            totalLikes: 0,
            myReview: null,
          }),
        ])
      );
      const allReviewsForLocation1 = await getAllTagReviewsForLocation(db, {
        locationId: locationId1,
      });
      const allReviewsForLocation2 = await getAllTagReviewsForLocation(db, {
        locationId: locationId2,
      });
      expect(allReviewsForLocation1).toHaveLength(0);
      expect(allReviewsForLocation2).toHaveLength(0);
    }
  );
  reviewTest.concurrent(
    "add review to nonexistent tag",
    async ({ ctx: { db, locationId1, user1, locationId2, user2 } }) => {
      expect(
        updateTagReview(db, {
          locationId: locationId1,
          userId: user1.id,
          tagId: 100,
          voteUp: true,
          text: "good",
        })
      ).rejects.toThrowError();

      const tagSummary1 = await getTagSummary(db, {
        locationId: locationId1,
        userId: user1.id,
      });
      const tagSummary2 = await getTagSummary(db, {
        locationId: locationId1,
        userId: user2.id,
      });

      expect(tagSummary1.length).toBe(9);
      expect(tagSummary1).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            totalVotes: 0,
            totalLikes: 0,
            myReview: null,
          }),
        ])
      );
      expect(tagSummary2).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            totalVotes: 0,
            totalLikes: 0,
            myReview: null,
          }),
        ])
      );
      const allReviewsForLocation1 = await getAllTagReviewsForLocation(db, {
        locationId: locationId1,
      });
      const allReviewsForLocation2 = await getAllTagReviewsForLocation(db, {
        locationId: locationId2,
      });
      expect(allReviewsForLocation1).toHaveLength(0);
      expect(allReviewsForLocation2).toHaveLength(0);
    }
  );
});
