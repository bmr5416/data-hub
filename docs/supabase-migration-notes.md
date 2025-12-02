# Supabase Migration Notes

## Status: In Progress

The Data Hub is migrating from Google Sheets to Supabase (PostgreSQL) as the primary database backend.

## Completed

- [x] Created `supabaseClient.js` - Supabase client singleton
- [x] Created `supabase.js` - Full CRUD service layer (replaces `sheets.js`)
- [x] Created SQL migration schema (`server/supabase/migrations/001_initial_schema.sql`)
- [x] Updated all main route files to import from `supabase.js`
- [x] Updated `.env.example` with Supabase credentials

## Remaining Work: Full Google Sheets Removal

The following files still contain Google Sheets integration that needs to be removed or refactored:

### Services to Remove/Refactor

1. **`server/services/sheets.js`**
   - Status: No longer imported by routes, but file still exists
   - Action: Delete file after confirming all functionality migrated

2. **`server/services/clientWorkbookService.js`**
   - Status: Uses Google Sheets API to create client data workbooks
   - Action: Either remove workbook feature entirely OR migrate to Supabase-based solution
   - Note: This service creates actual Google Sheets for users to paste data into

3. **`server/services/warehouseService.js`** (if exists)
   - Status: May have Google Sheets dependencies
   - Action: Review and update to use Supabase

### Routes to Review

1. **`server/routes/workbooks.js`**
   - Uses `clientWorkbookService` which depends on Google Sheets
   - Decision needed: Remove workbook feature or find alternative

### Frontend Components to Update

1. **`client/src/components/source-wizard/`**
   - The Source Wizard creates Google Sheets workbooks for data upload
   - Options:
     - A) Remove the wizard entirely
     - B) Replace with direct file upload to Supabase
     - C) Use Supabase Storage for file uploads

2. **`client/src/pages/ClientDetail.jsx`**
   - May have workbook-related UI that needs updating

### Data Files to Clean Up

1. **`server/data/platformMappings.js`** - Review if still needed
2. **`server/data/platforms.js`** - Review if still needed

## Environment Variables

### Required (Supabase)
```bash
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Deprecated (Google Sheets) - To Be Removed
```bash
# These can be removed once migration is complete
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_SHEET_ID=...
```

## Decision Points

### Source Wizard / Data Workbook Feature

The current implementation creates Google Sheets workbooks where users paste exported platform data. Options for the future:

1. **Remove feature** - Simplest, removes Google dependency entirely
2. **File upload** - Users upload CSV/Excel files directly, stored in Supabase Storage
3. **Direct API integration** - Connect to platforms via API (more complex)

### Recommendation

For MVP: Remove the Source Wizard workbook feature to eliminate all Google dependencies. The core Data Hub functionality (clients, sources, ETL, KPIs, reports, lineage) works fully with Supabase.

## Migration Checklist

- [ ] Set up Supabase project
- [ ] Run migration SQL in Supabase SQL Editor
- [ ] Add Supabase credentials to `.env`
- [ ] Test all API endpoints
- [ ] Remove `sheets.js` service file
- [ ] Remove or refactor `clientWorkbookService.js`
- [ ] Update/remove Source Wizard components
- [ ] Remove Google Sheets dependencies from `package.json`
- [ ] Update CLAUDE.md documentation
- [ ] Remove deprecated env vars from `.env.example`
