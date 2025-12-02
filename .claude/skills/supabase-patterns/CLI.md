# Supabase CLI Reference

Comprehensive reference for the Supabase CLI. All commands assume you're in a project directory with `supabase/` initialized.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `supabase init` | Initialize new project |
| `supabase start` | Start local containers |
| `supabase stop` | Stop local containers |
| `supabase status` | Show running services info |
| `supabase db reset` | Reset database + apply migrations |
| `supabase db push` | Push migrations to remote |
| `supabase migration new <name>` | Create new migration file |

## Installation

```bash
# macOS
brew install supabase/tap/supabase

# npm (alternative)
npm install supabase --save-dev
npx supabase <command>

# Upgrade
brew upgrade supabase
```

## Project Commands

### supabase init

Initialize a new Supabase project.

```bash
supabase init

# Creates:
# supabase/
#   ├── config.toml      # Local configuration
#   ├── migrations/      # Database migrations
#   └── seed.sql         # Seed data (optional)
```

### supabase start

Start local Supabase stack (Postgres, Auth, Storage, etc).

```bash
supabase start

# Output includes:
# API URL: http://127.0.0.1:54321
# GraphQL URL: http://127.0.0.1:54321/graphql/v1
# S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
# DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# Studio URL: http://127.0.0.1:54323
# anon key: eyJ...
# service_role key: eyJ...
# JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
```

**Flags:**
| Flag | Purpose |
|------|---------|
| `--ignore-health-check` | Skip health checks |
| `-x, --exclude <services>` | Skip starting these services |
| `--workdir <path>` | Use different project directory |

### supabase stop

Stop all local containers.

```bash
supabase stop

# With backup
supabase stop --backup

# Without backup (clean slate)
supabase stop --no-backup
```

### supabase status

Show status of running services.

```bash
supabase status

# JSON output for scripting
supabase status --output json
```

### supabase link

Link to a remote Supabase project.

```bash
supabase link --project-ref <project-id>

# Will prompt for database password
```

### supabase login

Authenticate with Supabase.

```bash
supabase login

# Opens browser for authentication
```

## Database Commands

### supabase db reset

Reset local database and apply all migrations.

```bash
supabase db reset

# This:
# 1. Drops all data
# 2. Applies all migrations in order
# 3. Runs seed.sql if present
```

**Use when:** Migration files changed, need clean state, testing migrations.

### supabase db push

Push local migrations to remote database.

```bash
supabase db push

# Dry run (see what would be applied)
supabase db push --dry-run

# Include seed data
supabase db push --include-seed
```

**Flags:**
| Flag | Purpose |
|------|---------|
| `--dry-run` | Preview changes without applying |
| `--include-seed` | Also run seed.sql |
| `--linked` | Push to linked project |
| `--local` | Push to local database |

### supabase db pull

Pull schema from remote database.

```bash
supabase db pull

# Creates migration from remote schema
```

### supabase db diff

Generate migration from schema differences.

```bash
# Compare local to shadow database
supabase db diff -f <migration_name>

# Compare to linked remote
supabase db diff --linked -f <migration_name>

# Compare specific schema
supabase db diff --schema public,auth -f <migration_name>
```

**Flags:**
| Flag | Purpose |
|------|---------|
| `-f, --file <name>` | Migration file name (creates timestamped file) |
| `--linked` | Compare against linked project |
| `--schema <schemas>` | Comma-separated schemas to compare |
| `--use-migra` | Use migra for diff (alternative engine) |

### supabase db lint

Lint database for issues.

```bash
supabase db lint

# Lint specific schema
supabase db lint --schema public
```

### supabase db dump

Dump database schema or data.

```bash
# Dump schema only
supabase db dump -f schema.sql

# Dump data only
supabase db dump --data-only -f data.sql

# Dump specific schema
supabase db dump --schema public -f public.sql
```

## Migration Commands

### supabase migration new

Create a new migration file.

```bash
supabase migration new create_employees_table

# Creates: supabase/migrations/<timestamp>_create_employees_table.sql
# Example: supabase/migrations/20240115120000_create_employees_table.sql
```

**Naming convention:** Use lowercase with underscores describing the change:
- `create_<table>_table`
- `add_<column>_to_<table>`
- `remove_<column>_from_<table>`
- `create_<name>_index`
- `add_rls_policies_to_<table>`

### supabase migration list

List all migrations and their status.

```bash
supabase migration list

# Shows: Name | Local | Remote | Status
```

### supabase migration repair

Repair migration history (mark as applied without running).

```bash
supabase migration repair --status applied <version>

# Mark as reverted
supabase migration repair --status reverted <version>
```

### supabase migration squash

Combine multiple migrations into one.

```bash
supabase migration squash

# Squash to specific version
supabase migration squash --version <timestamp>
```

## Edge Functions Commands

### supabase functions new

Create a new Edge Function.

```bash
supabase functions new my-function

# Creates: supabase/functions/my-function/index.ts
```

### supabase functions serve

Serve functions locally for development.

```bash
supabase functions serve

# Serve specific function
supabase functions serve my-function

# With environment variables
supabase functions serve --env-file .env.local
```

### supabase functions deploy

Deploy functions to production.

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy my-function

# Without JWT verification (public access)
supabase functions deploy my-function --no-verify-jwt
```

### supabase functions list

List deployed functions.

```bash
supabase functions list
```

### supabase functions delete

Delete a deployed function.

```bash
supabase functions delete my-function
```

## Secrets Commands

### supabase secrets set

Set project secrets (environment variables).

```bash
# Set single secret
supabase secrets set MY_SECRET=value

# Set multiple secrets
supabase secrets set KEY1=value1 KEY2=value2

# From env file
supabase secrets set --env-file .env.production
```

### supabase secrets list

List all project secrets.

```bash
supabase secrets list
```

### supabase secrets unset

Remove a secret.

```bash
supabase secrets unset MY_SECRET
```

## Storage Commands

### supabase storage ls

List storage buckets or objects.

```bash
# List buckets
supabase storage ls

# List objects in bucket
supabase storage ls ss:///bucket-name/path
```

### supabase storage cp

Copy files to/from storage.

```bash
# Upload file
supabase storage cp ./local-file.png ss:///bucket-name/remote-file.png

# Download file
supabase storage cp ss:///bucket-name/remote-file.png ./local-file.png

# Upload directory recursively
supabase storage cp -r ./local-dir ss:///bucket-name/remote-dir
```

### supabase storage rm

Remove storage objects.

```bash
supabase storage rm ss:///bucket-name/file.png

# Remove recursively
supabase storage rm -r ss:///bucket-name/directory/
```

## Gen Commands

### supabase gen types

Generate TypeScript types from database schema.

```bash
# Generate from local database
supabase gen types typescript --local > types/supabase.ts

# Generate from linked project
supabase gen types typescript --linked > types/supabase.ts

# Specific schema
supabase gen types typescript --local --schema public,auth
```

### supabase gen keys

Generate new API keys.

```bash
supabase gen keys --project-ref <project-id>
```

## Inspect Commands

### supabase inspect db

Inspect database health and statistics.

```bash
# All inspections
supabase inspect db

# Specific inspections
supabase inspect db bloat
supabase inspect db cache-hit
supabase inspect db index-sizes
supabase inspect db long-running-queries
supabase inspect db table-sizes
supabase inspect db unused-indexes
supabase inspect db role-connections
```

## Branch Commands (Experimental)

### supabase branches create

Create a database branch.

```bash
supabase branches create my-feature-branch
```

### supabase branches list

List all branches.

```bash
supabase branches list
```

### supabase branches delete

Delete a branch.

```bash
supabase branches delete my-feature-branch
```

## Orgs Commands

### supabase orgs list

List organizations.

```bash
supabase orgs list
```

## Projects Commands

### supabase projects list

List all projects.

```bash
supabase projects list
```

### supabase projects create

Create a new project.

```bash
supabase projects create "My Project" --org-id <org-id> --region us-east-1
```

## Common Workflows

### Initial Setup

```bash
# 1. Initialize project
supabase init

# 2. Start local development
supabase start

# 3. Create first migration
supabase migration new initial_schema

# 4. Edit migration file, then reset to apply
supabase db reset
```

### Development Cycle

```bash
# Make schema changes in Studio (http://localhost:54323)
# Then capture as migration:
supabase db diff -f my_changes

# Or create migration manually:
supabase migration new add_feature

# Apply and test:
supabase db reset
```

### Deploy to Production

```bash
# 1. Link to remote project
supabase link --project-ref <project-id>

# 2. Preview changes
supabase db push --dry-run

# 3. Apply migrations
supabase db push

# 4. Deploy functions
supabase functions deploy
```

### Sync Remote Changes

```bash
# Pull remote schema as migration
supabase db pull

# Or diff remote vs local
supabase db diff --linked -f sync_changes
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `SUPABASE_ACCESS_TOKEN` | API access token (avoid login prompt) |
| `SUPABASE_DB_PASSWORD` | Database password (avoid prompt) |
| `SUPABASE_DEBUG` | Enable debug output |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Configuration error |
