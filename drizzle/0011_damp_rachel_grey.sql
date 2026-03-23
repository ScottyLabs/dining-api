CREATE TABLE "menu_data" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "menu_data_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"location_id" text NOT NULL,
	"images" text[] DEFAULT '{}' NOT NULL,
	"menu_items_string" text,
	CONSTRAINT "menu_data_location_id_unique" UNIQUE("location_id")
);
--> statement-breakpoint
ALTER TABLE "menu_data" ADD CONSTRAINT "menu_data_location_id_location_data_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location_data"("id") ON DELETE cascade ON UPDATE no action;