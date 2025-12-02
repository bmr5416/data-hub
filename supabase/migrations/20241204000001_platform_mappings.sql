-- Platform Mappings Table
-- Stores custom client-specific field mappings that override system defaults

CREATE TABLE IF NOT EXISTS platform_mappings (
  id VARCHAR(20) PRIMARY KEY,
  client_id VARCHAR(20) REFERENCES clients(id) ON DELETE CASCADE,
  platform_id VARCHAR(50) NOT NULL,
  field_type VARCHAR(20) CHECK (field_type IN ('dimension', 'metric')),
  canonical_id VARCHAR(50) NOT NULL,
  platform_field_name VARCHAR(255) NOT NULL,
  transformation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups by client and platform
CREATE INDEX IF NOT EXISTS idx_mappings_client_platform ON platform_mappings(client_id, platform_id);

-- Unique constraint to prevent duplicate mappings
CREATE UNIQUE INDEX IF NOT EXISTS idx_mappings_unique ON platform_mappings(client_id, platform_id, field_type, canonical_id);

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION update_platform_mappings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS platform_mappings_updated_at ON platform_mappings;
CREATE TRIGGER platform_mappings_updated_at
  BEFORE UPDATE ON platform_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_mappings_timestamp();
