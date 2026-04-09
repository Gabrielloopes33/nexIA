-- Migration: add token_expires_at to whatsapp_cloud_instances
-- Run this on production before deploying the next release

ALTER TABLE whatsapp_cloud_instances
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
