# Naming Conventions

PostgreSQL and Supabase naming conventions for tables, columns, indexes, constraints, and migrations.

## Golden Rules

1. **Use lowercase with underscores** (snake_case)
2. **Never use spaces** in identifiers
3. **Avoid reserved keywords** (user, table, order, etc.)
4. **Be consistent** across the entire schema
5. **Be descriptive** but concise

## Tables

### Format

```
<plural_noun>
<plural_noun>_<qualifier>
```

### Rules

| Rule | Good | Bad |
|------|------|-----|
| Lowercase | `clients` | `Clients`, `CLIENTS` |
| Underscores | `data_sources` | `dataSources`, `data-sources` |
| Plural | `users` | `user` |
| Descriptive | `platform_uploads` | `uploads`, `pu` |
| No prefixes | `clients` | `tbl_clients`, `t_clients` |

### Examples

```sql
-- Good
CREATE TABLE clients (...);
CREATE TABLE data_sources (...);
CREATE TABLE etl_processes (...);
CREATE TABLE report_delivery_history (...);
CREATE TABLE user_client_assignments (...);

-- Bad
CREATE TABLE Client (...);           -- PascalCase
CREATE TABLE data-sources (...);     -- hyphen
CREATE TABLE tblClients (...);       -- prefix + camelCase
CREATE TABLE client (...);           -- singular
```

### Junction Tables

For many-to-many relationships, use both table names in alphabetical order:

```sql
-- Good
CREATE TABLE user_client_assignments (
  user_id UUID REFERENCES users(id),
  client_id UUID REFERENCES clients(id),
  role TEXT,
  PRIMARY KEY (user_id, client_id)
);

-- Also acceptable
CREATE TABLE client_users (...);
```

## Columns

### Format

```
<noun>
<noun>_<qualifier>
<related_table>_id  -- for foreign keys
```

### Rules

| Rule | Good | Bad |
|------|------|-----|
| Lowercase snake_case | `client_id` | `clientId`, `ClientID` |
| No table prefix | `name` | `client_name` (in clients table) |
| Explicit _id suffix | `client_id` | `client`, `clientID` |
| Boolean is_/has_ prefix | `is_active` | `active`, `isActive` |

### Common Column Names

```sql
-- Primary key
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- Foreign keys
client_id UUID NOT NULL REFERENCES clients(id)
user_id UUID REFERENCES auth.users(id)
parent_id UUID REFERENCES same_table(id)

-- Timestamps
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
deleted_at TIMESTAMPTZ  -- soft delete
published_at TIMESTAMPTZ
expires_at TIMESTAMPTZ

-- Status/state
status TEXT DEFAULT 'active'
state TEXT DEFAULT 'pending'
is_active BOOLEAN DEFAULT true
is_deleted BOOLEAN DEFAULT false
is_published BOOLEAN DEFAULT false
has_attachments BOOLEAN DEFAULT false

-- Counts (denormalized)
view_count INTEGER DEFAULT 0
like_count INTEGER DEFAULT 0
comment_count INTEGER DEFAULT 0

-- Metadata
name TEXT NOT NULL
title TEXT
description TEXT
slug TEXT UNIQUE
config JSONB DEFAULT '{}'::jsonb
metadata JSONB DEFAULT '{}'::jsonb
```

### Foreign Key Columns

Always use `<table_singular>_id`:

```sql
-- Good
client_id UUID REFERENCES clients(id)
user_id UUID REFERENCES users(id)
warehouse_id UUID REFERENCES data_warehouses(id)
parent_category_id UUID REFERENCES categories(id)

-- Bad
client UUID REFERENCES clients(id)      -- no _id suffix
clients_id UUID REFERENCES clients(id)  -- plural
fk_client UUID REFERENCES clients(id)   -- prefix
```

### Boolean Columns

Prefix with `is_` or `has_`:

```sql
-- Good
is_active BOOLEAN DEFAULT true
is_published BOOLEAN DEFAULT false
is_verified BOOLEAN DEFAULT false
has_children BOOLEAN DEFAULT false
has_attachments BOOLEAN DEFAULT false
can_edit BOOLEAN DEFAULT true

-- Bad
active BOOLEAN      -- ambiguous
published BOOLEAN   -- ambiguous
verified BOOLEAN    -- ambiguous
```

### Timestamp Columns

Suffix with `_at`:

```sql
-- Good
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
published_at TIMESTAMPTZ
scheduled_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
expires_at TIMESTAMPTZ

-- Bad
created TIMESTAMPTZ       -- no _at suffix
creation_date TIMESTAMPTZ -- inconsistent naming
date_created TIMESTAMPTZ  -- reversed order
```

### Date Columns

Suffix with `_date` or `_on`:

```sql
-- Good
birth_date DATE
start_date DATE
end_date DATE
published_on DATE

-- Also acceptable
due_date DATE
hire_date DATE
```

## Indexes

### Format

```
idx_<table>_<column>
idx_<table>_<column1>_<column2>
```

### Examples

```sql
-- Single column
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_data_sources_client_id ON data_sources(client_id);

-- Composite
CREATE INDEX idx_reports_client_status ON reports(client_id, status);

-- Unique
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Partial
CREATE INDEX idx_clients_active ON clients(id) WHERE status = 'active';

-- Expression
CREATE INDEX idx_clients_name_lower ON clients(LOWER(name));
```

### Special Index Types

```sql
-- GIN for JSONB
CREATE INDEX idx_reports_config ON reports USING gin(config);

-- GiST for full-text search
CREATE INDEX idx_clients_name_search ON clients USING gist(name gist_trgm_ops);
```

## Constraints

### Primary Keys

```sql
-- Explicit (preferred for clarity)
CONSTRAINT pk_clients PRIMARY KEY (id)

-- Or inline (simpler)
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### Foreign Keys

```sql
-- Format: fk_<table>_<referenced_table>
CONSTRAINT fk_sources_clients
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE

-- Or inline
client_id UUID REFERENCES clients(id) ON DELETE CASCADE
```

### Unique Constraints

```sql
-- Format: uq_<table>_<column>
CONSTRAINT uq_users_email UNIQUE (email)
CONSTRAINT uq_clients_slug UNIQUE (slug)

-- Composite unique
CONSTRAINT uq_assignments_user_client UNIQUE (user_id, client_id)
```

### Check Constraints

```sql
-- Format: chk_<table>_<description>
CONSTRAINT chk_clients_status
  CHECK (status IN ('active', 'inactive', 'onboarding'))

CONSTRAINT chk_reports_format
  CHECK (format IN ('pdf', 'csv', 'excel'))

CONSTRAINT chk_prices_positive
  CHECK (price >= 0)
```

## Functions

### Format

```sql
<verb>_<noun>
<verb>_<noun>_<qualifier>
```

### Examples

```sql
-- Good
CREATE FUNCTION get_client_stats(client_id UUID)
CREATE FUNCTION calculate_monthly_spend(...)
CREATE FUNCTION update_last_activity(...)
CREATE FUNCTION notify_on_insert()

-- Trigger functions
CREATE FUNCTION set_updated_at()
CREATE FUNCTION handle_new_user()
CREATE FUNCTION sync_metadata()
```

## Triggers

### Format

```sql
tr_<table>_<timing>_<event>
tr_<table>_<action>
```

### Examples

```sql
-- Good
CREATE TRIGGER tr_clients_before_update
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tr_users_after_insert
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Simplified naming
CREATE TRIGGER tr_clients_set_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

## RLS Policies

### Format

```sql
<action>_<table>_<description>
```

### Examples

```sql
-- Good
CREATE POLICY select_own_data ON clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY insert_authenticated ON reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY update_own_clients ON clients
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY admin_full_access ON clients
  FOR ALL USING (is_admin(auth.uid()));

-- Descriptive (Supabase style)
CREATE POLICY "Users can view their own data" ON clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins have full access" ON clients
  FOR ALL USING (is_admin(auth.uid()));
```

## Migration Files

### Format

```
<timestamp>_<action>_<object>.sql
```

### Timestamp

Supabase generates: `YYYYMMDDHHMMSS`

```
20240115120000_create_clients_table.sql
20240115120100_add_status_to_clients.sql
```

### Naming Patterns

| Action | Pattern | Example |
|--------|---------|---------|
| Create table | `create_<table>_table` | `create_clients_table.sql` |
| Add column | `add_<column>_to_<table>` | `add_status_to_clients.sql` |
| Remove column | `remove_<column>_from_<table>` | `remove_legacy_from_users.sql` |
| Create index | `create_<table>_<column>_index` | `create_clients_status_index.sql` |
| Add constraint | `add_<constraint>_to_<table>` | `add_email_unique_to_users.sql` |
| Add RLS | `add_rls_to_<table>` | `add_rls_to_clients.sql` |
| Add function | `create_<function>_function` | `create_get_stats_function.sql` |
| Add trigger | `add_<trigger>_trigger` | `add_updated_at_trigger.sql` |
| Seed data | `seed_<table>` | `seed_platforms.sql` |
| Alter table | `alter_<table>_<change>` | `alter_clients_add_metadata.sql` |

## Enums and Types

### Format

```sql
<noun>_type
<noun>_status
```

### Examples

```sql
-- Good
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'onboarding');
CREATE TYPE delivery_format AS ENUM ('pdf', 'csv', 'excel');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

-- Values are lowercase
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
```

## Schemas

### Format

```sql
<purpose>
<domain>
```

### Common Schemas

```sql
-- Supabase built-in
auth        -- Authentication (managed by Supabase)
storage     -- File storage (managed by Supabase)
public      -- Application tables (default)

-- Custom
analytics   -- Analytics/reporting tables
archive     -- Archived data
audit       -- Audit logs
staging     -- ETL staging tables
```

## Reserved Words to Avoid

Never use these as identifiers (or quote them):

```
user, users (use auth.users or app_users)
order, orders
table
column
index
key
check
primary
foreign
references
group
select
insert
update
delete
create
drop
alter
```

If you must use them, quote:

```sql
-- Works but not recommended
CREATE TABLE "order" (...);
SELECT "user" FROM ...;

-- Better: use prefix/suffix
CREATE TABLE customer_orders (...);
CREATE TABLE app_users (...);
```

## This Project's Conventions

Based on existing tables in Data Hub:

| Table | Purpose |
|-------|---------|
| `clients` | Client records |
| `data_sources` | Platform connections |
| `data_warehouses` | Client warehouses |
| `etl_processes` | Pipeline documentation |
| `kpis` | Key performance indicators |
| `reports` | Dashboard/report registry |
| `data_lineage` | Lineage connections |
| `platform_uploads` | File upload tracking |
| `platform_data` | Raw uploaded data |
| `blended_data` | Harmonized data |
| `smtp_config` | SMTP configuration |
| `report_alerts` | Alert definitions |
| `report_alert_history` | Alert triggers |
| `report_delivery_history` | Send history |
| `scheduled_jobs` | Cron job registry |
| `user_profiles` | User metadata |
| `user_client_assignments` | User access |

All follow: lowercase, underscores, plural, descriptive.
