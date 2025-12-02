-- Performance Indexes for Common Query Patterns
-- Adds indexes to optimize frequently accessed data paths

-- Platform data lookups by client and platform
-- Used by: getPlatformData, getPlatformDataByDateRange
CREATE INDEX IF NOT EXISTS idx_platform_data_client_platform
  ON platform_data(client_id, platform_id);

-- Platform data lookups by upload (for rollback and data management)
CREATE INDEX IF NOT EXISTS idx_platform_data_upload_id
  ON platform_data(upload_id);

-- Platform uploads by client (for upload history)
CREATE INDEX IF NOT EXISTS idx_platform_uploads_client_id
  ON platform_uploads(client_id);

-- Platform uploads by status (for processing queue)
CREATE INDEX IF NOT EXISTS idx_platform_uploads_status
  ON platform_uploads(status);

-- Data warehouses by client
CREATE INDEX IF NOT EXISTS idx_data_warehouses_client_id
  ON data_warehouses(client_id);

-- Reports by client
CREATE INDEX IF NOT EXISTS idx_reports_client_id
  ON reports(client_id);

-- Reports by schedule status (for scheduler lookups)
CREATE INDEX IF NOT EXISTS idx_reports_is_scheduled
  ON reports(is_scheduled) WHERE is_scheduled = TRUE;

-- Report delivery history by report and date (for recent history)
CREATE INDEX IF NOT EXISTS idx_report_delivery_history_report_delivered
  ON report_delivery_history(report_id, delivered_at DESC);

-- Report alerts by report
CREATE INDEX IF NOT EXISTS idx_report_alerts_report_id
  ON report_alerts(report_id);

-- Alert history by alert and date
CREATE INDEX IF NOT EXISTS idx_report_alert_history_alert_id
  ON report_alert_history(alert_id, triggered_at DESC);

-- Scheduled jobs by enabled flag (for active job lookups)
-- Note: The 'enabled' column exists in the original schema
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_enabled
  ON scheduled_jobs(enabled) WHERE enabled = true;

-- Data sources by client
CREATE INDEX IF NOT EXISTS idx_data_sources_client_id
  ON data_sources(client_id);

-- User client assignments by user (for permission checks)
CREATE INDEX IF NOT EXISTS idx_user_client_assignments_user_id
  ON user_client_assignments(user_id);

-- User client assignments by client (for client team lookups)
CREATE INDEX IF NOT EXISTS idx_user_client_assignments_client_id
  ON user_client_assignments(client_id);

-- Blended data by client
CREATE INDEX IF NOT EXISTS idx_blended_data_client_id
  ON blended_data(client_id);

-- Data lineage lookups
CREATE INDEX IF NOT EXISTS idx_data_lineage_source_id
  ON data_lineage(source_id);

CREATE INDEX IF NOT EXISTS idx_data_lineage_destination
  ON data_lineage(destination_type, destination_id);

CREATE INDEX IF NOT EXISTS idx_data_lineage_client_id
  ON data_lineage(client_id);
