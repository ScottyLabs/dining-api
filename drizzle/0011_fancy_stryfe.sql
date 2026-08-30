CREATE TABLE "config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "location_data" ADD COLUMN "grubhub_url" text;--> statement-breakpoint
ALTER TABLE "overwrites_table" ADD COLUMN "grubhub_url" text;