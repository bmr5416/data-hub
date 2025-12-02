---
name: supabase-patterns
description: Backend patterns for Data Hub Express API and Supabase database. Use when creating routes, services, or database operations. Covers RESTful conventions, error handling, and query patterns.
---

# Supabase Backend Patterns

Comprehensive skill for Supabase development in Data Hub. Covers CLI commands, database design, RLS security, migrations, configuration, and production best practices.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA HUB STACK                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐      ┌─────────────────────────────────────────┐  │
│  │    React Frontend   │      │              Express Backend            │  │
│  │                     │      │                                         │  │
│  │  - Supabase Auth    │──────│  Routes → Services → Supabase Client   │  │
│  │  - API calls        │      │                                         │  │
│  │  - Realtime subs    │      │  - requestIdMiddleware                  │  │
│  └─────────────────────┘      │  - errorHandler                         │  │
│           │                   └───────────────────┬─────────────────────┘  │
│           │                                       │                        │
│           ▼                                       ▼                        │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                         SUPABASE                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   PostgREST  │  │     Auth     │  │   Storage    │              │   │
│  │  │    (API)     │  │  (JWT/RLS)   │  │   (Files)    │              │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────────┘              │   │
│  │         │                 │                                         │   │
│  │         ▼                 ▼                                         │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │                    PostgreSQL                               │    │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │    │   │
│  │  │  │                 RLS POLICIES                         │   │    │   │
│  │  │  │   "Filter rows based on auth.uid() / JWT claims"     │   │    │   │
│  │  │  └─────────────────────────────────────────────────────┘   │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Reference

| Action | Command/Pattern |
|--------|-----------------|
| Start local dev | `supabase start` |
| Stop local dev | `supabase stop` |
| Create migration | `supabase migration new <name>` |
| Reset database | `supabase db reset` |
| Push to remote | `supabase db push` |
| Generate diff | `supabase db diff -f <name>` |
| Deploy functions | `supabase functions deploy` |

## Files in This Skill

### Core Reference

| File | Purpose |
|------|---------|
| [CLI.md](CLI.md) | Complete CLI command reference |
| [CONFIG.md](CONFIG.md) | config.toml configuration reference |
| [MIGRATIONS.md](MIGRATIONS.md) | Database migration patterns |
| [NAMING-CONVENTIONS.md](NAMING-CONVENTIONS.md) | Table, column, constraint naming |

### Security & Best Practices

| File | Purpose |
|------|---------|
| [RLS.md](RLS.md) | Row Level Security patterns |
| [BEST-PRACTICES.md](BEST-PRACTICES.md) | Production checklist & optimization |

### Application Patterns

| File | Purpose |
|------|---------|
| [ROUTES.md](ROUTES.md) | Express route patterns |
| [SERVICES.md](SERVICES.md) | Service layer conventions |

## Essential Patterns

### Route Structure

```javascript
router.get('/:id', async (req, res, next) => {
  try {
    const result = await service.getById(req.params.id);
    if (!result) {
      throw new AppError('Not found', 404);
    }
    res.json({ result });
  } catch (error) {
    next(error);  // Always use next(error)
  }
});
```

### Error Handling

```javascript
import { AppError } from '../middleware/errorHandler.js';

// Throw AppError for known errors
throw new AppError('Client not found', 404);
throw new AppError('Invalid email format', 400);
throw new AppError('Validation errors: ' + errors.join(', '), 400);
```

### Service Method

```javascript
async getById(id) {
  await this.init();

  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return this.formatResult(data);
}
```

### RLS Policy (Performance Optimized)

```sql
-- Cache auth.uid() with SELECT wrapper
CREATE POLICY "Users access own data" ON clients
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));
```

### Migration Pattern

```sql
-- supabase/migrations/20240115120000_create_clients_table.sql

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Always enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users access assigned clients" ON clients
  FOR SELECT
  USING (
    id IN (
      SELECT client_id FROM user_client_assignments
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Index for RLS performance
CREATE INDEX idx_clients_id ON clients(id);
```

## Naming Conventions (Critical)

### Tables

```sql
-- USE: lowercase, underscores, plural
clients
data_sources
user_client_assignments

-- AVOID:
Client             -- PascalCase
dataSources        -- camelCase
client             -- singular
tbl_clients        -- prefix
```

### Columns

```sql
-- USE: lowercase, underscores
client_id          -- foreign keys end in _id
is_active          -- booleans start with is_/has_
created_at         -- timestamps end in _at

-- AVOID:
clientId           -- camelCase
ClientID           -- mixed case
active             -- ambiguous boolean
```

### Migrations

```
<timestamp>_<action>_<object>.sql

20240115120000_create_clients_table.sql
20240115120100_add_status_to_clients.sql
20240115120200_add_rls_to_data_sources.sql
```

## API Route Conventions

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/resources` | List all |
| GET | `/api/resources/:id` | Get single |
| POST | `/api/resources` | Create new |
| PUT | `/api/resources/:id` | Update |
| DELETE | `/api/resources/:id` | Delete |
| GET | `/api/parents/:id/children` | List nested |
| POST | `/api/parents/:id/children` | Create nested |

## Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 400 | Validation error |
| 404 | Not found |
| 500 | Server error |

## Local Development

```bash
# Initialize (first time)
supabase init

# Start local stack
supabase start

# Access:
# API:    http://127.0.0.1:54321
# Studio: http://127.0.0.1:54323
# DB:     postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Create migration
supabase migration new my_feature

# Apply migrations
supabase db reset

# Stop
supabase stop
```

## Production Deployment

```bash
# Link to project
supabase link --project-ref <project-id>

# Preview changes
supabase db push --dry-run

# Apply
supabase db push

# Deploy edge functions
supabase functions deploy
```

## When to Use This Skill

Invoke `Skill: supabase-patterns` before:
- Creating new database tables
- Writing migrations
- Implementing RLS policies
- Creating Express routes
- Writing service layer code
- Configuring local development
- Deploying to production

## Source of Truth

| Location | Purpose |
|----------|---------|
| `supabase/config.toml` | Local configuration |
| `supabase/migrations/` | Database migrations |
| `server/routes/*.js` | Express routes |
| `server/services/*.js` | Service layer |
| `server/middleware/*.js` | Middleware |
