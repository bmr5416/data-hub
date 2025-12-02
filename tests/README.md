# Tests

Comprehensive testing suite for Data Hub. All tests are idempotent and repeatable.

## Architecture

```
tests/
│
├── setup/                      # Test infrastructure
│   ├── global-setup.ts         # Runs once before all tests
│   ├── global-teardown.ts      # Runs once after all tests (CI cleanup)
│   ├── setup.ts                # Runs before each test file
│   ├── supabase-helpers.ts     # Database test utilities
│   └── test-env.ts             # Environment configuration
│
├── fixtures/                   # Test data
│   ├── factories/              # Dynamic data generators
│   │   ├── client.factory.ts
│   │   ├── source.factory.ts
│   │   ├── warehouse.factory.ts
│   │   └── report.factory.ts
│   ├── platforms/              # Platform CSV samples
│   │   ├── meta-ads/
│   │   ├── google-ads/
│   │   ├── tiktok-ads/
│   │   ├── ga4/
│   │   ├── shopify/
│   │   └── custom/
│   └── edge-cases/             # Error handling CSVs
│
├── unit/                       # Pure logic tests
│   └── server/
│       └── validators.test.ts  # 84 tests
│
├── integration/                # API + Database tests
│   ├── api/                    # Route handlers
│   ├── services/               # Business logic
│   └── database/               # Data layer
│
├── component/                  # React component tests
│   ├── common/                 # Shared UI
│   └── wizards/                # Multi-step flows
│
└── e2e/                        # Playwright browser tests
```

## Commands

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Visual UI
npm run test:coverage # With coverage report

npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:component   # Component tests only
npm run test:e2e         # E2E browser tests
```

## Test Pyramid

```
        ╱╲
       ╱  ╲        E2E (Playwright)
      ╱────╲       Critical user flows only
     ╱      ╲
    ╱────────╲     Component (React Testing Library)
   ╱          ╲    UI behavior + accessibility
  ╱────────────╲
 ╱              ╲  Integration (Vitest + Supabase)
╱────────────────╲ API routes, services, database
──────────────────
       Unit        Pure functions, validators
    (fastest)      No external dependencies
```

## Factories

Generate unique test data with `@faker-js/faker`:

```typescript
import { createTestClient, createTestWarehouse } from '@tests/fixtures/factories'

const client = createTestClient({ status: 'active' })
const warehouse = createTestWarehouse({ platforms: ['meta_ads'] })
```

## Globals

Available in all tests via `setup.ts`:

```typescript
getShortUnique()  // Returns 8-char unique ID for test isolation
```

## Principles

1. **Idempotent** - Run 100x, same result
2. **Isolated** - No shared state between tests
3. **Fast** - Unit tests < 1s, integration < 10s
4. **Real DB** - Local Supabase, no mocks
