CREATE TABLE "weekly_time_overwrites_table" (
	"location_id" text NOT NULL,
	"weekday" integer NOT NULL,
	"time_string" text NOT NULL,
	CONSTRAINT "weekday_check" CHECK ("weekly_time_overwrites_table"."weekday" >= 0 AND "weekly_time_overwrites_table"."weekday" < 7)
);
--> statement-breakpoint
ALTER TABLE "weekly_time_overwrites_table" ADD CONSTRAINT "weekly_time_overwrites_table_location_id_location_data_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "location_weekday" ON "weekly_time_overwrites_table" USING btree ("location_id","weekday");