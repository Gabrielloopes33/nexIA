-- ============================================
-- Migration: Add schedules table (Sprint 2)
-- ============================================

-- Create enum types
CREATE TYPE "ScheduleType" AS ENUM ('meeting', 'task', 'call', 'deadline');
CREATE TYPE "ScheduleStatus" AS ENUM ('pending', 'completed', 'cancelled');

-- Create schedules table
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "type" "ScheduleType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contact_id" TEXT,
    "deal_id" TEXT,
    "assigned_to" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "status" "ScheduleStatus" NOT NULL DEFAULT 'pending',
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "schedules_organization_id_idx" ON "schedules"("organization_id");
CREATE INDEX "schedules_contact_id_idx" ON "schedules"("contact_id");
CREATE INDEX "schedules_deal_id_idx" ON "schedules"("deal_id");
CREATE INDEX "schedules_assigned_to_idx" ON "schedules"("assigned_to");
CREATE INDEX "schedules_status_idx" ON "schedules"("status");
CREATE INDEX "schedules_start_time_idx" ON "schedules"("start_time");
CREATE INDEX "schedules_organization_id_start_time_idx" ON "schedules"("organization_id", "start_time");

-- Add foreign key constraints
ALTER TABLE "schedules" 
    ADD CONSTRAINT "schedules_organization_id_fkey" 
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "schedules" 
    ADD CONSTRAINT "schedules_contact_id_fkey" 
    FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "schedules" 
    ADD CONSTRAINT "schedules_deal_id_fkey" 
    FOREIGN KEY ("deal_id") REFERENCES "deals"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "schedules" 
    ADD CONSTRAINT "schedules_assigned_to_fkey" 
    FOREIGN KEY ("assigned_to") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;
