ALTER TABLE "project_approvals" ADD COLUMN "nps_heard_about" text;--> statement-breakpoint
ALTER TABLE "project_approvals" ADD COLUMN "nps_doing_well" text;--> statement-breakpoint
ALTER TABLE "project_approvals" ADD COLUMN "nps_improve" text;--> statement-breakpoint
ALTER TABLE "approved_submissions" ADD COLUMN "nps_heard_about" text;--> statement-breakpoint
ALTER TABLE "approved_submissions" ADD COLUMN "nps_doing_well" text;--> statement-breakpoint
ALTER TABLE "approved_submissions" ADD COLUMN "nps_improve" text;
