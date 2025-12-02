# Row Level Security (RLS)

Comprehensive guide to implementing Row Level Security in Supabase/PostgreSQL.

## Overview

RLS enables fine-grained access control at the database level. Every query is automatically filtered based on policies you define.

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT REQUEST                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE AUTH                          │
│                 (extracts JWT)                          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   PostgreSQL                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │                 RLS POLICY                        │  │
│  │   "Is this user allowed to see/modify this row?"  │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                │
│        ┌───────────────┼───────────────┐               │
│        ▼               ▼               ▼               │
│    ✓ ALLOW        ✗ DENY         ✓ ALLOW              │
│    (row 1)        (row 2)        (row 3)              │
└─────────────────────────────────────────────────────────┘
```

## Enabling RLS

```sql
-- Enable RLS on a table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (optional, recommended in production)
ALTER TABLE clients FORCE ROW LEVEL SECURITY;
```

**Important:** Without policies, RLS-enabled tables deny ALL access by default.

## Policy Syntax

```sql
CREATE POLICY "policy_name" ON table_name
  [AS { PERMISSIVE | RESTRICTIVE }]
  [FOR { ALL | SELECT | INSERT | UPDATE | DELETE }]
  [TO { role_name | PUBLIC | CURRENT_USER | SESSION_USER }]
  USING (expression)           -- for SELECT, UPDATE, DELETE
  [WITH CHECK (expression)];   -- for INSERT, UPDATE
```

### Clause Breakdown

| Clause | Purpose | When Evaluated |
|--------|---------|----------------|
| `FOR` | Operation type | Policy selection |
| `TO` | Target role | Policy selection |
| `USING` | Row visibility | SELECT, UPDATE (old row), DELETE |
| `WITH CHECK` | Row validity | INSERT, UPDATE (new row) |

## Auth Helper Functions

Supabase provides these functions for use in policies:

### auth.uid()

Returns the current user's UUID.

```sql
-- Get current user ID
SELECT auth.uid();  -- e.g., 'a1b2c3d4-...'
```

### auth.jwt()

Returns the full JWT claims as JSON.

```sql
-- Get JWT claims
SELECT auth.jwt();
-- Returns: {"sub": "user-id", "role": "authenticated", "email": "...", ...}

-- Access specific claim
SELECT auth.jwt() ->> 'email';
SELECT auth.jwt() -> 'app_metadata' ->> 'role';
```

### auth.role()

Returns the current role.

```sql
SELECT auth.role();  -- 'anon', 'authenticated', or 'service_role'
```

## Common Policy Patterns

### 1. Users Can Access Their Own Data

```sql
-- Basic pattern
CREATE POLICY "Users access own data" ON user_profiles
  FOR ALL
  USING (id = auth.uid());

-- For tables with user_id column
CREATE POLICY "Users access own records" ON posts
  FOR ALL
  USING (user_id = auth.uid());
```

### 2. Public Read, Authenticated Write

```sql
-- Anyone can read
CREATE POLICY "Public read access" ON articles
  FOR SELECT
  TO PUBLIC
  USING (is_published = true);

-- Only authenticated users can create
CREATE POLICY "Authenticated create" ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
```

### 3. Hierarchical Access (Client-based)

```sql
-- Users can access clients they're assigned to
CREATE POLICY "Access assigned clients" ON clients
  FOR SELECT
  USING (
    id IN (
      SELECT client_id
      FROM user_client_assignments
      WHERE user_id = auth.uid()
    )
  );

-- Cascade to related tables
CREATE POLICY "Access client data" ON data_sources
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id
      FROM user_client_assignments
      WHERE user_id = auth.uid()
    )
  );
```

### 4. Role-Based Access

```sql
-- Check role from user_profiles
CREATE POLICY "Admin full access" ON clients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Check role from JWT metadata
CREATE POLICY "Managers can update" ON reports
  FOR UPDATE
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'manager'
  );
```

### 5. Permission Levels

```sql
-- Viewer: read-only
CREATE POLICY "Viewers can read" ON reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_client_assignments uca
      WHERE uca.user_id = auth.uid()
        AND uca.client_id = reports.client_id
        AND uca.role IN ('viewer', 'editor', 'admin')
    )
  );

-- Editor: read + write
CREATE POLICY "Editors can update" ON reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_client_assignments uca
      WHERE uca.user_id = auth.uid()
        AND uca.client_id = reports.client_id
        AND uca.role IN ('editor', 'admin')
    )
  );

-- Admin: full access
CREATE POLICY "Admins full access" ON reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_client_assignments uca
      WHERE uca.user_id = auth.uid()
        AND uca.client_id = reports.client_id
        AND uca.role = 'admin'
    )
  );
```

### 6. Time-Based Access

```sql
-- Only access active records
CREATE POLICY "Access active only" ON subscriptions
  FOR SELECT
  USING (
    expires_at IS NULL OR expires_at > NOW()
  );

-- Access within date range
CREATE POLICY "Access current period" ON reports
  FOR SELECT
  USING (
    start_date <= CURRENT_DATE
    AND end_date >= CURRENT_DATE
  );
```

### 7. Soft Delete Pattern

```sql
-- Hide deleted records
CREATE POLICY "Hide deleted" ON clients
  FOR SELECT
  USING (deleted_at IS NULL);

-- Only admins can see deleted
CREATE POLICY "Admins see all" ON clients
  FOR SELECT
  USING (
    deleted_at IS NULL
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

## Performance Optimization

### 1. Wrap Functions in SELECT (Critical!)

```sql
-- SLOW: function called per row
CREATE POLICY "bad_policy" ON clients
  FOR SELECT
  USING (user_id = auth.uid());

-- FAST: function cached for query
CREATE POLICY "good_policy" ON clients
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));
```

**Why?** Wrapping in `SELECT` allows PostgreSQL to cache the function result instead of calling it for every row.

### 2. Add Indexes

```sql
-- Index columns used in policies
CREATE INDEX idx_user_client_assignments_user
  ON user_client_assignments(user_id);

CREATE INDEX idx_user_client_assignments_client
  ON user_client_assignments(client_id);

CREATE INDEX idx_user_client_assignments_composite
  ON user_client_assignments(user_id, client_id);
```

### 3. Create Security Definer Functions

For complex checks, use a function with `SECURITY DEFINER`:

```sql
-- Function runs with owner privileges, bypasses RLS
CREATE OR REPLACE FUNCTION can_access_client(check_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_client_assignments
    WHERE user_id = auth.uid()
      AND client_id = check_client_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple policy using function
CREATE POLICY "access_clients" ON clients
  FOR SELECT
  USING (can_access_client(id));
```

### 4. Specify Target Roles

```sql
-- Good: specific role
CREATE POLICY "Authenticated access" ON clients
  FOR SELECT
  TO authenticated
  USING (...);

-- Less efficient: applies to all
CREATE POLICY "Generic access" ON clients
  FOR SELECT
  USING (...);
```

## Permissive vs Restrictive

### Permissive (Default)

Multiple PERMISSIVE policies OR together:

```sql
-- User can access if ANY policy passes
CREATE POLICY "Own data" ON documents
  FOR SELECT
  USING (owner_id = auth.uid());  -- OR

CREATE POLICY "Shared with me" ON documents
  FOR SELECT
  USING (
    id IN (SELECT document_id FROM shares WHERE user_id = auth.uid())
  );  -- OR

CREATE POLICY "Public docs" ON documents
  FOR SELECT
  USING (is_public = true);
```

### Restrictive

RESTRICTIVE policies AND together with PERMISSIVE:

```sql
-- Must pass BOTH policies
CREATE POLICY "Own data" ON documents
  AS PERMISSIVE FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Only active" ON documents
  AS RESTRICTIVE FOR SELECT
  USING (status = 'active');

-- Result: owner_id = auth.uid() AND status = 'active'
```

## Debugging Policies

### Check if RLS is Enabled

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### List Policies

```sql
SELECT
  policyname,
  tablename,
  cmd,
  qual,    -- USING clause
  with_check
FROM pg_policies
WHERE schemaname = 'public';
```

### Test as Different User

```sql
-- In Supabase Studio or psql
SET request.jwt.claim.sub = 'user-uuid-here';
SET request.jwt.claims = '{"role": "authenticated"}';

-- Then run query
SELECT * FROM clients;
```

### Explain Policy Execution

```sql
EXPLAIN (ANALYZE, VERBOSE)
SELECT * FROM clients;

-- Shows policy being applied
```

## Service Role Bypass

The `service_role` key bypasses RLS. Use for:
- Backend/server operations
- Admin tasks
- Migrations
- Seeding

```javascript
// Node.js backend - bypasses RLS
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// This query sees ALL rows
const { data } = await supabaseAdmin.from('clients').select('*');
```

**Warning:** Never expose service_role key to client-side code.

## Migration Patterns

### Enable RLS on New Table

```sql
-- supabase/migrations/20240115120000_create_clients_table.sql

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users access own clients" ON clients
  FOR ALL
  USING (user_id = (SELECT auth.uid()));
```

### Add RLS to Existing Table

```sql
-- supabase/migrations/20240115120100_add_rls_to_clients.sql

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users access own clients" ON clients
  FOR ALL
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins access all" ON clients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    )
  );
```

## Data Hub RLS Patterns

Example policies for this project:

```sql
-- Clients: access through assignments
CREATE POLICY "Access assigned clients" ON clients
  FOR SELECT
  USING (
    id IN (
      SELECT client_id
      FROM user_client_assignments
      WHERE user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    )
  );

-- Data Sources: inherit from client
CREATE POLICY "Access client sources" ON data_sources
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id
      FROM user_client_assignments
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Reports: access through client
CREATE POLICY "Access client reports" ON reports
  FOR ALL
  USING (
    client_id IN (
      SELECT client_id
      FROM user_client_assignments
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- User profiles: own profile only
CREATE POLICY "Users access own profile" ON user_profiles
  FOR SELECT
  USING (id = (SELECT auth.uid()));

-- Admins: full access helper
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Common Mistakes

### 1. Forgetting RLS on New Tables

```sql
-- Always add after CREATE TABLE
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
```

### 2. Not Using SELECT Wrapper

```sql
-- Bad: auth.uid() called per row
USING (user_id = auth.uid())

-- Good: cached
USING (user_id = (SELECT auth.uid()))
```

### 3. Missing Indexes

```sql
-- Always index columns used in policies
CREATE INDEX idx_table_user_id ON table(user_id);
```

### 4. Overly Complex Policies

```sql
-- Bad: complex logic in policy
CREATE POLICY "complex" ON data
  USING (
    (CASE
      WHEN ... THEN ...
      WHEN ... THEN ...
    END) = true
  );

-- Good: encapsulate in function
CREATE POLICY "simple" ON data
  USING (check_access(id));
```

### 5. No Service Role for Admin Operations

```javascript
// Bad: trying to use client key for admin ops
const { data } = await supabaseClient.from('all_users').select('*');

// Good: use service role on server
const { data } = await supabaseAdmin.from('all_users').select('*');
```
