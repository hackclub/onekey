ALTER TABLE "users" ADD COLUMN "street_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locality" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "key_sfx_enabled" boolean DEFAULT true NOT NULL;