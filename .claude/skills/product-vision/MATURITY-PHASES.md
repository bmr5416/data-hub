# Maturity Phases

Product maturity stages for Data Hub, from perspective of an agency data strategy manager managing 50+ clients.

---

## Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Phase 0: MVP          Phase 1: MMP         Phase 2: MLP         Phase 3: MAP    │
│  ─────────────         ───────────         ───────────         ───────────    │
│  "It works"            "I can show         "Clients love       "Best in       │
│                        this to clients"    using this"         class"         │
│                                                                              │
│  [████████████]        [████████░░░░]      [████░░░░░░░░]      [░░░░░░░░░░░░] │
│     CURRENT               TARGET             FUTURE              VISION       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: MVP (Minimum Viable Product) — CURRENT

> **Goal:** Core functionality works for internal testing

### What Works

| Area | Status | Notes |
|------|--------|-------|
| Client CRUD | ✅ Complete | Create, edit, delete clients |
| Data Sources | ✅ Complete | Add platforms with status tracking |
| Warehouses | ✅ Complete | Create, configure schemas, store data |
| CSV Upload | ✅ Complete | Upload platform data via CSV |
| Data Blending | ✅ Complete | Cross-platform normalized metrics |
| Report Builder | ✅ Complete | 4-step wizard with KPIs + charts |
| Report Delivery | ✅ Complete | Scheduled email with PDF/CSV |
| Alerts | ✅ Complete | Threshold, trend, freshness triggers |
| Win98 Theme | ✅ Complete | Consistent styling throughout |
| Imp Assistant | ✅ Complete | Contextual tips and personality |

### MVP Gaps Identified

| Gap | Type | Impact |
|-----|------|--------|
| No onboarding flow | Feature | New users confused where to start |
| Lineage is list-only | Feature | Can't visualize dependencies |
| No global search | Feature | Hard to find things across clients |
| Inconsistent error messages | Polish | Users don't know how to recover |
| No SMTP config UI | Feature | Requires env vars to configure |
| Loading spinners only | Polish | No skeleton states |

---

## Phase 1: MMP (Minimum Marketable Product) — TARGET

> **Goal:** First version ready for client-facing use

### Agency Manager Says:
> "I need to be able to demo this to my team and onboard them without hand-holding. Errors should be self-explanatory. It should feel professional enough that I'm not embarrassed."

### Phase 1 Requirements

#### Critical (Must Ship)

| Requirement | Description | Current State |
|-------------|-------------|---------------|
| **Onboarding Flow** | Guided first-time experience: "Create client → Add source → Build warehouse → Create report" | ❌ Missing |
| **SMTP Configuration UI** | Admin panel to configure email settings | ❌ Missing (env vars only) |
| **Error Recovery** | Every error shows: what happened + how to fix it | 🔄 Inconsistent |
| **Loading Skeletons** | Content-shaped placeholders during load | ❌ Missing |
| **Empty States** | Helpful guidance when lists are empty | 🔄 Basic |
| **Form Validation** | Inline validation with clear messages | 🔄 Partial |

#### Important (Should Ship)

| Requirement | Description | Current State |
|-------------|-------------|---------------|
| **Global Search** | Find clients, sources, reports by name | ❌ Missing |
| **Keyboard Shortcuts** | Power user efficiency (Cmd+K, Esc, etc.) | ❌ Missing |
| **Breadcrumb Navigation** | Always know where you are | 🔄 Partial |
| **Confirmation Dialogs** | Confirm before destructive actions | 🔄 Partial |
| **Success Feedback** | Clear confirmation when actions complete | 🔄 Inconsistent |

#### Nice-to-Have

| Requirement | Description | Current State |
|-------------|-------------|---------------|
| **Dark/Light Toggle** | (While maintaining Win98 aesthetic) | ❌ Missing |
| **Notification Center** | Recent alerts, delivery status | ❌ Missing |
| **Quick Actions** | Common tasks from dashboard | ❌ Missing |

### Phase 1 Promotion Criteria

- [ ] New user completes onboarding without documentation
- [ ] All errors have recovery instructions
- [ ] SMTP configurable via UI
- [ ] No spinning indicators > 2 seconds without skeleton
- [ ] Zero "undefined" or cryptic error messages

---

## Phase 2: MLP (Minimum Lovable Product)

> **Goal:** Users actively enjoy and recommend the tool

### Agency Manager Says:
> "I want to clone my best client's setup for new clients. I need to see all my clients' health at a glance. When something breaks, show me the blast radius visually. I want my team to actually prefer this over spreadsheets."

### Phase 2 Requirements

#### Efficiency Features

| Requirement | Description | Rationale |
|-------------|-------------|-----------|
| **Client Templates** | Save warehouse/report config as template | "Standard e-commerce setup" → clone |
| **Bulk Import** | Upload spreadsheet → create multiple sources | Faster client onboarding |
| **Clone Client** | Duplicate entire client config | New client = copy existing |
| **Bulk Edit** | Select multiple → edit together | Update 10 reports at once |

#### Visualization Features

| Requirement | Description | Rationale |
|-------------|-------------|-----------|
| **Visual Lineage Graph** | D3.js interactive dependency map | See what breaks visually |
| **Cross-Client Dashboard** | All clients' health metrics at glance | Portfolio overview |
| **Comparison Periods** | This week vs last week auto-calculated | Standard reporting need |
| **Trend Indicators** | Up/down arrows on KPIs | Quick performance scan |

#### Power User Features

| Requirement | Description | Rationale |
|-------------|-------------|-----------|
| **Keyboard Navigation** | Full app navigation via keyboard | Speed for power users |
| **Undo/Redo** | Recover from mistakes | Safety net |
| **Favorites** | Star frequently accessed items | Quick access |
| **Recent Items** | Last 10 viewed items | Resume work easily |

#### Imp Enhancements

| Requirement | Description | Rationale |
|-------------|-------------|-----------|
| **Guided Tours** | Step-by-step feature walkthroughs | Discoverability |
| **Contextual Suggestions** | "You might want to add an alert here" | Proactive help |
| **Progress Tracking** | "You've set up 3/5 data sources" | Gamification |

### Phase 2 Promotion Criteria

- [ ] Users can clone entire client in <1 minute
- [ ] Lineage graph shows full dependency tree
- [ ] Cross-client view loads in <3 seconds
- [ ] Keyboard-only navigation is possible
- [ ] Imp provides contextual guidance on every page

---

## Phase 3: MAP (Minimum Awesome Product)

> **Goal:** Competitive feature parity, "wow" factor

### Agency Manager Says:
> "I want to give clients their own login to see reports. I need an audit trail for compliance. I want to connect this to our other tools via API. Multiple team members should be able to work simultaneously."

### Phase 3 Requirements

#### Multi-User Features

| Requirement | Description |
|-------------|-------------|
| **Role-Based Permissions** | Admin, Editor, Viewer roles |
| **Client Portal** | Clients see only their data |
| **Real-Time Collaboration** | Multiple editors, no conflicts |
| **Activity Feed** | See team's recent actions |

#### Enterprise Features

| Requirement | Description |
|-------------|-------------|
| **Audit Trail** | Full change history with who/when/what |
| **API Documentation** | Public REST API with Swagger |
| **Webhooks** | Push events to external systems |
| **SSO Integration** | Google/SAML authentication |

#### Advanced Reporting

| Requirement | Description |
|-------------|-------------|
| **White-Label Reports** | Client branding on PDFs |
| **Custom Dashboards** | User-built dashboard layouts |
| **Scheduled Snapshots** | Historical report archives |
| **Export to BI Tools** | Connect to Looker, Tableau, etc. |

#### Platform Expansion

| Requirement | Description |
|-------------|-------------|
| **Direct API Connections** | Pull from Meta/Google APIs directly |
| **More Platforms** | LinkedIn, Pinterest, Twitter, etc. |
| **Custom Connectors** | Build your own platform integration |

### Phase 3 Promotion Criteria

- [ ] Clients can log in and view their reports
- [ ] Full audit trail for last 90 days
- [ ] API supports all UI operations
- [ ] 10+ concurrent users without degradation

---

## Current Assessment

### Phase 0 → Phase 1 Gap Summary

```
BLOCKING (Must fix for Phase 1):
├── Onboarding flow .......................... Feature
├── SMTP config UI ........................... Feature
├── Error recovery messages .................. Polish
└── Loading skeletons ........................ Polish

IMPORTANT (Should fix for Phase 1):
├── Global search ............................ Feature
├── Keyboard shortcuts ....................... Feature
├── Empty state guidance ..................... Polish
└── Confirmation dialogs ..................... Polish

NICE-TO-HAVE:
├── Notification center ...................... Feature
├── Quick actions ............................ Feature
└── Dark/light toggle ........................ Polish
```

### Effort Estimates (Relative)

| Gap | Effort | Complexity |
|-----|--------|------------|
| Onboarding flow | Large | Medium |
| SMTP config UI | Medium | Low |
| Error recovery | Medium | Low |
| Loading skeletons | Medium | Low |
| Global search | Large | Medium |
| Keyboard shortcuts | Medium | Medium |

---

## Phase Transition Checklist

### To Enter Phase 1 (MMP)

```
Pre-Flight Checks:
[ ] Onboarding: New user completes setup without help
[ ] Errors: Every error has "what + how to fix"
[ ] Email: SMTP configurable via admin UI
[ ] Loading: Skeletons for all async operations
[ ] Empty: Helpful guidance when no data

Quality Gates:
[ ] No console errors in happy path
[ ] Mobile-responsive (basic)
[ ] Core flows tested manually
[ ] Documentation for common tasks
```

### To Enter Phase 2 (MLP)

```
Pre-Flight Checks:
[ ] Templates: Can clone client config
[ ] Lineage: Visual dependency graph
[ ] Portfolio: Cross-client dashboard
[ ] Keyboard: Full navigation support
[ ] Imp: Contextual help on every page

Quality Gates:
[ ] Performance: <3s page loads
[ ] E2E tests for critical paths
[ ] User testing feedback incorporated
```
