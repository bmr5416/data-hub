-- Migration: 20241206000001_auth_system
-- Description: Supabase Auth integration with user profiles, client assignments, and RLS policies
-- Features:
--   - User profiles linked to Supabase auth.users
--   - User-client assignments for multi-tenant access control
--   - RLS helper functions for access checks
--   - RLS policies for all client-scoped tables

-- ============================================================================
-- USER PROFILES TABLE
-- Links Supabase auth.users to application-level user data
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin) WHERE is_admin = TRUE;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS user_profiles_updated ON user_profiles;
CREATE TRIGGER user_profiles_updated BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- USER-CLIENT ASSIGNMENTS TABLE
-- Many-to-many relationship with role-based access
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id VARCHAR(20) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer',
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one role per user-client pair
  CONSTRAINT user_client_unique UNIQUE (user_id, client_id)
);

-- Role constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_client_assignments_role_check'
  ) THEN
    ALTER TABLE user_client_assignments
    ADD CONSTRAINT user_client_assignments_role_check
    CHECK (role IN ('viewer', 'editor', 'admin'));
  END IF;
END $$;

-- Indexes for user_client_assignments
CREATE INDEX IF NOT EXISTS idx_user_client_user ON user_client_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_client_client ON user_client_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_user_client_role ON user_client_assignments(role);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS user_client_assignments_updated ON user_client_assignments;
CREATE TRIGGER user_client_assignments_updated BEFORE UPDATE ON user_client_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- RLS HELPER FUNCTIONS
-- ============================================================================

-- Check if current user is a global admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_admin = TRUE
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user has any access to a client
CREATE OR REPLACE FUNCTION has_client_access(target_client_id VARCHAR(20))
RETURNS BOOLEAN AS $$
BEGIN
  -- Admins have access to all clients
  IF is_admin() THEN
    RETURN TRUE;
  END IF;

  -- Check user-client assignment
  RETURN EXISTS (
    SELECT 1 FROM user_client_assignments
    WHERE user_id = auth.uid()
    AND client_id = target_client_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user can edit a client (editor or admin role)
CREATE OR REPLACE FUNCTION can_edit_client(target_client_id VARCHAR(20))
RETURNS BOOLEAN AS $$
BEGIN
  -- Global admins can edit all
  IF is_admin() THEN
    RETURN TRUE;
  END IF;

  -- Check user-client assignment with editor or admin role
  RETURN EXISTS (
    SELECT 1 FROM user_client_assignments
    WHERE user_id = auth.uid()
    AND client_id = target_client_id
    AND role IN ('editor', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- RLS: USER_PROFILES
-- ============================================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY user_profiles_select_own ON user_profiles
  FOR SELECT USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY user_profiles_select_admin ON user_profiles
  FOR SELECT USING (is_admin());

-- Users can update their own profile (except is_admin flag)
CREATE POLICY user_profiles_update_own ON user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND is_admin = (SELECT up.is_admin FROM user_profiles up WHERE up.id = auth.uid())
  );

-- Admins can update any profile
CREATE POLICY user_profiles_update_admin ON user_profiles
  FOR UPDATE USING (is_admin());

-- Auto-insert is allowed (for trigger) or admin insert
CREATE POLICY user_profiles_insert ON user_profiles
  FOR INSERT WITH CHECK (is_admin() OR id = auth.uid());

-- ============================================================================
-- RLS: USER_CLIENT_ASSIGNMENTS
-- ============================================================================
ALTER TABLE user_client_assignments ENABLE ROW LEVEL SECURITY;

-- Users can see their own assignments
CREATE POLICY assignments_select_own ON user_client_assignments
  FOR SELECT USING (user_id = auth.uid());

-- Admins can see all assignments
CREATE POLICY assignments_select_admin ON user_client_assignments
  FOR SELECT USING (is_admin());

-- Only global admins can insert/update/delete assignments
CREATE POLICY assignments_insert_admin ON user_client_assignments
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY assignments_update_admin ON user_client_assignments
  FOR UPDATE USING (is_admin());

CREATE POLICY assignments_delete_admin ON user_client_assignments
  FOR DELETE USING (is_admin());

-- ============================================================================
-- RLS: CLIENTS
-- ============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Users can view clients they are assigned to
CREATE POLICY clients_select ON clients
  FOR SELECT USING (has_client_access(id));

-- Only users with edit access can update
CREATE POLICY clients_update ON clients
  FOR UPDATE USING (can_edit_client(id));

-- Only global admins can create clients
CREATE POLICY clients_insert ON clients
  FOR INSERT WITH CHECK (is_admin());

-- Only global admins can delete clients
CREATE POLICY clients_delete ON clients
  FOR DELETE USING (is_admin());

-- ============================================================================
-- RLS: DATA_SOURCES
-- ============================================================================
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_sources_select ON data_sources
  FOR SELECT USING (has_client_access(client_id));

CREATE POLICY data_sources_insert ON data_sources
  FOR INSERT WITH CHECK (can_edit_client(client_id));

CREATE POLICY data_sources_update ON data_sources
  FOR UPDATE USING (can_edit_client(client_id));

CREATE POLICY data_sources_delete ON data_sources
  FOR DELETE USING (can_edit_client(client_id));

-- ============================================================================
-- RLS: DATA_WAREHOUSES
-- ============================================================================
ALTER TABLE data_warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_warehouses_select ON data_warehouses
  FOR SELECT USING (has_client_access(client_id));

CREATE POLICY data_warehouses_insert ON data_warehouses
  FOR INSERT WITH CHECK (can_edit_client(client_id));

CREATE POLICY data_warehouses_update ON data_warehouses
  FOR UPDATE USING (can_edit_client(client_id));

CREATE POLICY data_warehouses_delete ON data_warehouses
  FOR DELETE USING (can_edit_client(client_id));

-- ============================================================================
-- RLS: ETL_PROCESSES
-- ============================================================================
ALTER TABLE etl_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY etl_processes_select ON etl_processes
  FOR SELECT USING (has_client_access(client_id));

CREATE POLICY etl_processes_insert ON etl_processes
  FOR INSERT WITH CHECK (can_edit_client(client_id));

CREATE POLICY etl_processes_update ON etl_processes
  FOR UPDATE USING (can_edit_client(client_id));

CREATE POLICY etl_processes_delete ON etl_processes
  FOR DELETE USING (can_edit_client(client_id));

-- ============================================================================
-- RLS: KPIS
-- ============================================================================
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY kpis_select ON kpis
  FOR SELECT USING (has_client_access(client_id));

CREATE POLICY kpis_insert ON kpis
  FOR INSERT WITH CHECK (can_edit_client(client_id));

CREATE POLICY kpis_update ON kpis
  FOR UPDATE USING (can_edit_client(client_id));

CREATE POLICY kpis_delete ON kpis
  FOR DELETE USING (can_edit_client(client_id));

-- ============================================================================
-- RLS: REPORTS
-- ============================================================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY reports_select ON reports
  FOR SELECT USING (has_client_access(client_id));

CREATE POLICY reports_insert ON reports
  FOR INSERT WITH CHECK (can_edit_client(client_id));

CREATE POLICY reports_update ON reports
  FOR UPDATE USING (can_edit_client(client_id));

CREATE POLICY reports_delete ON reports
  FOR DELETE USING (can_edit_client(client_id));

-- ============================================================================
-- RLS: DATA_LINEAGE
-- ============================================================================
ALTER TABLE data_lineage ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_lineage_select ON data_lineage
  FOR SELECT USING (has_client_access(client_id));

CREATE POLICY data_lineage_insert ON data_lineage
  FOR INSERT WITH CHECK (can_edit_client(client_id));

CREATE POLICY data_lineage_update ON data_lineage
  FOR UPDATE USING (can_edit_client(client_id));

CREATE POLICY data_lineage_delete ON data_lineage
  FOR DELETE USING (can_edit_client(client_id));

-- ============================================================================
-- RLS: DOCUMENTATION_NOTES
-- Notes can be global (client_id NULL) or client-specific
-- ============================================================================
ALTER TABLE documentation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY documentation_notes_select ON documentation_notes
  FOR SELECT USING (client_id IS NULL OR has_client_access(client_id));

CREATE POLICY documentation_notes_insert ON documentation_notes
  FOR INSERT WITH CHECK (
    (client_id IS NULL AND is_admin())
    OR (client_id IS NOT NULL AND can_edit_client(client_id))
  );

CREATE POLICY documentation_notes_update ON documentation_notes
  FOR UPDATE USING (
    (client_id IS NULL AND is_admin())
    OR (client_id IS NOT NULL AND can_edit_client(client_id))
  );

CREATE POLICY documentation_notes_delete ON documentation_notes
  FOR DELETE USING (
    (client_id IS NULL AND is_admin())
    OR (client_id IS NOT NULL AND can_edit_client(client_id))
  );

-- ============================================================================
-- RLS: PLATFORM_UPLOADS
-- ============================================================================
ALTER TABLE platform_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_uploads_select ON platform_uploads
  FOR SELECT USING (has_client_access(client_id));

CREATE POLICY platform_uploads_insert ON platform_uploads
  FOR INSERT WITH CHECK (can_edit_client(client_id));

CREATE POLICY platform_uploads_update ON platform_uploads
  FOR UPDATE USING (can_edit_client(client_id));

CREATE POLICY platform_uploads_delete ON platform_uploads
  FOR DELETE USING (can_edit_client(client_id));

-- ============================================================================
-- RLS: PLATFORM_DATA
-- ============================================================================
ALTER TABLE platform_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_data_select ON platform_data
  FOR SELECT USING (has_client_access(client_id));

CREATE POLICY platform_data_insert ON platform_data
  FOR INSERT WITH CHECK (can_edit_client(client_id));

CREATE POLICY platform_data_update ON platform_data
  FOR UPDATE USING (can_edit_client(client_id));

CREATE POLICY platform_data_delete ON platform_data
  FOR DELETE USING (can_edit_client(client_id));

-- ============================================================================
-- RLS: BLENDED_DATA
-- ============================================================================
ALTER TABLE blended_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY blended_data_select ON blended_data
  FOR SELECT USING (has_client_access(client_id));

CREATE POLICY blended_data_insert ON blended_data
  FOR INSERT WITH CHECK (can_edit_client(client_id));

CREATE POLICY blended_data_update ON blended_data
  FOR UPDATE USING (can_edit_client(client_id));

CREATE POLICY blended_data_delete ON blended_data
  FOR DELETE USING (can_edit_client(client_id));

-- ============================================================================
-- RLS: PLATFORM_MAPPINGS
-- ============================================================================
ALTER TABLE platform_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_mappings_select ON platform_mappings
  FOR SELECT USING (has_client_access(client_id));

CREATE POLICY platform_mappings_insert ON platform_mappings
  FOR INSERT WITH CHECK (can_edit_client(client_id));

CREATE POLICY platform_mappings_update ON platform_mappings
  FOR UPDATE USING (can_edit_client(client_id));

CREATE POLICY platform_mappings_delete ON platform_mappings
  FOR DELETE USING (can_edit_client(client_id));

-- ============================================================================
-- RLS: KPI_ALERTS (via KPI's client_id)
-- ============================================================================
ALTER TABLE kpi_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY kpi_alerts_select ON kpi_alerts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM kpis k WHERE k.id = kpi_id AND has_client_access(k.client_id)
  ));

CREATE POLICY kpi_alerts_insert ON kpi_alerts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM kpis k WHERE k.id = kpi_id AND can_edit_client(k.client_id)
  ));

CREATE POLICY kpi_alerts_update ON kpi_alerts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM kpis k WHERE k.id = kpi_id AND can_edit_client(k.client_id)
  ));

CREATE POLICY kpi_alerts_delete ON kpi_alerts
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM kpis k WHERE k.id = kpi_id AND can_edit_client(k.client_id)
  ));

-- ============================================================================
-- RLS: ALERT_HISTORY (via KPI's client_id)
-- ============================================================================
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY alert_history_select ON alert_history
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM kpis k WHERE k.id = kpi_id AND has_client_access(k.client_id)
  ));

-- Alert history is system-generated, no user insert/update/delete

-- ============================================================================
-- RLS: REPORT_ALERTS (via report's client_id)
-- ============================================================================
ALTER TABLE report_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_alerts_select ON report_alerts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM reports r WHERE r.id = report_id AND has_client_access(r.client_id)
  ));

CREATE POLICY report_alerts_insert ON report_alerts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM reports r WHERE r.id = report_id AND can_edit_client(r.client_id)
  ));

CREATE POLICY report_alerts_update ON report_alerts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM reports r WHERE r.id = report_id AND can_edit_client(r.client_id)
  ));

CREATE POLICY report_alerts_delete ON report_alerts
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM reports r WHERE r.id = report_id AND can_edit_client(r.client_id)
  ));

-- ============================================================================
-- RLS: REPORT_ALERT_HISTORY (via report's client_id)
-- ============================================================================
ALTER TABLE report_alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_alert_history_select ON report_alert_history
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM reports r WHERE r.id = report_id AND has_client_access(r.client_id)
  ));

-- Alert history is system-generated, no user insert/update/delete

-- ============================================================================
-- RLS: REPORT_DELIVERY_HISTORY (via report's client_id)
-- ============================================================================
ALTER TABLE report_delivery_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_delivery_history_select ON report_delivery_history
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM reports r WHERE r.id = report_id AND has_client_access(r.client_id)
  ));

-- Delivery history is system-generated, no user insert/update/delete

-- ============================================================================
-- RLS: SETTINGS (admin only for modify, all can read)
-- ============================================================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY settings_select ON settings
  FOR SELECT USING (TRUE);  -- All authenticated users can read

CREATE POLICY settings_insert_admin ON settings
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY settings_update_admin ON settings
  FOR UPDATE USING (is_admin());

CREATE POLICY settings_delete_admin ON settings
  FOR DELETE USING (is_admin());

-- ============================================================================
-- RLS: SMTP_CONFIG (admin only)
-- ============================================================================
ALTER TABLE smtp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY smtp_config_select_admin ON smtp_config
  FOR SELECT USING (is_admin());

CREATE POLICY smtp_config_insert_admin ON smtp_config
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY smtp_config_update_admin ON smtp_config
  FOR UPDATE USING (is_admin());

CREATE POLICY smtp_config_delete_admin ON smtp_config
  FOR DELETE USING (is_admin());

-- ============================================================================
-- RLS: SCHEDULED_JOBS (admin only - system table)
-- ============================================================================
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY scheduled_jobs_select_admin ON scheduled_jobs
  FOR SELECT USING (is_admin());

CREATE POLICY scheduled_jobs_insert_admin ON scheduled_jobs
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY scheduled_jobs_update_admin ON scheduled_jobs
  FOR UPDATE USING (is_admin());

CREATE POLICY scheduled_jobs_delete_admin ON scheduled_jobs
  FOR DELETE USING (is_admin());

-- ============================================================================
-- SEED FIRST ADMIN USER (Run manually after first user signs up)
-- ============================================================================
-- After creating the first user via Supabase Studio or CLI:
--
-- UPDATE user_profiles
-- SET is_admin = TRUE
-- WHERE email = 'admin@yourdomain.com';
--
-- Also set user metadata in auth.users:
--
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{is_admin}',
--   'true'
-- )
-- WHERE email = 'admin@yourdomain.com';
