import { DBType } from "./db";
import { initializeTags } from "./reviews";
import { emailTable, tagListTable } from "./schema";

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
export async function populateTags(db: DBType) {
  const existingTags = await db.select().from(tagListTable);
  if (existingTags.length) return;
  await initializeTags(db, [
    "Food Quality",
    "Healthy Options",
    "Pricing (blocks)",
    "Pricing (card)",
    "Dietary Accomm.",
    "Staff/Service",
    "Environment",
    "Opening hours",
  ]);
}
