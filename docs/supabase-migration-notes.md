# Supabase Architecture Notes

## Status: Complete

Data Hub uses Supabase (PostgreSQL) as the primary database backend with a repository pattern for all data access.

## Architecture

```
Routes → Repositories → Supabase Client → PostgreSQL
         ↑
Services ─┘
```

### Components

| Layer | Location | Purpose |
|-------|----------|---------|
| Routes | `server/routes/*.js` | HTTP handlers, validation |
| Services | `server/services/*.js` | Business logic, orchestration |
| Repositories | `server/services/repositories/*.js` | Data access, field mapping |
| Base | `server/services/base/BaseRepository.js` | CRUD operations |
| Client | `server/services/supabaseClient.js` | Supabase connection singleton |

## Repository Pattern

All database access goes through repositories that extend `BaseRepository`:

```javascript
import { clientRepository } from '../services/repositories/index.js';

// Standard operations
const client = await clientRepository.findById(id);
const clients = await clientRepository.findAll({ filters: { status: 'active' } });
const created = await clientRepository.create({ name, status });
const updated = await clientRepository.update(id, { status: 'inactive' });
await clientRepository.delete(id);
```

### Field Mapping

Repositories handle snake_case (DB) ↔ camelCase (JS) conversion:

```javascript
// mapRow: DB → JS
{ client_id, created_at } → { clientId, createdAt }

// toDbRow: JS → DB
{ clientId, createdAt } → { client_id, created_at }
```

## Available Repositories

| Repository | Table | Purpose |
|------------|-------|---------|
| ClientRepository | clients | Client records |
| SourceRepository | data_sources | Platform connections |
| WarehouseRepository | data_warehouses | Data warehouses |
| UploadRepository | platform_uploads | Upload tracking |
| PlatformDataRepository | platform_data | Raw uploaded data |
| BlendedDataRepository | blended_data | Harmonized data |
| ReportRepository | reports | Report definitions |
| ReportAlertRepository | report_alerts | Report alerts |
| ReportDeliveryHistoryRepository | report_delivery_history | Delivery logs |
| KpiRepository | kpis | KPI definitions |
| KpiAlertRepository | kpi_alerts | KPI alerts + history |
| EtlRepository | etl_processes | ETL pipelines |
| LineageRepository | data_lineage | Data lineage |
| NoteRepository | notes | Documentation |
| SmtpConfigRepository | smtp_config | Email settings |
| ScheduledJobRepository | scheduled_jobs | Cron jobs |
| UserProfileRepository | user_profiles | User metadata |
| UserClientAssignmentRepository | user_client_assignments | Access control |

## Environment Variables

### Local Development (Supabase CLI)
```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=super-secret-jwt-token   # Required - CLI uses HS256
```

### Production (Supabase Cloud)
```bash
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
# SUPABASE_JWT_SECRET not needed - Cloud uses ES256 via JWKS endpoint
```

### Client-side
```bash
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### JWT Verification

The auth middleware automatically detects the environment:
- **Local** (`127.0.0.1`): Uses HS256 symmetric verification with `SUPABASE_JWT_SECRET`
- **Production** (`*.supabase.co`): Uses ES256 asymmetric verification via JWKS endpoint

## Local Development

```bash
# Start Supabase
supabase start

# Get credentials
supabase status

# Apply migrations
supabase db reset

# Stop
supabase stop
```

## Migration History

### Phase 1: Google Sheets → Supabase (Completed)
- Migrated from Google Sheets API to Supabase PostgreSQL
- Created initial schema migrations
- Removed all Google dependencies

### Phase 2: Service Consolidation (Completed)
- Created `supabaseService.js` as unified data layer
- Updated all routes to use service layer
- Standardized error handling

### Phase 3: Repository Pattern (Completed - Dec 2025)
- Introduced BaseRepository with standard CRUD
- Created 18+ domain-specific repositories
- Migrated all routes from `supabaseService` to repositories
- Migrated all services (scheduler, alerts, workbook) to repositories
- Created middleware barrel export (`server/middleware/index.js`)
- Deprecated `supabaseService.js` facade

## Files Deprecated (Safe to Remove)

The following files are no longer used:
- `server/services/sheets.js` - Original Google Sheets integration
- `server/services/supabaseService.js` - Legacy facade (replaced by repositories)

## Documentation

- **Skill Reference**: `.claude/skills/supabase-patterns/SKILL.md`
- **Service Patterns**: `.claude/skills/supabase-patterns/SERVICES.md`
- **CLI Reference**: `.claude/skills/supabase-patterns/CLI.md`
- **RLS Policies**: `.claude/skills/supabase-patterns/RLS.md`
