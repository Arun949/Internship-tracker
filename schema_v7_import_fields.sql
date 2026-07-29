-- ════════════════════════════════════════════════════════════════
-- InternTrack — Schema Update 7
-- Add attachments / job_links / tags / status_history to internship_cards
-- (these columns are written by the app's multi-doc, multi-link, tags,
--  status-timeline, and Excel/CSV import features)
-- Run this once in: supabase.com → your project → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════

ALTER TABLE internship_cards ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE internship_cards ADD COLUMN IF NOT EXISTS job_links jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE internship_cards ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE internship_cards ADD COLUMN IF NOT EXISTS status_history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill status_history for existing rows that predate this feature,
-- so their timeline starts from their current status instead of being empty.
UPDATE internship_cards
SET status_history = jsonb_build_array(jsonb_build_object('status', status, 'changed_at', COALESCE(updated_at, created_at)))
WHERE status_history = '[]'::jsonb;
