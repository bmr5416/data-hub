-- Add additional KPI fields for enhanced reporting
ALTER TABLE kpis
  ADD COLUMN IF NOT EXISTS metric VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS format VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_value DECIMAL DEFAULT NULL;

-- Add comments explaining the columns
COMMENT ON COLUMN kpis.metric IS 'The metric being tracked (spend, impressions, roas, etc.)';
COMMENT ON COLUMN kpis.format IS 'Display format for the KPI value (currency, percentage, number, compact)';
COMMENT ON COLUMN kpis.current_value IS 'Current calculated value of the KPI';
