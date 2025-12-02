# Supabase Best Practices

Production-ready patterns, performance optimization, and security guidelines.

## Production Checklist

### Security

- [ ] **Enable RLS on all tables** - No exceptions
- [ ] **Review all RLS policies** - Test with different user roles
- [ ] **Enable email confirmations** - Verify user emails
- [ ] **Use strong password requirements** - Minimum 8 chars, complexity
- [ ] **Enable MFA** - For admin accounts at minimum
- [ ] **Rotate API keys periodically** - Especially after incidents
- [ ] **Never expose service_role key** - Server-side only
- [ ] **Set secure CORS origins** - No wildcards in production
- [ ] **Enable SSL enforcement** - Database connections

### Performance

- [ ] **Add indexes for foreign keys** - Required for JOINs
- [ ] **Add indexes for RLS columns** - Critical for policy performance
- [ ] **Enable connection pooling** - For serverless/high-traffic
- [ ] **Set appropriate max_rows** - Prevent runaway queries
- [ ] **Use `count(*, count: 'exact')` sparingly** - Expensive operation
- [ ] **Implement pagination** - Never fetch unbounded data
- [ ] **Cache auth.uid() in policies** - Use `(SELECT auth.uid())`

### Reliability

- [ ] **Enable Point-in-Time Recovery** - For production databases
- [ ] **Set up monitoring/alerts** - Database health
- [ ] **Test disaster recovery** - Verify backup restoration
- [ ] **Document RTO/RPO requirements** - Recovery objectives
- [ ] **Enable read replicas** - For high-read workloads

### Operations

- [ ] **Use staging environment** - Test migrations first
- [ ] **Automate deployments** - CI/CD for migrations
- [ ] **Track migration history** - Version control everything
- [ ] **Set up log aggregation** - Centralized logging
- [ ] **Monitor query performance** - Identify slow queries

## Database Design

### Primary Keys

Always use UUID:

```sql
-- Good: UUID primary keys
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

-- Avoid: Serial/auto-increment
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,  -- Predictable, enumerable
  ...
);
```

**Why UUID?**
- Non-enumerable (security)
- Client-side generation possible
- No sequence conflicts
- Better for distributed systems

### Standard Columns

Include on every table:

```sql
CREATE TABLE example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... your columns ...
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON example
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Foreign Keys

Always define with explicit ON DELETE:

```sql
-- Cascade: delete children when parent deleted
client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE

-- Set null: preserve children, clear reference
manager_id UUID REFERENCES users(id) ON DELETE SET NULL

-- Restrict: prevent deletion if children exist
category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT
```

**Decision guide:**
| Relationship | ON DELETE |
|--------------|-----------|
| Owned by parent (sources belong to client) | CASCADE |
| Optional reference (assigned manager) | SET NULL |
| Required reference (category) | RESTRICT |

### Indexes

```sql
-- 1. Foreign key indexes (always)
CREATE INDEX idx_sources_client_id ON data_sources(client_id);

-- 2. RLS policy columns (critical)
CREATE INDEX idx_assignments_user_id ON user_client_assignments(user_id);

-- 3. Frequently filtered columns
CREATE INDEX idx_clients_status ON clients(status);

-- 4. Composite for multi-column queries
CREATE INDEX idx_reports_client_status ON reports(client_id, status);

-- 5. Partial for filtered subsets
CREATE INDEX idx_clients_active ON clients(id)
  WHERE status = 'active';
```

### JSONB Usage

Good for flexible/sparse data, not for frequently queried fields:

```sql
-- Good: optional metadata
metadata JSONB DEFAULT '{}'::jsonb

-- Bad: core business data
config JSONB  -- If you query config.name often, make it a column

-- Indexing JSONB
CREATE INDEX idx_config_type ON reports USING gin(config);
CREATE INDEX idx_config_name ON reports ((config->>'name'));
```

## Query Patterns

### Efficient Selects

```javascript
// Good: select specific columns
const { data } = await supabase
  .from('clients')
  .select('id, name, status')
  .eq('status', 'active');

// Avoid: select all columns
const { data } = await supabase
  .from('clients')
  .select('*');  // Fetches everything

// Good: limit results
const { data } = await supabase
  .from('clients')
  .select('id, name')
  .limit(100);
```

### Pagination

```javascript
// Cursor-based (preferred for large datasets)
const { data } = await supabase
  .from('clients')
  .select('id, name, created_at')
  .order('created_at', { ascending: false })
  .lt('created_at', lastItemCreatedAt)  // Cursor
  .limit(20);

// Offset-based (simpler, slower for deep pages)
const { data } = await supabase
  .from('clients')
  .select('id, name')
  .range(page * pageSize, (page + 1) * pageSize - 1);
```

### Counting

```javascript
// Fast: estimated count (good for UI)
const { count } = await supabase
  .from('clients')
  .select('*', { count: 'estimated', head: true });

// Slow: exact count (avoid for large tables)
const { count } = await supabase
  .from('clients')
  .select('*', { count: 'exact', head: true });
```

### Joins

```javascript
// Good: specific nested columns
const { data } = await supabase
  .from('reports')
  .select(`
    id,
    name,
    client:clients(id, name),
    warehouse:data_warehouses(id, name)
  `);

// Avoid: nested select all
const { data } = await supabase
  .from('reports')
  .select(`*, clients(*), data_warehouses(*)`);
```

## RLS Performance

### Critical: Cache Function Calls

```sql
-- SLOW: auth.uid() called per row
CREATE POLICY "bad" ON clients
  FOR SELECT USING (user_id = auth.uid());

-- FAST: Cached for entire query
CREATE POLICY "good" ON clients
  FOR SELECT USING (user_id = (SELECT auth.uid()));
```

### Use Security Definer Functions

```sql
-- Complex check as reusable function
CREATE OR REPLACE FUNCTION has_client_access(check_client_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_client_assignments
    WHERE user_id = auth.uid()
      AND client_id = check_client_id
  );
END;
$$;

-- Simple policy
CREATE POLICY "access" ON reports
  FOR SELECT USING (has_client_access(client_id));
```

### Index RLS Columns

```sql
-- Critical indexes for RLS
CREATE INDEX idx_assignments_user ON user_client_assignments(user_id);
CREATE INDEX idx_assignments_client ON user_client_assignments(client_id);
CREATE INDEX idx_assignments_both ON user_client_assignments(user_id, client_id);
```

## Migration Best Practices

### Safe Migrations

```sql
-- 1. Always use IF NOT EXISTS / IF EXISTS
CREATE TABLE IF NOT EXISTS new_table (...);
DROP TABLE IF EXISTS old_table;
CREATE INDEX IF NOT EXISTS idx_name ON table(...);

-- 2. Add columns as nullable first
ALTER TABLE clients ADD COLUMN new_field TEXT;
-- Later: UPDATE clients SET new_field = 'default' WHERE new_field IS NULL;
-- Later: ALTER TABLE clients ALTER COLUMN new_field SET NOT NULL;

-- 3. Create indexes CONCURRENTLY in production
CREATE INDEX CONCURRENTLY idx_large_table_col ON large_table(col);
```

### Testing Migrations

```bash
# 1. Reset local database
supabase db reset

# 2. Verify in Studio
open http://localhost:54323

# 3. Preview remote changes
supabase db push --dry-run

# 4. Apply to remote
supabase db push
```

### Rollback Strategy

```sql
-- Always plan rollback in comments
-- Migration: 20240115_add_feature.sql

-- UP
ALTER TABLE clients ADD COLUMN feature_flag BOOLEAN DEFAULT false;
CREATE INDEX idx_clients_feature ON clients(feature_flag);

-- ROLLBACK (keep in comments or separate file)
-- DROP INDEX IF EXISTS idx_clients_feature;
-- ALTER TABLE clients DROP COLUMN IF EXISTS feature_flag;
```

## Connection Pooling

### When to Enable

- Serverless functions (Edge Functions, Lambda)
- High connection count (>100 concurrent)
- Connection-limited database plans

### Configuration

```toml
# supabase/config.toml
[db.pooler]
enabled = true
port = 54329
pool_mode = "transaction"  # Best for most apps
default_pool_size = 20
max_client_conn = 100
```

### Pool Modes

| Mode | Use Case | Gotchas |
|------|----------|---------|
| `transaction` | Most web apps | No prepared statements across transactions |
| `session` | Long-lived connections | No connection reuse |
| `statement` | Simple queries | No transactions |

## Error Handling

### Supabase Error Codes

```javascript
const SUPABASE_ERRORS = {
  // PostgREST
  'PGRST116': 'No rows found',
  'PGRST204': 'No Content',

  // PostgreSQL
  '23505': 'Unique constraint violation',
  '23503': 'Foreign key violation',
  '23502': 'Not null violation',
  '42501': 'Insufficient privilege (RLS)',
  '42P01': 'Undefined table',
  '42703': 'Undefined column',

  // Auth
  'invalid_credentials': 'Invalid email or password',
  'email_not_confirmed': 'Email not confirmed',
  'user_already_exists': 'User already exists',
};
```

### Error Handling Pattern

```javascript
async function getClient(id) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;  // Not found
    }
    if (error.code === '42501') {
      throw new AppError('Access denied', 403);
    }
    throw error;  // Unexpected error
  }

  return data;
}
```

## Realtime Best Practices

### Subscribe Efficiently

```javascript
// Good: specific table + filter
const channel = supabase
  .channel('client-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'clients',
    filter: 'status=eq.active'
  }, handleChange)
  .subscribe();

// Avoid: broad subscriptions
const channel = supabase
  .channel('all-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: '*'  // All tables
  }, handleChange)
  .subscribe();
```

### Clean Up Subscriptions

```javascript
// React useEffect pattern
useEffect(() => {
  const channel = supabase.channel('my-channel')
    .on('postgres_changes', {...}, handler)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Storage Best Practices

### Bucket Configuration

```sql
-- Public bucket (no auth required)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Private bucket (requires auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);
```

### RLS for Storage

```sql
-- Allow users to upload to their folder
CREATE POLICY "Users upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read their files
CREATE POLICY "Users read own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### File Organization

```
bucket/
├── {user_id}/           # User-scoped files
│   ├── documents/
│   └── images/
├── public/              # Shared resources
└── {client_id}/         # Client-scoped files
    └── reports/
```

## Edge Functions

### Structure

```typescript
// supabase/functions/my-function/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Your logic here
    const result = { message: 'Success', userId: user.id };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

### Secrets Management

```bash
# Set secrets
supabase secrets set MY_API_KEY=secret_value

# Use in function
const apiKey = Deno.env.get('MY_API_KEY');
```

## Monitoring

### Query Performance

```sql
-- Find slow queries
SELECT
  query,
  calls,
  mean_time,
  total_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

### Index Usage

```sql
-- Unused indexes (candidates for removal)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY tablename;

-- Index efficiency
SELECT
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Table Bloat

```sql
-- Check table bloat
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

## Common Pitfalls

### 1. Missing RLS

```sql
-- Always enable after CREATE TABLE
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
```

### 2. Exposing Service Role Key

```javascript
// NEVER in client code
const supabase = createClient(url, process.env.SERVICE_ROLE_KEY);  // BAD

// Only on server
const supabaseAdmin = createClient(url, process.env.SERVICE_ROLE_KEY);  // OK
```

### 3. Unbounded Queries

```javascript
// Always limit
const { data } = await supabase
  .from('large_table')
  .select('*')
  .limit(100);  // REQUIRED
```

### 4. N+1 Queries

```javascript
// Bad: N+1
for (const client of clients) {
  const sources = await getSources(client.id);  // N queries
}

// Good: single query with join
const { data } = await supabase
  .from('clients')
  .select('*, data_sources(*)');
```

### 5. Missing Indexes on Foreign Keys

```sql
-- Always index foreign keys
CREATE INDEX idx_table_fk ON table(foreign_key_id);
```

### 6. Not Testing RLS

```bash
# Test RLS locally
supabase db reset  # Apply all migrations
# Log in as different users in Studio
# Verify policies work correctly
```
