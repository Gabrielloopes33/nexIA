-- Migration: Add Transcriptions and Scheduling Queue
-- Created at: 2025-03-20

-- Create Transcription table
CREATE TABLE IF NOT EXISTS "transcriptions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "contact_id" UUID,
    "conversation_id" UUID,
    "source" TEXT NOT NULL,
    "source_id" TEXT,
    "title" TEXT,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transcript" TEXT,
    "summary" TEXT,
    "sentiment" TEXT,
    "sentiment_score" REAL,
    "objections" JSONB,
    "key_topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "action_items" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "converted" BOOLEAN DEFAULT false,
    "resolution_days" INTEGER,
    "audio_url" TEXT,
    "audio_size" INTEGER,
    "audio_format" TEXT,
    "recorded_at" TIMESTAMPTZ,
    "processed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for Transcription
CREATE INDEX IF NOT EXISTS "transcriptions_organization_id_idx" ON "transcriptions"("organization_id");
CREATE INDEX IF NOT EXISTS "transcriptions_contact_id_idx" ON "transcriptions"("contact_id");
CREATE INDEX IF NOT EXISTS "transcriptions_status_idx" ON "transcriptions"("status");
CREATE INDEX IF NOT EXISTS "transcriptions_source_idx" ON "transcriptions"("source");

-- Create SchedulingQueue table
CREATE TABLE IF NOT EXISTS "scheduling_queue" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "tag_id" UUID,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "notes" TEXT,
    "assigned_to" UUID,
    "scheduled_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for SchedulingQueue
CREATE INDEX IF NOT EXISTS "scheduling_queue_organization_id_idx" ON "scheduling_queue"("organization_id");
CREATE INDEX IF NOT EXISTS "scheduling_queue_status_idx" ON "scheduling_queue"("status");
CREATE INDEX IF NOT EXISTS "scheduling_queue_priority_idx" ON "scheduling_queue"("priority" DESC);
CREATE INDEX IF NOT EXISTS "scheduling_queue_contact_id_idx" ON "scheduling_queue"("contact_id");

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transcriptions_updated_at BEFORE UPDATE ON "transcriptions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduling_queue_updated_at BEFORE UPDATE ON "scheduling_queue"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
