import { DBType } from "./db";
import { emailTable } from "./schema";

export async function populateEmails(db: DBType) {
  await db.insert(emailTable).values([
    {
      email: "czech@un.org",
      name: "Czech Republic",
    },
    {
      email: "slovakia@un.org",
      name: "Slovakia",
    },
    {
      email: "poland@un.org",
      name: "Poland",
    },
    {
      email: "hungary@un.org",
      name: "Hungary",
    },
    {
      email: "romania@un.org",
      name: "Romania",
    },
  ]);
}
