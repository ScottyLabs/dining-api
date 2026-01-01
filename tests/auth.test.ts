import { createUserSession, fetchUserSession } from "db/auth";
import { dbTest } from "./dbstub";

describe("auth tests", () => {
  dbTest.concurrent("test invalid emails", async ({ ctx: { db } }) => {
    expect(
      await createUserSession(db, {
        googleId: "1",
        email: "1@2.com",
        firstName: "John",
        lastName: "Smith",
        pfpURL: "ok.com",
      })
    ).toBe(undefined);
    expect(
      await createUserSession(db, {
        googleId: "1",
        email: "hi@gmail.com",
        firstName: "John",
        lastName: "Smith",
        pfpURL: "ok.com",
      })
    ).toBe(undefined);
    expect(
      await createUserSession(db, {
        googleId: "1",
        email: "e@andrew.cmu.edu",
        firstName: "John",
        lastName: "Smith",
        pfpURL: "ok.com",
      })
    ).not.toBe(undefined);
    expect(
      await createUserSession(db, {
        googleId: "1",
        email: "e@cmu.edu",
        firstName: "John",
        lastName: "Smith",
        pfpURL: "ok.com",
      })
    ).not.toBe(undefined);
  });
  dbTest.concurrent("happy path", async ({ ctx: { db } }) => {
    const sessionId = await createUserSession(db, {
      googleId: "1",
      email: "e@andrew.cmu.edu",
      firstName: "John",
      lastName: "Smith",
      pfpURL: "ok.com",
    });

    const user = await fetchUserSession(db, sessionId!);
    expect(user).toMatchObject({
      googleId: "1",
      email: "e@andrew.cmu.edu",
      firstName: "John",
      lastName: "Smith",
      pictureUrl: "ok.com",
    });
    const noUser = await fetchUserSession(db, "bleh");
    expect(noUser).toBe(null);
  });
  dbTest.concurrent("undefined fields", async ({ ctx: { db } }) => {
    const sessionId = await createUserSession(db, {
      googleId: "1",
      email: "e@andrew.cmu.edu",
      firstName: undefined,
      lastName: undefined,
      pfpURL: undefined,
    });

    const user = await fetchUserSession(db, sessionId!);
    expect(user).toMatchObject({
      googleId: "1",
      email: "e@andrew.cmu.edu",
    });
  });
  dbTest.concurrent("updating user", async ({ ctx: { db } }) => {
    const sessionId1 = await createUserSession(db, {
      googleId: "1",
      email: "e@andrew.cmu.edu",
      firstName: undefined,
      lastName: undefined,
      pfpURL: undefined,
    });
    const sessionId2 = await createUserSession(db, {
      googleId: "1",
      email: "e@andrew.cmu.edu",
      firstName: "Defined",
      lastName: undefined,
      pfpURL: undefined,
    });

    const user = await fetchUserSession(db, sessionId1!);
    expect(user).toMatchObject({
      googleId: "1",
      email: "e@andrew.cmu.edu",
      firstName: "Defined",
    });
  });
});
