-- Add metadata column to platform_uploads for storing additional upload information
ALTER TABLE platform_uploads ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN platform_uploads.metadata IS 'Optional JSON metadata for uploads (date ranges, column mappings, etc.)';
