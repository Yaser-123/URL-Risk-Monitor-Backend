-- Migration: Optimize risk_stats table for deduplication
-- Created: 2026-01-17
-- Purpose: Add deduplication constraints and visit tracking

-- Step 1: Add new columns to risk_stats
ALTER TABLE risk_stats 
  ADD COLUMN IF NOT EXISTS first_seen TIMESTAMP DEFAULT NOW() NOT NULL,
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT NOW() NOT NULL,
  ADD COLUMN IF NOT EXISTS hit_count INTEGER DEFAULT 1 NOT NULL;

-- Step 2: Populate new columns for existing data
UPDATE risk_stats 
SET 
  first_seen = COALESCE(timestamp, NOW()),
  last_seen = COALESCE(timestamp, NOW()),
  hit_count = 1
WHERE first_seen IS NULL;

-- Step 3: Add UNIQUE constraint on domain
-- This prevents duplicate domains and enables UPSERT logic
ALTER TABLE risk_stats 
  ADD CONSTRAINT risk_stats_domain_unique UNIQUE (domain);

-- Step 4: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_risk_stats_domain ON risk_stats(domain);
CREATE INDEX IF NOT EXISTS idx_risk_stats_last_seen ON risk_stats(last_seen DESC);

-- Optional: Drop old timestamp column (only if you've migrated all data)
-- ALTER TABLE risk_stats DROP COLUMN IF EXISTS timestamp;

-- Verification queries:
-- SELECT COUNT(*) as total_unique_domains FROM risk_stats;
-- SELECT domain, hit_count, last_seen FROM risk_stats ORDER BY hit_count DESC LIMIT 10;
