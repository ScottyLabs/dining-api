import * as fs from "fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import * as dotenv from "dotenv";
import { parse } from "csv-parse/sync";

dotenv.config();

// This script is just used to load menu data from the csv file into the db.
// I will change the csv to json soon
interface MenuRow {
    image: string;
    location_id: string;
    menu_items_string: string;
}

function parseCSV(content: string): MenuRow[] {
    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
    }) as MenuRow[];

    return records;
}

async function loadMenuData() {
    const csvPath = "./menu_strings.csv";
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        process.exit(1);
    }

    try {
        const fileContent = fs.readFileSync(csvPath, "utf-8");

        const records = parseCSV(fileContent);

        if (records.length === 0) {
            process.exit(1);
        }

        const groupedByLocation = new Map<
            string,
            { images: string[]; menuItems: Set<string> }
        >();

        for (const record of records) {
            const locationId = record.location_id.trim();
            const imageName = record.image.trim();
            const menuItems = record.menu_items_string.trim();

            if (!locationId) {
                console.warn(`skipping record with no location_id:`, record);
                continue;
            }

            if (!groupedByLocation.has(locationId)) {
                groupedByLocation.set(locationId, {
                    images: [],
                    menuItems: new Set(),
                });
            }

            const group = groupedByLocation.get(locationId)!;
            if (imageName && !group.images.includes(imageName)) {
                group.images.push(imageName);
            }
            if (menuItems) {
                group.menuItems.add(menuItems);
            }
        }

        const pool = new Pool({ connectionString: databaseUrl, ssl: false });
        const db = drizzle(pool, { schema });

        const menuDataRows = Array.from(groupedByLocation.entries()).map(
            ([locationId, { images, menuItems }]) => {
                const menuString = Array.from(menuItems).join(" | ");
                const escapedImages = images
                    .map((img) => `'${img.replace(/'/g, "''")}'`)
                    .join(",");
                return {
                    locationId,
                    images: sql.raw(`ARRAY[${escapedImages}]`),
                    menuItemsString: menuString || null,
                };
            },
        );

        const existingLocations = await db
            .select({ id: schema.locationDataTable.id })
            .from(schema.locationDataTable);
        const existingLocationIds = new Set(
            existingLocations.map((loc) => loc.id),
        );

        const validRows = menuDataRows.filter((row) =>
            existingLocationIds.has(row.locationId),
        );
        const skippedCount = menuDataRows.length - validRows.length;

        if (skippedCount > 0) {
            console.warn(
                `\n skipping ${skippedCount} locations that don't exist`,
            );
        }

        if (validRows.length === 0) {
            await pool.end();
            process.exit(1);
        }

        await db
            .insert(schema.menuDataTable)
            .values(validRows)
            .onConflictDoUpdate({
                target: schema.menuDataTable.locationId,
                set: {
                    images: sql`EXCLUDED."images"`,
                    menuItemsString: sql`EXCLUDED."menu_items_string"`,
                },
            });

        await pool.end();
        process.exit(0);
    } catch (error: any) {
        console.error(error);
        process.exit(1);
    }
}

loadMenuData();
