-- Migration: 20241202000001_initial_schema
-- Description: Initial database schema for Data Hub
-- Replaces Google Sheets backend with PostgreSQL via Supabase

-- ============================================================================
-- CLIENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  industry VARCHAR(50),
  status VARCHAR(20) DEFAULT 'onboarding' CHECK (status IN ('active', 'inactive', 'onboarding')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DATA SOURCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS data_sources (
  id VARCHAR(20) PRIMARY KEY,
  client_id VARCHAR(20) REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  source_type VARCHAR(50),
  connection_method VARCHAR(50),
  refresh_frequency VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('connected', 'pending', 'error', 'disconnected')),
  credentials_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ETL PROCESSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS etl_processes (
  id VARCHAR(20) PRIMARY KEY,
  client_id VARCHAR(20) REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  source_ids TEXT,
  destination VARCHAR(255),
  transform_description TEXT,
  schedule VARCHAR(100),
  orchestrator VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error', 'deprecated')),
  last_run TIMESTAMPTZ,
  documentation_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- KPIS
-- ============================================================================
CREATE TABLE IF NOT EXISTS kpis (
  id VARCHAR(20) PRIMARY KEY,
  client_id VARCHAR(20) REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  definition TEXT,
  data_sources TEXT,
  target_value VARCHAR(100),
  reporting_frequency VARCHAR(50),
  dashboard_location TEXT,
  owner VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REPORTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(20) PRIMARY KEY,
  client_id VARCHAR(20) REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  tool VARCHAR(50),
  frequency VARCHAR(50),
  recipients TEXT,
  data_sources TEXT,
  kpi_ids TEXT,
  url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DATA LINEAGE
-- ============================================================================
CREATE TABLE IF NOT EXISTS data_lineage (
  id VARCHAR(20) PRIMARY KEY,
  client_id VARCHAR(20) REFERENCES clients(id) ON DELETE CASCADE,
  source_id VARCHAR(20) REFERENCES data_sources(id) ON DELETE CASCADE,
  destination_type VARCHAR(20) CHECK (destination_type IN ('etl', 'kpi', 'report')),
  destination_id VARCHAR(20),
  transformation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DOCUMENTATION NOTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS documentation_notes (
  id VARCHAR(20) PRIMARY KEY,
  client_id VARCHAR(20) REFERENCES clients(id) ON DELETE SET NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(20) NOT NULL,
  note TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(255)
);

-- ============================================================================
-- DATA WAREHOUSES (client data workspace configs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS data_warehouses (
  id VARCHAR(20) PRIMARY KEY,
  client_id VARCHAR(20) REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255),
  platforms JSONB DEFAULT '[]',
  field_selections JSONB DEFAULT '{}',
  include_blended_data BOOLEAN DEFAULT true,
  schema_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PLATFORM UPLOADS (track file uploads per platform)
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_uploads (
  id VARCHAR(20) PRIMARY KEY,
  client_id VARCHAR(20) REFERENCES clients(id) ON DELETE CASCADE,
  platform_id VARCHAR(50) NOT NULL,
  filename VARCHAR(255),
  original_filename VARCHAR(255),
  file_size INTEGER,
  row_count INTEGER DEFAULT 0,
  column_headers JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PLATFORM DATA (raw uploaded data rows)
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_data (
  id VARCHAR(20) PRIMARY KEY,
  upload_id VARCHAR(20) REFERENCES platform_uploads(id) ON DELETE CASCADE,
  client_id VARCHAR(20) REFERENCES clients(id) ON DELETE CASCADE,
  platform_id VARCHAR(50) NOT NULL,
  row_index INTEGER,
  row_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BLENDED DATA (harmonized data from multiple platforms)
-- ============================================================================
CREATE TABLE IF NOT EXISTS blended_data (
  id VARCHAR(20) PRIMARY KEY,
  client_id VARCHAR(20) REFERENCES clients(id) ON DELETE CASCADE,
  blend_batch_id VARCHAR(20),
  row_data JSONB NOT NULL,
  source_platforms JSONB DEFAULT '[]',
  blended_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- KPI ALERTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS kpi_alerts (
  id VARCHAR(20) PRIMARY KEY,
  kpi_id VARCHAR(20) REFERENCES kpis(id) ON DELETE CASCADE,
  condition VARCHAR(50),
  threshold DECIMAL,
  channels JSONB DEFAULT '[]',
  recipients JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ALERT HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS alert_history (
  id VARCHAR(20) PRIMARY KEY,
  alert_id VARCHAR(20) REFERENCES kpi_alerts(id) ON DELETE CASCADE,
  kpi_id VARCHAR(20),
  actual_value DECIMAL,
  threshold DECIMAL,
  message TEXT,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_data_sources_client ON data_sources(client_id);
CREATE INDEX IF NOT EXISTS idx_etl_client ON etl_processes(client_id);
CREATE INDEX IF NOT EXISTS idx_kpis_client ON kpis(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_client ON reports(client_id);
CREATE INDEX IF NOT EXISTS idx_lineage_client ON data_lineage(client_id);
CREATE INDEX IF NOT EXISTS idx_lineage_source ON data_lineage(source_id);
CREATE INDEX IF NOT EXISTS idx_notes_entity ON documentation_notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_client ON data_warehouses(client_id);
CREATE INDEX IF NOT EXISTS idx_uploads_client ON platform_uploads(client_id);
CREATE INDEX IF NOT EXISTS idx_uploads_platform ON platform_uploads(platform_id);
CREATE INDEX IF NOT EXISTS idx_platform_data_client ON platform_data(client_id);
CREATE INDEX IF NOT EXISTS idx_platform_data_upload ON platform_data(upload_id);
CREATE INDEX IF NOT EXISTS idx_platform_data_platform ON platform_data(platform_id);
CREATE INDEX IF NOT EXISTS idx_blended_data_client ON blended_data(client_id);
CREATE INDEX IF NOT EXISTS idx_blended_data_batch ON blended_data(blend_batch_id);
CREATE INDEX IF NOT EXISTS idx_alerts_kpi ON kpi_alerts(kpi_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_alert ON alert_history(alert_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- APPLY TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS clients_updated ON clients;
CREATE TRIGGER clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS sources_updated ON data_sources;
CREATE TRIGGER sources_updated BEFORE UPDATE ON data_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS etl_updated ON etl_processes;
CREATE TRIGGER etl_updated BEFORE UPDATE ON etl_processes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS kpis_updated ON kpis;
CREATE TRIGGER kpis_updated BEFORE UPDATE ON kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS reports_updated ON reports;
CREATE TRIGGER reports_updated BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS warehouses_updated ON data_warehouses;
CREATE TRIGGER warehouses_updated BEFORE UPDATE ON data_warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS notes_updated ON documentation_notes;
CREATE TRIGGER notes_updated BEFORE UPDATE ON documentation_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS settings_updated ON settings;
CREATE TRIGGER settings_updated BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
