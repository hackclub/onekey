ALTER TABLE "shop_items" ADD COLUMN "options" text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN "selected_options" text DEFAULT '{}' NOT NULL;
