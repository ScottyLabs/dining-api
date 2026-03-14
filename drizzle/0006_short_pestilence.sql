CREATE TABLE "star_reviews" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "star_reviews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"location_id" text NOT NULL,
	"star_rating" numeric(2, 1) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rating_number_check" CHECK ("star_reviews"."star_rating" > 0 AND "star_reviews"."star_rating" <= 5 AND mod("star_reviews"."star_rating"*2,1) = 0)
);
--> statement-breakpoint
CREATE TABLE "tag_list" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tag_list_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag_reviews" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tag_reviews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tag_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"location_id" text NOT NULL,
	"vote" boolean NOT NULL,
	"written_review" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "star_reviews" ADD CONSTRAINT "star_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "star_reviews" ADD CONSTRAINT "star_reviews_location_id_location_data_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_reviews" ADD CONSTRAINT "tag_reviews_tag_id_tag_list_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_reviews" ADD CONSTRAINT "tag_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_reviews" ADD CONSTRAINT "tag_reviews_location_id_location_data_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "star_reviews_location_user_uniq" ON "star_reviews" USING btree ("location_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_reviews_location_tag_user_uniq" ON "tag_reviews" USING btree ("location_id","tag_id","user_id");