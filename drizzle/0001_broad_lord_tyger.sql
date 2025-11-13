CREATE TYPE "public"."specialType" AS ENUM('special', 'soup');--> statement-breakpoint
CREATE TABLE "concept_id_to_internal_id" (
	"internal_id" text NOT NULL,
	"external_id" text PRIMARY KEY NOT NULL,
	CONSTRAINT "concept_id_to_internal_id_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "location_data" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"short_description" text,
	"description" text NOT NULL,
	"url" text NOT NULL,
	"menu" text,
	"location" text NOT NULL,
	"coordinate_lat" numeric,
	"coordinate_lng" numeric,
	"acceptsOnlineOrders" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specials" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "specials_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"location_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"date" date NOT NULL,
	"type" "specialType" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_overwrites_table" (
	"location_id" text NOT NULL,
	"date" date NOT NULL,
	"time_string" text NOT NULL,
	CONSTRAINT "time_overwrites_table_location_id_date_pk" PRIMARY KEY("location_id","date")
);
--> statement-breakpoint
CREATE TABLE "location_times" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "location_times_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"location_id" text NOT NULL,
	"date" date NOT NULL,
	"start_time" integer NOT NULL,
	"end_time" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "overwrites_table" RENAME COLUMN "concept_id" TO "location_id";--> statement-breakpoint

-- Manual
ALTER TABLE "overwrites_table" ALTER COLUMN "location_id" TYPE TEXT, ALTER COLUMN "location_id" SET NOT NULL; --> statement-breakpoint
-- Manual

ALTER TABLE "concept_id_to_internal_id" ADD CONSTRAINT "concept_id_to_internal_id_internal_id_location_data_id_fk" FOREIGN KEY ("internal_id") REFERENCES "public"."location_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specials" ADD CONSTRAINT "specials_location_id_location_data_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_overwrites_table" ADD CONSTRAINT "time_overwrites_table_location_id_location_data_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_times" ADD CONSTRAINT "location_times_location_id_location_data_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "date_lookup" ON "location_times" USING btree ("location_id","date");--> statement-breakpoint
ALTER TABLE "overwrites_table" ADD CONSTRAINT "overwrites_table_location_id_location_data_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overwrites_table" DROP COLUMN "times";