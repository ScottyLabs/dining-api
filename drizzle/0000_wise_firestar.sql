CREATE TABLE "emails" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "emails_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overwrites_table" (
	"concept_id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	"short_description" text,
	"url" text,
	"menu" text,
	"location" text,
	"coordinateLat" numeric,
	"coordinateLng" numeric,
	"accepts_online_orders" boolean,
	"times" jsonb
);
