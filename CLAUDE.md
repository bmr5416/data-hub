# CLAUDE.md

Guidance for Claude Code when working with this codebase.

## Project Overview

**All-in-one marketing data platform** for agencies—combining data warehousing, ETL transformation, BI visualization, and automated report delivery in a unified interface.

**Stack:** React 18 + Vite | Node.js + Express | Supabase (PostgreSQL)

---

## Product Vision

> **Mission:** "Bring clarity to chaos."

### What Data Hub IS

| Capability | Implementation |
|------------|----------------|
| **Data Warehouse** | Platform-specific tables with normalized schemas |
| **ETL** | CSV ingestion → transformation → blended data |
| **BI / Visualization** | KPI cards, charts via Recharts |
| **Report Delivery** | Scheduled PDF/CSV via email |
| **Alerting** | Threshold, trend, freshness monitoring |
| **Lineage** | Source → warehouse → report tracking |

### Mission Pillars

| Pillar | Description | Success Metric |
|--------|-------------|----------------|
| **Clarity** | Every data flow is traceable | Answer "what breaks if X fails?" in <30s |
| **Automation** | Eliminate manual reporting | Zero human steps for routine delivery |
| **Accessibility** | Non-technical users self-serve | New user creates report without help |
| **Delight** | Operational work has personality | Users describe tool as "fun" |

### Maturity Phases

```
[x] Phase 0: MVP ──────── Current (internal use)
[ ] Phase 1: MMP ──────── Target (client-facing) ← WORKING ON THIS
[ ] Phase 2: MLP ──────── Lovable (users recommend)
[ ] Phase 3: MAP ──────── Awesome (competitive parity)
```

**Tracking:** See `PRODUCT-PROGRESSION.md` for detailed gap checklists and validation gates.

---

## Agents & Skills System

### Directory Structure

```
.claude/
├── agents/                    # Specialized review agents
│   ├── code-reviewer.md       # Code standards compliance
│   ├── style-validator.md     # Win98 CSS validation
│   ├── product-vision-reviewer.md  # Mission alignment review
│   └── refactor.md            # Codebase optimization
└── skills/                    # Domain knowledge
    ├── platform-schemas/      # Meta, Google, TikTok field schemas
    ├── psx-sprites/           # PSX pixel art sprite system
    ├── supabase-patterns/     # Backend route/service patterns
    ├── win98-dungeon/         # Design system tokens + patterns
    ├── wizard-patterns/       # Multi-step wizard patterns
    └── product-vision/        # Mission, phases, gap framework
```

### When to Invoke

| Action | Invoke |
|--------|--------|
| Before CSS changes | `Skill: win98-dungeon` |
| Before wizard/form work | `Skill: wizard-patterns` |
| Before backend routes | `Skill: supabase-patterns` |
| Before platform field work | `Skill: platform-schemas` |
| After CSS changes | `Agent: style-validator` |
| After significant code | `Agent: code-reviewer` |
| Before phase promotion | `Agent: product-vision-reviewer` |

### Workflow

```
1. Read gap description in PRODUCT-PROGRESSION.md
2. Invoke required skills before implementation
3. Implement following existing codebase patterns
4. Run validation agents for sign-off
5. Check off completed items in PRODUCT-PROGRESSION.md
6. Commit with gap ID reference (e.g., "Implements GAP-P1-001")
```

### Agent Sign-Off Requirements

Before phase promotion, ALL must pass:
- `style-validator` → 0 violations
- `code-reviewer` → PASS (0 critical issues)
- `product-vision-reviewer` → ≥95% phase readiness

## Codebase Map

```
data-hub/
│
├── client/                         # React Frontend
│   ├── public/
│   │   ├── agents/
│   │   │   ├── Clippy/map.png      # Clippy sprite sheet (124x93px frames)
│   │   │   └── Mimic/chest_mimic.png  # Mimic chest sprite (16x16 frames)
│   │   ├── assets/psx/             # PSX pixel art sprites
│   │   │   ├── ui-sprites.png      #   Hourglass, star, coin (32x32)
│   │   │   ├── status-sprites.png  #   Hearts + test tubes (32x32)
│   │   │   ├── platform-sprites.png #  Floppy, monitor, lock, gameboy
│   │   │   └── loading-target.gif  #   Loading animation target
│   │   └── logos/                  # Platform logos
│   └── src/
│       ├── components/
│       │   ├── common/             # Shared UI components
│       │   │   ├── Button.jsx      #   Polymorphic button/link
│       │   │   ├── Card.jsx        #   Content container
│       │   │   ├── DataTable.jsx   #   Data display with PSX sprites
│       │   │   ├── ErrorBoundary.jsx #  React error boundary
│       │   │   ├── FileUploader.jsx #  Drag-drop file upload
│       │   │   ├── Icon.jsx        #   SVG icon library
│       │   │   ├── Layout.jsx      #   App shell with sidebar
│       │   │   ├── LoadingAnimation.jsx  # PSX hourglass + messages
│       │   │   ├── Modal.jsx       #   Reusable modal
│       │   │   ├── ProgressBar.jsx
│       │   │   ├── PSXSprite.jsx   #   Animated pixel art sprites
│       │   │   └── StatusBadge.jsx #   Status with PSX hearts
│       │   ├── client/             # Client management
│       │   │   └── AddClientModal.jsx  # Quick-add client modal
│       │   ├── wizard/             # Multi-step wizard system
│       │   │   ├── Wizard.jsx      #   Container + state
│       │   │   ├── WizardProgress.jsx  # Step indicator
│       │   │   └── WizardNavigation.jsx # Nav buttons
│       │   ├── source-wizard/      # Add Data Source wizard
│       │   │   ├── SourceWizard.jsx    # 4-step wizard
│       │   │   ├── DuplicatePlatformModal.jsx
│       │   │   └── steps/
│       │   │       ├── PlatformSelectStep.jsx  # Step 1: Choose platform
│       │   │       ├── SchemaPreviewStep.jsx   # Step 2: Configure schema
│       │   │       ├── WarehouseSelectionStep.jsx # Step 3: Warehouse
│       │   │       └── DataUploadStep.jsx      # Step 4: Upload CSV
│       │   ├── warehouse/          # Data Warehouse components
│       │   │   ├── DataWarehouseWizard.jsx  # Standalone wizard
│       │   │   ├── FieldSelector.jsx
│       │   │   ├── PlatformSelector.jsx
│       │   │   ├── SchemaPreview.jsx
│       │   │   ├── WarehouseDetailModal.jsx
│       │   │   ├── shared/         # Shared form components
│       │   │   │   ├── WarehouseNameInput.jsx
│       │   │   │   └── BlendedTableCheckbox.jsx
│       │   │   └── steps/
│       │   │       ├── PlatformSelectionStep.jsx
│       │   │       ├── FieldSelectionStep.jsx
│       │   │       └── ReviewStep.jsx
│       │   ├── report-builder/     # Report Builder system
│       │   │   ├── ReportBuilderWizard.jsx  # 4-step wizard
│       │   │   ├── ReportDetailModal.jsx    # View/edit reports
│       │   │   ├── steps/
│       │   │   │   ├── DataSourceStep.jsx      # Step 1: Warehouse selection
│       │   │   │   ├── VisualizationStep.jsx   # Step 2: Add KPIs + Charts
│       │   │   │   ├── ScheduleStep.jsx        # Step 3: Delivery config
│       │   │   │   └── ReviewStep.jsx          # Step 4: Preview + create
│       │   │   └── visualizations/
│       │   │       ├── index.js           # Barrel exports
│       │   │       ├── chartTheme.js      # Win98 Recharts theme
│       │   │       ├── KPICard.jsx        # Dashboard metric card
│       │   │       ├── ChartWrapper.jsx   # Recharts container
│       │   │       ├── BarChartViz.jsx    # Bar chart
│       │   │       ├── LineChartViz.jsx   # Line chart
│       │   │       ├── PieChartViz.jsx    # Pie chart
│       │   │       └── ChartConfigPanel.jsx # Chart setup form
│       │   ├── source/             # Source components
│       │   │   └── SourceDetailModal.jsx
│       │   ├── platform-data/      # Platform data preview modals
│       │   │   ├── CSVPreviewModal.jsx
│       │   │   └── PlatformDataSelectionModal.jsx
│       │   ├── auth/               # Authentication components
│       │   │   ├── LoginPage.jsx   #   Email/password login form
│       │   │   └── AuthLoadingScreen.jsx  # Loading during auth init
│       │   ├── admin/              # Admin management
│       │   │   ├── UserManagementSection.jsx  # User list + CRUD
│       │   │   ├── InviteUserModal.jsx        # Invite new users
│       │   │   └── EditUserModal.jsx          # Edit user details
│       │   └── imp/                # Imp assistant (Clippy-like)
│       │       ├── Imp.jsx         #   Main orchestrator
│       │       ├── ImpBalloon.jsx  #   Speech balloon
│       │       ├── ImpSprite.jsx   #   Full Clippy sprite
│       │       └── MimicChest.jsx  #   Minimized chest
│       ├── lib/
│       │   └── supabase.js         # Supabase client singleton
│       ├── contexts/
│       │   ├── AuthContext.jsx     # Supabase Auth state management
│       │   └── ImpContext.jsx      # Imp assistant lifecycle
│       ├── data/
│       │   ├── impAnimations.js    # Clippy animation data
│       │   ├── mimicAnimations.js  # Mimic chest animations
│       │   ├── psxAnimations.js    # PSX sprite data
│       │   ├── impTips.js          # Context-aware tips
│       │   ├── funModeMessages.js  # Loading messages
│       │   └── platforms.js        # Platform definitions
│       ├── hooks/
│       │   ├── useClients.js       # Client CRUD
│       │   ├── usePlatforms.js     # Platform registry
│       │   ├── useWarehouse.js     # Warehouse CRUD
│       │   ├── useReport.js        # Report CRUD + actions
│       │   ├── useReportBuilder.js # Report builder wizard state
│       │   ├── useWizard.js        # Wizard state
│       │   ├── useMinLoadingTime.js
│       │   ├── useImpTip.js
│       │   ├── useImpMischief.js
│       │   └── useMimicMischief.js
│       ├── pages/
│       │   ├── Dashboard.jsx       # Client list + stats
│       │   ├── ClientDetail.jsx    # Client detail tabs
│       │   ├── NewClient.jsx       # Client creation
│       │   └── Documentation.jsx   # Markdown viewer
│       ├── services/
│       │   └── api.js              # API client
│       ├── styles/
│       │   ├── animations.module.css
│       │   ├── index.css           # Design tokens
│       │   └── README.md           # Styling guide
│       ├── App.jsx
│       └── main.jsx
│
├── server/                         # Express Backend
│   ├── data/
│   │   ├── platforms.js            # Platform definitions
│   │   └── platformMappings.js     # Field mappings
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification middleware
│   │   ├── errorHandler.js         # Error handling
│   │   └── requestId.js            # Request ID + logging
│   ├── routes/
│   │   ├── auth.js                 # Session validation
│   │   ├── admin.js                # User management (admin only)
│   │   ├── clients.js              # Client CRUD
│   │   ├── sources.js              # Data source CRUD
│   │   ├── etl.js                  # ETL CRUD
│   │   ├── kpis.js                 # KPI CRUD
│   │   ├── reports.js              # Report CRUD + delivery + alerts
│   │   ├── lineage.js              # Lineage connections
│   │   ├── notes.js                # Documentation
│   │   ├── platforms.js            # Platform registry
│   │   ├── warehouses.js           # Warehouse CRUD
│   │   ├── uploads.js              # File uploads
│   │   ├── smtp.js                 # SMTP configuration
│   │   ├── mappings.js             # Field mappings
│   │   └── alerts.js               # Global alerts
│   ├── services/
│   │   ├── supabase.js             # Supabase layer
│   │   ├── supabaseClient.js       # Supabase singleton
│   │   ├── warehouseService.js     # Warehouse operations
│   │   ├── clientWorkbookService.js # Workbook management
│   │   ├── blendingService.js      # Data blending
│   │   ├── platformRegistry.js     # Platform metadata
│   │   ├── mappingService.js       # Field mappings
│   │   ├── validators.js           # UUID validation
│   │   ├── emailService.js         # Nodemailer SMTP
│   │   ├── pdfService.js           # Puppeteer PDF generation
│   │   ├── reportService.js        # Report data + delivery
│   │   ├── reportAlertService.js   # Alert evaluation
│   │   └── schedulerService.js     # node-cron scheduling
│   └── index.js                    # Express app + scheduler init
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│
├── docs/platforms/                 # API field references
│   ├── meta-ads-fields.md
│   ├── google-ads-fields.md
│   ├── ga4-fields.md
│   ├── tiktok-ads-fields.md
│   └── shopify-fields.md
│
├── .claude/                        # Agent & Skill System
│   ├── agents/
│   │   ├── code-reviewer.md        # Code standards compliance
│   │   ├── style-validator.md      # Win98 CSS validation
│   │   ├── product-vision-reviewer.md  # Mission alignment
│   │   └── refactor.md             # Optimization agent
│   └── skills/
│       ├── platform-schemas/       # API field references
│       ├── psx-sprites/            # Sprite animation guide
│       ├── supabase-patterns/      # Backend patterns
│       ├── win98-dungeon/          # Design system
│       ├── wizard-patterns/        # Multi-step wizard guide
│       └── product-vision/         # Mission + maturity phases
│           ├── SKILL.md            # Main hub
│           ├── MISSION.md          # Full mission statement
│           ├── MATURITY-PHASES.md  # Phase definitions
│           └── GAP-CATEGORIES.md   # Gap type framework
│
├── package.json
├── .eslintrc.cjs
├── vercel.json
├── PRODUCT-PROGRESSION.md          # Phase checklist + validation gates
└── CLAUDE.md
```

## Commands

```bash
npm install              # Install all dependencies
npm run dev              # Run client (5173) + server (3001)
npm run dev:client       # Frontend only
npm run dev:server       # Backend only
npm run build            # Production build
npm run lint             # ESLint check
```

## Environment Variables

```bash
# Supabase (Required)
SUPABASE_URL=http://127.0.0.1:54321          # Local: from `supabase status`
SUPABASE_SERVICE_ROLE_KEY=eyJ...             # From `supabase status`
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# Client-side (in client/.env)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJ...                # From `supabase status`

# SMTP Configuration (for report delivery)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM_EMAIL=reports@yourdomain.com

# Scheduler
SCHEDULER_ENABLED=true
SCHEDULER_TIMEZONE=America/New_York
```

## API Routes

```
Auth (Public)
  GET    /api/auth/me                  Get current user profile
  GET    /api/auth/session             Validate session
  POST   /api/auth/signout             Sign out (clear session)

Admin (Requires auth + admin role)
  GET    /api/admin/users              List all users
  GET    /api/admin/users/:id          Get user details
  POST   /api/admin/users              Invite new user
  PUT    /api/admin/users/:id          Update user
  DELETE /api/admin/users/:id          Delete user
  POST   /api/admin/users/:id/resend-invite  Resend invite email
  PUT    /api/admin/users/:id/clients  Update user's client assignments

Clients
  GET    /api/clients                  List all
  GET    /api/clients/:id              Get with all data
  POST   /api/clients                  Create
  PUT    /api/clients/:id              Update
  DELETE /api/clients/:id              Delete (cascade)

Data Sources
  GET    /api/clients/:id/sources      Get client sources
  POST   /api/clients/:id/sources      Add source
  PUT    /api/sources/:id              Update
  DELETE /api/sources/:id              Delete

Warehouses
  GET    /api/clients/:id/warehouses   List client warehouses
  GET    /api/warehouses/:id           Get warehouse details
  POST   /api/clients/:id/warehouses   Create warehouse
  PUT    /api/warehouses/:id           Update
  DELETE /api/warehouses/:id           Delete

Reports
  GET    /api/reports                  List all reports
  GET    /api/reports/:id              Get report details
  POST   /api/reports                  Create report
  PUT    /api/reports/:id              Update report
  DELETE /api/reports/:id              Delete report

Report Delivery
  GET    /api/reports/:id/preview      Get report preview with data
  POST   /api/reports/:id/send         Send to all recipients
  POST   /api/reports/:id/test-email   Send test email
  POST   /api/reports/:id/schedule     Schedule report delivery
  DELETE /api/reports/:id/schedule     Unschedule report
  GET    /api/reports/:id/delivery-history  Get delivery history

Report Alerts
  GET    /api/reports/:id/alerts           List report alerts
  POST   /api/reports/:id/alerts           Create alert
  GET    /api/reports/:id/alerts/:alertId  Get alert
  PUT    /api/reports/:id/alerts/:alertId  Update alert
  DELETE /api/reports/:id/alerts/:alertId  Delete alert
  POST   /api/reports/:id/alerts/:alertId/test     Test alert
  GET    /api/reports/:id/alerts/:alertId/history  Alert history

Platforms
  GET    /api/platforms                List all platforms
  GET    /api/platforms/:id            Get platform + schema

SMTP
  GET    /api/smtp/config              Get SMTP configuration
  PUT    /api/smtp/config              Update SMTP configuration
  POST   /api/smtp/test                Test SMTP connection

Platform Data (Client Data API)
  GET    /api/clients/:id/data                  Get platform data info
  POST   /api/clients/:id/data                  Create platform data store
  POST   /api/clients/:id/data/platforms        Add platform table
  POST   /api/clients/:id/data/upload/:pid      Upload CSV
  GET    /api/clients/:id/data/schema/:pid      Get platform schema
```

## Data Model

| Table | Purpose |
|-------|---------|
| clients | Client records |
| data_sources | Platform connections |
| data_warehouses | Client data warehouses |
| etl_processes | Pipeline documentation |
| kpis | Key performance indicators |
| reports | Dashboard/report registry (enhanced with visualization_config, schedule_config) |
| data_lineage | Source-to-destination connections |
| platform_uploads | File upload tracking |
| platform_data | Raw uploaded data (JSONB) |
| blended_data | Harmonized multi-platform data |
| smtp_config | SMTP server configuration |
| report_alerts | Report-level alerts (threshold, trend, freshness) |
| report_alert_history | Alert trigger history |
| report_delivery_history | Report send history |
| scheduled_jobs | Persistent cron job registry |
| user_profiles | User metadata (display name, admin flag) |
| user_client_assignments | User-to-client access with roles |

### Status Values

| Entity | Values |
|--------|--------|
| Client | active, inactive, onboarding |
| Source | connected, pending, error, disconnected |
| ETL | active, paused, error, deprecated |
| Report Delivery | pending, sending, sent, failed |
| Alert | metric_threshold, trend_detection, data_freshness |

## Supported Platforms

| Platform | Category |
|----------|----------|
| Meta Ads | Advertising |
| Google Ads | Advertising |
| TikTok Ads | Advertising |
| GA4 | Analytics |
| Shopify | E-commerce |
| Custom | User-defined |

---

## Styling System (Win98 Dungeon Theme)

Permanent retro Windows 98 aesthetic with dungeon/RPG theme. Zero border radius, 3D beveled effects.

### Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LAYOUT STRUCTURE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐ ┌────────────────────────────────────────────────────┐   │
│  │              │ │                                                    │   │
│  │   SIDEBAR    │ │                   MAIN CONTENT                     │   │
│  │              │ │                                                    │   │
│  │  ┌────────┐  │ │  ┌────────────────────────────────────────────┐   │   │
│  │  │ NAV    │  │ │  │                                            │   │   │
│  │  │ ITEM   │  │ │  │              PAGE HEADER                   │   │   │
│  │  │ raised │  │ │  │         (h1 + subtitle, gold text)         │   │   │
│  │  └────────┘  │ │  │                                            │   │   │
│  │              │ │  └────────────────────────────────────────────┘   │   │
│  │  ┌────────┐  │ │                                                    │   │
│  │  │ NAV    │  │ │  ┌────────────────────────────────────────────┐   │   │
│  │  │ ITEM   │  │ │  │                  CARD                      │   │   │
│  │  │ active │  │ │  │           ╔════════════════╗               │   │   │
│  │  │pressed │  │ │  │           ║  RAISED BORDER ║ ◄─ light TL   │   │   │
│  │  └────────┘  │ │  │           ║                ║    dark BR    │   │   │
│  │              │ │  │           ║   CONTENT      ║               │   │   │
│  │  ┌────────┐  │ │  │           ║                ║               │   │   │
│  │  │ PSX    │  │ │  │           ╚════════════════╝               │   │   │
│  │  │ SPRITE │  │ │  │                                            │   │   │
│  │  │ icons  │  │ │  │  ┌──────────────────────────────────────┐  │   │   │
│  │  └────────┘  │ │  │  │           FORM INPUT                 │  │   │   │
│  │              │ │  │  │   ╔══════════════════════════════╗   │  │   │   │
│  │  texture:    │ │  │  │   ║  INSET BORDER               ║   │  │   │   │
│  │  sidebar     │ │  │  │   ║  (sunken 3D effect)         ║   │  │   │   │
│  │              │ │  │  │   ╚══════════════════════════════╝   │  │   │   │
│  │              │ │  │  └──────────────────────────────────────┘  │   │   │
│  │              │ │  │                                            │   │   │
│  │              │ │  │  ┌─────────┐  ┌─────────┐                  │   │   │
│  │              │ │  │  │ BUTTON  │  │ BUTTON  │                  │   │   │
│  │              │ │  │  │ raised  │  │ primary │                  │   │   │
│  │              │ │  │  │ 3D      │  │ gold bg │                  │   │   │
│  │              │ │  │  └─────────┘  └─────────┘                  │   │   │
│  │              │ │  └────────────────────────────────────────────┘   │   │
│  │  width:      │ │               background: texture-main            │   │
│  │  260px       │ │               (parchment gradient)                │   │
│  └──────────────┘ └────────────────────────────────────────────────────┘   │
│                                                                             │
│  Legend: ════ = raised border | ──── = inset border                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Win98 3D Border System

```
RAISED (buttons, cards)           INSET (inputs)
┌──────────────────────┐          ┌──────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░│ light    │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ dark
│░      CONTENT       ▓│          │▓ ┌────────────────┐ ░│
│░                    ▓│          │▓ │  INPUT VALUE   │ ░│
│░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ dark     │▓ └────────────────┘ ░│
└──────────────────────┘          │▓░░░░░░░░░░░░░░░░░░░░│ light
                                  └──────────────────────┘
```

### Core Design Tokens

```css
/* Typography */
--font-display: "Press Start 2P", monospace;  /* Headings */
--font-ui: "Silkscreen", monospace;           /* Labels */
--font-family: "VT323", monospace;            /* Body */

/* Colors */
--color-primary: #FFD700;         /* Gold */
--color-bg-primary: #3A3A5C;      /* Dungeon stone */
--color-bg-secondary: #2D1B4E;    /* Purple accent */
--color-text-primary: #FFECD6;    /* Parchment */
--color-text-secondary: #C4B4A8;
--color-text-muted: #B8A89C;

/* Status */
--color-success: #30A46C;
--color-error: #E23D28;
--color-warning: #FFAA5E;
--color-info: #00BBF9;

/* Win98 Borders */
--win98-border-light: #5A5A7C;
--win98-border-dark: #2D1B4E;
--win98-border-darker: #1A1A2E;
--win98-border-lighter: #4A4A6C;
```

### Strict Rules

1. **NO ROUNDED CORNERS** - `border-radius: 0`
2. **2px SOLID BORDERS** - Never 1px
3. **SEMANTIC TOKENS ONLY** - No hardcoded hex
4. **GOLD TITLES** - `--color-primary` + text-shadow
5. **CORRECT FONTS** - `--font-display` headings, `--font-ui` labels
6. **FORM SPACING HIERARCHY** - Use standardized spacing for modal forms:
   - 24px between sections (`--space-5`)
   - 16px between fields (`--space-4`)
   - 8px label-input (`--space-2`)

### Forbidden Patterns

```css
/* BANNED */
border-radius: 4px;
border: 1px solid;
background: #f0f0f0;
border-color: var(--color-gray-200);
box-shadow: 0 4px 6px rgba(0,0,0,0.1);
```

See `client/src/styles/README.md` for complete reference.

---

## Report Builder System

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                    │
├─────────────────────────────────────────────────────────────────────┤
│  ReportBuilderWizard (4 steps)                                      │
│       ├── DataSourceStep      → Select warehouse/platforms          │
│       ├── VisualizationStep   → Add KPIs + Charts                   │
│       ├── ScheduleStep        → Frequency, format, recipients       │
│       └── ReviewStep          → Preview + name + create             │
│                                                                     │
│  Visualization Components (Recharts + Win98 theme)                  │
│       ├── KPICard             → Metric with trend                   │
│       ├── ChartWrapper        → Container with loading              │
│       └── BarChart, LineChart, PieChart                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Services                                                           │
│       ├── ReportService       → Data aggregation, preview, send     │
│       ├── EmailService        → Nodemailer SMTP integration         │
│       ├── PDFService          → Puppeteer HTML→PDF                  │
│       ├── SchedulerService    → node-cron job management            │
│       └── ReportAlertService  → Threshold/trend/freshness checks    │
└─────────────────────────────────────────────────────────────────────┘
```

### Alert Types

| Type | Config Example | Trigger |
|------|----------------|---------|
| **Metric Threshold** | `{ metric: 'spend', condition: 'gt', threshold: 1000 }` | Spend > $1,000 |
| **Trend Detection** | `{ metric: 'roas', changePercent: 20, period: 'wow' }` | ROAS drops >20% WoW |
| **Data Freshness** | `{ maxHoursStale: 24, platformId: 'meta_ads' }` | No new data in 24 hours |

---

## Wizard Pattern

### Multi-Step Wizard Structure

```
┌─────────────────────────────────────┐
│  Header (h1 + subtitle, gold)       │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │ Progress Bar (1─2─3─4)          ││
│  ├─────────────────────────────────┤│
│  │ Step Content (scrollable)       ││
│  ├─────────────────────────────────┤│
│  │ Navigation: Cancel | Back | Next││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Step Component Pattern

```jsx
export default function ExampleStep({ data, onChange }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Step Title</h3>
        <p className={styles.description}>Description</p>
      </div>
      {/* Content */}
    </div>
  );
}
```

---

## PSX Sprites

```jsx
<PSXSprite sprite="hourglass" size="md" animation="spin" />
```

| Category | Sprites |
|----------|---------|
| UI | hourglass, star, coin |
| Hearts | heartRed, heartGreen, heartBlue, heartYellow |
| Tubes | tubeRed, tubeGreen, tubeBlue |
| Platform | floppy, monitor, lock, gameboy |

---

## Backend Services

### Server Initialization

```javascript
// server/index.js - Scheduler initializes BEFORE server accepts requests
async function startServer() {
  if (process.env.SCHEDULER_ENABLED !== 'false') {
    await schedulerService.init();
  }
  server = app.listen(PORT, () => { ... });
}
```

### Service Layer

| Service | Purpose |
|---------|---------|
| `supabase.js` | Database operations layer |
| `emailService.js` | SMTP email sending via Nodemailer |
| `pdfService.js` | PDF generation via Puppeteer (Win98 themed) |
| `reportService.js` | Report data aggregation and delivery |
| `reportAlertService.js` | Alert evaluation and notifications |
| `schedulerService.js` | Cron job management via node-cron |

### Middleware

```
Request → requestIdMiddleware → Routes → errorHandler
              │                              │
              └─ UUID + X-Request-ID         └─ JSON errors
```

## Authentication System

### Overview
- **Supabase Auth** with email/password sign-in
- **Invite-only** user management (admin creates users)
- **Role-based access** with global admins and per-client roles
- **RLS policies** protect all client-scoped data

### User Roles
| Role | Scope | Permissions |
|------|-------|-------------|
| **Admin** | Global | Manage users, access all clients |
| **Client Admin** | Per-client | Full access to assigned client |
| **Editor** | Per-client | Edit data for assigned client |
| **Viewer** | Per-client | Read-only access to assigned client |

### Auth Flow
```
1. User visits app → AuthContext checks Supabase session
2. No session → LoginPage shown
3. User signs in → JWT stored, app renders
4. All API requests include Authorization: Bearer <token>
5. Backend verifies JWT via middleware/auth.js
6. RLS policies filter data based on user's client assignments
```

### Local Development
```bash
# Start local Supabase
supabase start

# Get credentials
supabase status --output json

# Create .env files with credentials
# Root .env: SUPABASE_URL, SERVICE_ROLE_KEY, JWT_SECRET
# client/.env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# Create first admin user via Supabase Studio (localhost:54323)
# Then set is_admin = TRUE in user_profiles table
```

---

## Code Conventions

- Functional components (except ErrorBoundary)
- CSS Modules (`.module.css`)
- PropTypes (ESLint enforced)
- `useCallback`/`useMemo` for performance
- Centralized error handling (`next(error)`)
- Structured JSON logging with request IDs
- Accessibility: `aria-*` attributes, `role`, `htmlFor` on all form elements
- Input validation: max length, error states, character counts
