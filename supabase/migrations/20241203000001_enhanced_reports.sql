-- Migration: 20241203000001_enhanced_reports
-- Description: Extends reports table with visualization config, scheduling, and delivery options
-- Also adds SMTP configuration, report alerts, and scheduled jobs tables

-- ============================================================================
-- EXTEND REPORTS TABLE
-- ============================================================================
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR(20) REFERENCES data_warehouses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS visualization_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS schedule_config JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_format VARCHAR(20) DEFAULT 'view_only',
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS send_count INTEGER DEFAULT 0;

-- Add check constraint for delivery_format
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_delivery_format_check'
  ) THEN
    ALTER TABLE reports
    ADD CONSTRAINT reports_delivery_format_check
    CHECK (delivery_format IN ('csv', 'pdf', 'view_only'));
  END IF;
END $$;

-- Index for scheduled report queries
CREATE INDEX IF NOT EXISTS idx_reports_scheduled ON reports(is_scheduled, next_run_at) WHERE is_scheduled = true;
CREATE INDEX IF NOT EXISTS idx_reports_warehouse ON reports(warehouse_id);

-- ============================================================================
-- SMTP CONFIGURATION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS smtp_config (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL DEFAULT 'Default',
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL DEFAULT 587,
  secure BOOLEAN DEFAULT false,
  auth_user VARCHAR(255),
  auth_pass_encrypted TEXT,
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(100),
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smtp_default ON smtp_config(is_default) WHERE is_default = true;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS smtp_config_updated ON smtp_config;
CREATE TRIGGER smtp_config_updated BEFORE UPDATE ON smtp_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- REPORT ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_alerts (
  id VARCHAR(20) PRIMARY KEY,
  report_id VARCHAR(20) REFERENCES reports(id) ON DELETE CASCADE,
  alert_type VARCHAR(30) NOT NULL,
  name VARCHAR(255) NOT NULL,
  config JSONB NOT NULL,
  recipients JSONB DEFAULT '[]',
  channels JSONB DEFAULT '["email"]',
  active BOOLEAN DEFAULT true,
  last_evaluated_at TIMESTAMPTZ,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add check constraint for alert_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'report_alerts_type_check'
  ) THEN
    ALTER TABLE report_alerts
    ADD CONSTRAINT report_alerts_type_check
    CHECK (alert_type IN ('metric_threshold', 'trend_detection', 'data_freshness'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_report_alerts_report ON report_alerts(report_id);
CREATE INDEX IF NOT EXISTS idx_report_alerts_active ON report_alerts(active) WHERE active = true;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS report_alerts_updated ON report_alerts;
CREATE TRIGGER report_alerts_updated BEFORE UPDATE ON report_alerts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- REPORT ALERT HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_alert_history (
  id VARCHAR(20) PRIMARY KEY,
  alert_id VARCHAR(20) REFERENCES report_alerts(id) ON DELETE CASCADE,
  report_id VARCHAR(20),
  alert_type VARCHAR(30),
  actual_value DECIMAL,
  threshold_value DECIMAL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_alert_history_alert ON report_alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_report_alert_history_triggered ON report_alert_history(triggered_at);

-- ============================================================================
-- SCHEDULED JOBS TABLE (for persistence across restarts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id VARCHAR(20) PRIMARY KEY,
  job_type VARCHAR(30) NOT NULL,
  entity_id VARCHAR(20) NOT NULL,
  cron_expression VARCHAR(100),
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  last_status VARCHAR(20),
  last_error TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_jobs_type_check'
  ) THEN
    ALTER TABLE scheduled_jobs
    ADD CONSTRAINT scheduled_jobs_type_check
    CHECK (job_type IN ('report_delivery', 'alert_evaluation'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_jobs_status_check'
  ) THEN
    ALTER TABLE scheduled_jobs
    ADD CONSTRAINT scheduled_jobs_status_check
    CHECK (last_status IN ('success', 'failed', 'running', 'pending') OR last_status IS NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next ON scheduled_jobs(next_run_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_entity ON scheduled_jobs(job_type, entity_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS scheduled_jobs_updated ON scheduled_jobs;
CREATE TRIGGER scheduled_jobs_updated BEFORE UPDATE ON scheduled_jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- REPORT DELIVERY HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_delivery_history (
  id VARCHAR(20) PRIMARY KEY,
  report_id VARCHAR(20) REFERENCES reports(id) ON DELETE CASCADE,
  delivery_format VARCHAR(20),
  recipients JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  file_size INTEGER,
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add check constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'report_delivery_history_status_check'
  ) THEN
    ALTER TABLE report_delivery_history
    ADD CONSTRAINT report_delivery_history_status_check
    CHECK (status IN ('pending', 'sending', 'sent', 'failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_report_delivery_history_report ON report_delivery_history(report_id);
CREATE INDEX IF NOT EXISTS idx_report_delivery_history_delivered ON report_delivery_history(delivered_at);
