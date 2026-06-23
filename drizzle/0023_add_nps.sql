ALTER TABLE "project_approvals" ADD COLUMN IF NOT EXISTS "nps_heard_about" text;--> statement-breakpoint
ALTER TABLE "project_approvals" ADD COLUMN IF NOT EXISTS "nps_doing_well" text;--> statement-breakpoint
ALTER TABLE "project_approvals" ADD COLUMN IF NOT EXISTS "nps_improve" text;--> statement-breakpoint
ALTER TABLE "approved_submissions" ADD COLUMN IF NOT EXISTS "nps_heard_about" text;--> statement-breakpoint
ALTER TABLE "approved_submissions" ADD COLUMN IF NOT EXISTS "nps_doing_well" text;--> statement-breakpoint
ALTER TABLE "approved_submissions" ADD COLUMN IF NOT EXISTS "nps_improve" text;
