import { notifySlack } from "utils/slack";
import { DBType } from "./db";
import { UserSessionTable, UserTable } from "./schema";
import { Column, eq, sql } from "drizzle-orm";
import { PgTable, PgUpdateSetSource } from "drizzle-orm/pg-core";

interface User {
  firstName: string | undefined;
  lastName: string | undefined;
  pfpURL: string | undefined;
  email: string | undefined;
  googleId: string | undefined;
}
export async function createUserSession(db: DBType, user: User) {
  if (user.googleId === undefined) return;
  if (user.email === undefined || user.email.match(/.+@.*cmu.edu/g) === null) {
    notifySlack(`Skipped adding user with email ${user.email}`);
    return;
  }
  let dbUserEntry = (
    await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.googleId, user.googleId))
  )[0];
  dbUserEntry = await createOrUpdateUser(
    db,
    { ...user, googleId: user.googleId, email: user.email }, // just to pass typechecking
    dbUserEntry?.id
  );
  if (dbUserEntry === undefined) return;

  const newSession = (
    await db
      .insert(UserSessionTable)
      .values({
        userId: dbUserEntry.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        sessionId: crypto.randomUUID(),
      })
      .returning()
  )[0];
  return newSession === undefined ? undefined : newSession.sessionId;
}
async function createOrUpdateUser(
  db: DBType,
  user: User & { googleId: string; email: string },
  userId: number | undefined
) {
  return (
    await db
      .insert(UserTable)
      .values({
        id: userId,
        googleId: user.googleId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        pictureUrl: user.pfpURL,
      })
      .onConflictDoUpdate({
        target: UserTable.id,
        set: conflictUpdateSet(UserTable, [
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
export async function fetchUserSession(db: DBType, sessionId: string) {
  const session = (
    await db
      .select()
      .from(UserSessionTable)
      .where(eq(UserSessionTable.sessionId, sessionId))
      .innerJoin(UserTable, eq(UserSessionTable.userId, UserTable.id))
  )[0];
  if (session === undefined || +session.sessions.expiresAt < Date.now())
    return null;
  return session.users;
}
function conflictUpdateSet<TTable extends PgTable>(
  table: TTable,
  columns: (keyof TTable["_"]["columns"] & keyof TTable)[]
): PgUpdateSetSource<TTable> {
  return Object.assign(
    {},
    ...columns.map((k) => ({
      [k]: sql.raw(`excluded.${(table[k] as Column).name}`),
    }))
  ) as PgUpdateSetSource<TTable>;
}
