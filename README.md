# Data Hub

All-in-one marketing data platform for agencies—combining data warehousing, ETL transformation, BI visualization, and automated report delivery.

## Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (invite-only)
- **Styling**: CSS Modules + Win98 design system

## Quick Start

```bash
# Install dependencies
npm install

# Start local Supabase
supabase start

# Get credentials and create .env files (see .env.example)
supabase status

# Run development servers
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client (5173) + server (3001) |
| `npm run dev:client` | Frontend only |
| `npm run dev:server` | Backend only |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |

## Architecture

```
data-hub/
│
├── client/                      # React Frontend (Vite)
│   ├── public/
│   │   ├── agents/              # Sprite sheets (Clippy, Mimic)
│   │   ├── assets/
│   │   │   ├── psx/             # PSX pixel art sprites
│   │   │   └── sounds/          # UI sound effects
│   │   └── logos/               # Platform logos
│   └── src/
│       ├── components/
│       │   ├── common/          # Button, Modal, DataTable, PSXSprite
│       │   ├── wizard/          # Multi-step wizard system
│       │   ├── source-wizard/   # Add Data Source (4 steps)
│       │   ├── warehouse/       # Data Warehouse components
│       │   ├── report-builder/  # Report Builder (4 steps)
│       │   ├── imp/             # Imp assistant (Clippy-like)
│       │   └── auth/            # Login, auth screens
│       ├── contexts/            # Auth, Imp, Audio providers
│       ├── hooks/               # useClients, useWarehouse, useAudio
│       ├── pages/               # Dashboard, ClientDetail, NewClient
│       ├── services/            # API client
│       └── styles/              # Design tokens, animations
│
├── server/                      # Express Backend
│   ├── middleware/              # Auth, error handling, rate limiting
│   ├── routes/                  # REST API endpoints
│   │   ├── auth.js              # Session validation
│   │   ├── admin.js             # User management
│   │   ├── clients.js           # Client CRUD
│   │   ├── warehouses.js        # Warehouse operations
│   │   ├── reports.js           # Report CRUD + delivery
│   │   └── platforms.js         # Platform registry
│   └── services/
│       ├── supabase.js          # Database layer
│       ├── emailService.js      # SMTP via Nodemailer
│       ├── pdfService.js        # PDF generation (Puppeteer)
│       ├── reportService.js     # Report data + delivery
│       └── schedulerService.js  # Cron job management
│
├── supabase/                    # Database config + migrations
│
├── tests/                       # E2E tests (Playwright)
│
└── scripts/                     # Development utilities
```

## Key Features

| Feature | Description |
|---------|-------------|
| **Data Warehouse** | Platform-specific tables with normalized schemas |
| **ETL** | CSV ingestion → transformation → blended data |
| **BI / Visualization** | KPI cards, charts via Recharts |
| **Report Delivery** | Scheduled PDF/CSV via email |
| **Alerting** | Threshold, trend, freshness monitoring |
| **Lineage** | Source → warehouse → report tracking |

## Supported Platforms

- Meta Ads
- Google Ads
- TikTok Ads
- GA4
- Shopify
- Custom

## Environment

Copy `.env.example` to `.env` and configure:

- **Supabase**: URL, service key, JWT secret
- **SMTP**: For report delivery (optional)
- **Scheduler**: For automated reports (optional)

See `.env.example` for all configuration options.

## License

Proprietary
