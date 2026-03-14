CREATE TYPE "public"."externalIdType" AS ENUM('concept_id');--> statement-breakpoint
ALTER TABLE "concept_id_to_internal_id" RENAME TO "external_id_to_internal_id";--> statement-breakpoint
ALTER TABLE "external_id_to_internal_id" DROP CONSTRAINT "concept_id_to_internal_id_external_id_unique";--> statement-breakpoint
ALTER TABLE "external_id_to_internal_id" DROP CONSTRAINT "concept_id_to_internal_id_internal_id_location_data_id_fk";
--> statement-breakpoint
ALTER TABLE "external_id_to_internal_id" ADD COLUMN "external_id_type" "externalIdType" DEFAULT 'concept_id';--> statement-breakpoint
ALTER TABLE "external_id_to_internal_id" ADD CONSTRAINT "external_id_to_internal_id_internal_id_location_data_id_fk" FOREIGN KEY ("internal_id") REFERENCES "public"."location_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_id_to_internal_id" ADD CONSTRAINT "external_id_to_internal_id_external_id_unique" UNIQUE("external_id");