import { notifySlack } from "utils/slack";
import { DBType } from "./db";
import { userSessionTable, userTable } from "./schema";
import { eq } from "drizzle-orm";
import { conflictUpdateSet } from "./util";
import { env } from "env";

interface User {
  firstName: string | undefined;
  lastName: string | undefined;
  pfpURL: string | undefined;
  email: string | undefined;
  googleId: string | undefined;
}

/**
 * Creates a session for the user, and adds user to database if new user
 * @param db
 * @param user
 * @returns User session id, or undefined if failed to create session
 */
export async function createUserSession(db: DBType, user: User) {
  if (user.googleId === undefined) return;
  if (
    user.email === undefined ||
    user.email.match(/^.+@(?:[^@]+\.)?cmu\.edu$/i) === null
  ) {
    notifySlack(`Skipped adding user with email ${user.email}`);
    return;
  }
  let dbUserEntry = (
    await db
      .select()
      .from(userTable)
      .where(eq(userTable.googleId, user.googleId))
  )[0];
  dbUserEntry = await createOrUpdateUser(
    db,
    { ...user, googleId: user.googleId, email: user.email }, // just to pass typechecking
    dbUserEntry?.id
  );
  if (dbUserEntry === undefined) return;

  const newSession = (
    await db
      .insert(userSessionTable)
      .values({
        userId: dbUserEntry.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        sessionId: crypto.randomUUID(),
      })
      .returning()
  )[0];
  return newSession?.sessionId;
}
async function createOrUpdateUser(
  db: DBType,
  user: User & { googleId: string; email: string },
  userId: number | undefined
) {
  return (
    await db
      .insert(userTable)
      .values({
        id: userId, // user id will get generated automatically if we pass in undefined
        googleId: user.googleId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        pictureUrl: user.pfpURL,
      })
      .onConflictDoUpdate({
        target: userTable.id,
        set: conflictUpdateSet(userTable, [
          "updatedAt",
          "email",
          "firstName",
          "lastName",
          "pictureUrl",
        ]),
      })
      .returning()
  )[0];
}
export type DBUser = typeof userTable.$inferSelect;
export async function fetchUserSession(
  db: DBType,
  sessionId: string
): Promise<DBUser | null> {
  const session = (
    await db
      .select()
      .from(userSessionTable)
      .where(eq(userSessionTable.sessionId, sessionId))
      .innerJoin(userTable, eq(userSessionTable.userId, userTable.id))
  )[0];
  if (session === undefined || +session.sessions.expiresAt < Date.now())
    return null;
  return session.users;
}
