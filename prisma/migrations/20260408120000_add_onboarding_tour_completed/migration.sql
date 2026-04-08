-- Add onboarding_tour_completed column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_tour_completed" BOOLEAN NOT NULL DEFAULT false;
