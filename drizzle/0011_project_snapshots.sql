CREATE TABLE "project_explore_snapshots" (
	"project_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"screenshot_url" text,
	"demo_url" text,
	"total_approved_seconds" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_explore_snapshots_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade
);
