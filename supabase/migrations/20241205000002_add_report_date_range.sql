-- Add date_range column to reports for storing report date range settings
ALTER TABLE reports ADD COLUMN IF NOT EXISTS date_range VARCHAR(50) DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN reports.date_range IS 'Date range preset for report data (last_7_days, last_30_days, this_month, etc.)';
