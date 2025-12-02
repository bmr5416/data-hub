-- Schema Alignment Migration
-- Fixes column mismatches between code and database

-- ============================================================================
-- SCHEDULED_JOBS: Add is_active column (code expects is_active, table has enabled)
-- ============================================================================

-- Add is_active column if it doesn't exist
ALTER TABLE scheduled_jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Sync is_active with enabled if enabled exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_jobs' AND column_name = 'enabled'
  ) THEN
    UPDATE scheduled_jobs SET is_active = enabled WHERE is_active IS NULL;
  END IF;
END $$;

-- ============================================================================
-- PLATFORM_UPLOADS: Add warehouse_id column
-- ============================================================================

-- Add warehouse_id column for linking uploads to warehouses
ALTER TABLE platform_uploads ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR(20) REFERENCES data_warehouses(id) ON DELETE SET NULL;

-- Create index for warehouse lookups
CREATE INDEX IF NOT EXISTS idx_platform_uploads_warehouse_id ON platform_uploads(warehouse_id);

-- ============================================================================
-- SCHEDULED_JOBS: Add status column if missing
-- ============================================================================

-- The code uses 'status' for active job filtering
ALTER TABLE scheduled_jobs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
