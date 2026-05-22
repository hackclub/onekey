CREATE TABLE "project_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"message" text,
	"internal_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "project_events" ADD CONSTRAINT "project_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "project_events" ADD CONSTRAINT "project_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
