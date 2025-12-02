# Supabase Migrations

## Location

Migrations live in `supabase/migrations/` directory.

## Naming Convention

```
YYYYMMDDHHMMSS_description.sql
```

Example:
```
20240115120000_create_clients_table.sql
20240115120100_add_status_to_clients.sql
```

## Creating Tables

```sql
-- Create table with standard columns
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for foreign key
CREATE INDEX idx_table_name_client_id ON table_name(client_id);

-- Enable Row Level Security
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create policy (adjust as needed)
CREATE POLICY "Allow all operations" ON table_name
  FOR ALL USING (true);
```

## Standard Columns

| Column | Type | Purpose |
|--------|------|---------|
| `id` | `UUID` | Primary key |
| `client_id` | `UUID` | Foreign key to clients |
| `created_at` | `TIMESTAMPTZ` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | Last update timestamp |
| `status` | `TEXT` | Status enum |

## Adding Columns

```sql
-- Add column with default
ALTER TABLE table_name
ADD COLUMN new_column TEXT DEFAULT 'default_value';

-- Add column without default
ALTER TABLE table_name
ADD COLUMN new_column TEXT;
```

## Creating Indexes

```sql
-- Single column index
CREATE INDEX idx_table_column ON table_name(column_name);

-- Composite index
CREATE INDEX idx_table_columns ON table_name(column1, column2);

-- Unique index
CREATE UNIQUE INDEX idx_table_unique ON table_name(column_name);
```

## Foreign Keys

```sql
-- Add foreign key with cascade delete
ALTER TABLE child_table
ADD CONSTRAINT fk_parent
FOREIGN KEY (parent_id) REFERENCES parent_table(id)
ON DELETE CASCADE;

-- Add foreign key with set null
ALTER TABLE child_table
ADD CONSTRAINT fk_parent
FOREIGN KEY (parent_id) REFERENCES parent_table(id)
ON DELETE SET NULL;
```

## Status Enums

```sql
-- Create enum type (optional, TEXT is often simpler)
CREATE TYPE status_type AS ENUM ('active', 'inactive', 'pending');

-- Or use CHECK constraint
ALTER TABLE table_name
ADD CONSTRAINT check_status
CHECK (status IN ('active', 'inactive', 'pending'));
```

## Running Migrations

```bash
# Apply migrations
npx supabase db push

# Generate migration from diff
npx supabase db diff -f migration_name

# Reset database
npx supabase db reset
```

## Rollback Pattern

For reversible migrations, create a down file:

```sql
-- 20240115120000_create_clients_table.sql (up)
CREATE TABLE clients (...);

-- To rollback manually:
DROP TABLE IF EXISTS clients;
```

## Data Migrations

```sql
-- Update existing data
UPDATE table_name
SET new_column = 'value'
WHERE condition;

-- Migrate data between columns
UPDATE table_name
SET new_column = old_column;

-- Then optionally drop old column
ALTER TABLE table_name DROP COLUMN old_column;
```

## Best Practices

1. **Always test locally first** with `supabase db reset`
2. **Keep migrations small** - one change per file
3. **Use descriptive names** in migration files
4. **Include indexes** for foreign keys
5. **Consider ON DELETE behavior** (CASCADE, SET NULL, RESTRICT)
6. **Add created_at/updated_at** to all tables
7. **Use UUID** for primary keys (not serial)
