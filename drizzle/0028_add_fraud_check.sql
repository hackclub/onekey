ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "fraud_check" boolean DEFAULT false NOT NULL;
