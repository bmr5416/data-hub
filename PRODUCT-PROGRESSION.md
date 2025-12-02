# Product Progression Checklist

> **Mission:** "Bring clarity to chaos."
>
> Data Hub is the all-in-one marketing data platform—warehouse, ETL, BI, and delivery unified.

This document tracks progression from MVP → MMP → MLP → MAP with mandatory validation gates.

---

## How to Use This Document

### Workflow for Each Task

```
1. Read the gap description and acceptance criteria
2. Invoke required skills before implementation
3. Implement following existing codebase patterns
4. Self-validate against checklist
5. Run validation agents for sign-off
6. Check off completed items
7. Commit with reference to gap ID
```

### Required Agent/Skill Invocations

| Action | Invoke |
|--------|--------|
| **Before CSS changes** | `Skill: win98-dungeon` |
| **Before wizard/form work** | `Skill: wizard-patterns` |
| **Before backend routes** | `Skill: supabase-patterns` |
| **Before platform schemas** | `Skill: platform-schemas` |
| **After CSS changes** | `Agent: style-validator` |
| **After significant code** | `Agent: code-reviewer` |
| **Before phase promotion** | `Agent: product-vision-reviewer` |

---

## Current State

**Phase:** MVP (Phase 0) → **MMP (Phase 1)** ← TARGET

**Last Review:** 2024-12-05
**Reviewed By:** product-vision-reviewer agent
**Overall MMP Readiness:** 85%

### Completed Gaps

#### GAP-AUTH-001: Authentication System ✅
- **Type:** Feature (Infrastructure)
- **Pillar Impact:** Automation, Accessibility, Clarity
- **Status:** ✅ Complete (2024-12-05)
- **Validated:** ✅ style-validator (A) | ✅ code-reviewer (A) | ✅ product-vision-reviewer (A-)

**Implementation:**
- Supabase Auth integration with email/password sign-in
- User profiles and client assignments tables with RLS
- Invite, edit, delete workflows in admin UI
- RLS policies on all tables
- Admin user management section in Settings page

**Files Added:**
- `client/src/lib/supabase.js`
- `client/src/contexts/AuthContext.jsx`
- `client/src/components/auth/LoginPage.jsx` + CSS
- `client/src/components/auth/AuthLoadingScreen.jsx` + CSS
- `client/src/components/admin/UserManagementSection.jsx` + CSS
- `client/src/components/admin/InviteUserModal.jsx` + CSS
- `client/src/components/admin/EditUserModal.jsx` + CSS
- `server/middleware/auth.js`
- `server/routes/admin.js`
- `supabase/migrations/20241206000001_auth_system.sql`

---

## Phase 1: MMP (Minimum Marketable Product)

> **Goal:** First version ready for client-facing use
>
> **Success Criteria:** New user can onboard, create client, add source, build warehouse, create report—without documentation or hand-holding.

### Critical Gaps (Must Fix)

#### GAP-P1-001: Client Editing UI
- **Type:** Feature
- **Pillar Impact:** Automation, Accessibility
- **Status:** ❌ Not Started

**Current State:**
- Backend: `PUT /api/clients/:id` exists (server/routes/clients.js:110)
- API: `clientsApi.update()` exists (client/src/services/api.js:66)
- UI: **No component exists**

**Acceptance Criteria:**
- [ ] `EditClientModal.jsx` component created following `AddClientModal.jsx` pattern
- [ ] Modal accessible from Dashboard client cards (Edit button)
- [ ] Modal accessible from ClientDetail header
- [ ] Form pre-populated with existing client data
- [ ] Validation matches AddClientModal
- [ ] Success feedback via toast/Imp
- [ ] Error handling with recovery instructions

**Implementation Steps:**
```
1. Invoke: Skill: wizard-patterns (for form patterns)
2. Invoke: Skill: win98-dungeon (for styling)
3. Create: client/src/components/client/EditClientModal.jsx
4. Create: client/src/components/client/EditClientModal.module.css
5. Update: client/src/pages/Dashboard.jsx (add Edit action)
6. Update: client/src/pages/ClientDetail/index.jsx (add Edit button)
7. Validate: Agent: style-validator
8. Validate: Agent: code-reviewer
```

**Files to Modify:**
- `client/src/components/client/EditClientModal.jsx` (new)
- `client/src/components/client/EditClientModal.module.css` (new)
- `client/src/pages/Dashboard.jsx`
- `client/src/pages/ClientDetail/index.jsx`

**Validated:** ☐ style-validator | ☐ code-reviewer

---

#### GAP-P1-002: Delete Confirmations
- **Type:** Polish (Consistency)
- **Pillar Impact:** Accessibility
- **Status:** ❌ Not Started

**Current State:**
- Delete buttons call `onDelete(id)` directly with no confirmation
- Affects: SourcesTab, ReportsTab, ETLTab, KPIsTab, WarehousesTab

**Acceptance Criteria:**
- [ ] All delete actions show confirmation modal before executing
- [ ] Modal uses existing Modal component
- [ ] Modal text includes entity name being deleted
- [ ] Cancel button is secondary variant
- [ ] Delete button is danger variant
- [ ] Focus returns to trigger after cancel
- [ ] Pattern consistent across all tabs

**Implementation Steps:**
```
1. Invoke: Skill: win98-dungeon (for modal styling)
2. Create: Reusable ConfirmDeleteModal component OR inline pattern
3. Update: client/src/pages/ClientDetail/tabs/SourcesTab.jsx
4. Update: client/src/pages/ClientDetail/tabs/ReportsTab.jsx
5. Update: client/src/pages/ClientDetail/tabs/ETLTab.jsx
6. Update: client/src/pages/ClientDetail/tabs/KPIsTab.jsx
7. Update: client/src/pages/ClientDetail/tabs/WarehousesTab.jsx
8. Validate: Agent: code-reviewer
```

**Files to Modify:**
- `client/src/components/common/ConfirmDeleteModal.jsx` (new, optional)
- `client/src/pages/ClientDetail/tabs/SourcesTab.jsx`
- `client/src/pages/ClientDetail/tabs/ReportsTab.jsx`
- `client/src/pages/ClientDetail/tabs/ETLTab.jsx`
- `client/src/pages/ClientDetail/tabs/KPIsTab.jsx`
- `client/src/pages/ClientDetail/tabs/WarehousesTab.jsx`

**Validated:** ☐ style-validator | ☐ code-reviewer

---

#### GAP-P1-003: Onboarding Flow
- **Type:** Feature
- **Pillar Impact:** Accessibility, Clarity
- **Status:** ❌ Not Started

**Current State:**
- New users land on empty Dashboard with no guidance
- No detection of first-time user state
- No guided flow through: Client → Source → Warehouse → Report

**Acceptance Criteria:**
- [ ] First-time user detection (no clients exist OR localStorage flag)
- [ ] Welcome modal/wizard appears on first visit
- [ ] Guided steps: Create Client → Add Source → Build Warehouse → Create Report
- [ ] Progress tracked visually
- [ ] Can be dismissed and resumed
- [ ] Imp assistant provides contextual guidance
- [ ] Completion celebration

**Implementation Steps:**
```
1. Invoke: Skill: wizard-patterns (for multi-step flow)
2. Invoke: Skill: win98-dungeon (for styling)
3. Create: client/src/components/onboarding/OnboardingWizard.jsx
4. Create: client/src/components/onboarding/OnboardingWizard.module.css
5. Create: client/src/components/onboarding/steps/ (welcome, progress, complete)
6. Update: client/src/App.jsx (detect first-time, render wizard)
7. Update: client/src/contexts/ImpContext.jsx (onboarding tips)
8. Validate: Agent: style-validator
9. Validate: Agent: code-reviewer
```

**Files to Create:**
- `client/src/components/onboarding/OnboardingWizard.jsx`
- `client/src/components/onboarding/OnboardingWizard.module.css`
- `client/src/components/onboarding/steps/WelcomeStep.jsx`
- `client/src/components/onboarding/steps/ProgressStep.jsx`
- `client/src/components/onboarding/steps/CompleteStep.jsx`

**Validated:** ☐ style-validator | ☐ code-reviewer

---

#### GAP-P1-004: SMTP Configuration UI
- **Type:** Feature
- **Pillar Impact:** Automation
- **Status:** ❌ Not Started

**Current State:**
- SMTP configured via environment variables only
- Backend: GET/PUT `/api/smtp/config` exists (server/routes/smtp.js)
- No admin UI to configure

**Acceptance Criteria:**
- [ ] Settings page or modal for SMTP configuration
- [ ] Fields: Host, Port, User, Password (masked), From Email
- [ ] Test Connection button
- [ ] Success/failure feedback
- [ ] Secure handling (password not exposed in GET)
- [ ] Only accessible to authenticated users

**Implementation Steps:**
```
1. Invoke: Skill: win98-dungeon (for form styling)
2. Invoke: Skill: supabase-patterns (for API patterns)
3. Create: client/src/pages/Settings.jsx (or Settings modal)
4. Create: client/src/components/settings/SMTPConfig.jsx
5. Create: client/src/components/settings/SMTPConfig.module.css
6. Add: Route to Settings in Layout sidebar
7. Validate: Agent: style-validator
8. Validate: Agent: code-reviewer
```

**Validated:** ☐ style-validator | ☐ code-reviewer

---

#### GAP-P1-005: Error Messages with Recovery
- **Type:** Polish
- **Pillar Impact:** Accessibility
- **Status:** 🔄 Partial

**Current State:**
- Mix of generic ("Something went wrong") and specific errors
- Not all errors include recovery instructions
- ErrorMessage component exists but inconsistently used

**Acceptance Criteria:**
- [ ] All API errors caught and displayed with ErrorMessage component
- [ ] Every error shows: What happened + How to fix it
- [ ] Retry button where applicable
- [ ] Contact support fallback for unrecoverable errors
- [ ] No "undefined" or raw error objects shown

**Implementation Steps:**
```
1. Audit: Grep for catch blocks and error handling
2. Update: client/src/services/api.js (standardize error format)
3. Update: All components using try/catch to use ErrorMessage
4. Create: Error message content guide for common errors
5. Validate: Agent: code-reviewer
```

**Validated:** ☐ code-reviewer

---

#### GAP-P1-006: Loading Skeletons
- **Type:** Polish
- **Pillar Impact:** Delight
- **Status:** ❌ Not Started

**Current State:**
- Loading states show LoadingAnimation (spinner + messages)
- No content-shaped skeleton placeholders
- Long loads feel uncertain

**Acceptance Criteria:**
- [ ] Skeleton component created following Win98 aesthetic
- [ ] Dashboard shows client card skeletons while loading
- [ ] ClientDetail shows tab content skeletons
- [ ] Tables show row skeletons
- [ ] Forms show field skeletons
- [ ] Skeletons match actual content dimensions

**Implementation Steps:**
```
1. Invoke: Skill: win98-dungeon (for skeleton styling)
2. Create: client/src/components/common/Skeleton.jsx
3. Create: client/src/components/common/Skeleton.module.css
4. Update: client/src/pages/Dashboard.jsx (use skeletons)
5. Update: client/src/pages/ClientDetail/index.jsx
6. Validate: Agent: style-validator
```

**Validated:** ☐ style-validator | ☐ code-reviewer

---

### Important Gaps (Should Fix)

#### GAP-P1-007: Dashboard Search/Filter
- **Type:** Feature
- **Pillar Impact:** Clarity
- **Status:** ❌ Not Started

**Acceptance Criteria:**
- [ ] Search input filters clients by name/email
- [ ] Status filter dropdown (All, Active, Inactive, Onboarding)
- [ ] Clear filters button
- [ ] Empty state when no matches
- [ ] Debounced search (300ms)

**Implementation Steps:**
```
1. Invoke: Skill: win98-dungeon
2. Update: client/src/pages/Dashboard.jsx
3. Add: Search input + filter dropdown above client grid
4. Add: useMemo for filtered clients
5. Validate: Agent: style-validator
```

**Validated:** ☐ style-validator | ☐ code-reviewer

---

#### GAP-P1-008: Imp Integration on Dashboard
- **Type:** Delight
- **Pillar Impact:** Delight, Accessibility
- **Status:** ❌ Not Started

**Acceptance Criteria:**
- [ ] Imp appears on Dashboard with contextual tips
- [ ] Tips vary based on state (empty, has clients, first visit)
- [ ] Uses existing impTips.js data
- [ ] Non-intrusive (30% chance to show)

**Implementation Steps:**
```
1. Update: client/src/pages/Dashboard.jsx
2. Add: useImpTip hook integration
3. Add: Context-aware tip selection
4. Validate: Agent: code-reviewer
```

**Validated:** ☐ code-reviewer

---

### Nice-to-Have Gaps

#### GAP-P1-009: Dashboard Sort Controls
- **Status:** ❌ Not Started
- **Effort:** Low

#### GAP-P1-010: First Client Celebration
- **Status:** ❌ Not Started
- **Effort:** Low

#### GAP-P1-011: Enhanced Empty States
- **Status:** ❌ Not Started
- **Effort:** Low

---

## Phase 1 Validation Gate

Before proceeding to Phase 2, ALL of the following must pass:

### Functional Validation
```
[ ] New user completes full onboarding flow without help
[ ] All CRUD operations work for all entities
[ ] All delete actions have confirmation dialogs
[ ] SMTP is configurable via UI
[ ] Reports can be scheduled and delivered
```

### Agent Sign-offs

#### 1. Style Validator Sign-off
```bash
# Run style-validator agent on all changed CSS
# Command: Use Agent: style-validator

Expected output:
- Violations Found: 0
- All border-radius: 0
- All borders: 2px solid
- All colors from tokens
```

**Sign-off:** ☐ Passed | Date: ______ | Violations: ______

#### 2. Code Reviewer Sign-off
```bash
# Run code-reviewer agent on all changed files
# Command: Use Agent: code-reviewer

Expected output:
- Critical Issues: 0
- Overall: PASS
```

**Sign-off:** ☐ Passed | Date: ______ | Issues: ______

#### 3. Product Vision Reviewer Sign-off
```bash
# Run full codebase review
# Command: Use Agent: product-vision-reviewer
# Target: Phase 1 (MMP)

Expected output:
- Critical Gaps: 0
- Important Gaps: ≤3 (documented for Phase 2)
- MMP Readiness: ≥95%
```

**Sign-off:** ☐ Passed | Date: ______ | Readiness: ______%

### Manual Testing Checklist
```
[ ] Create new client → success feedback shown
[ ] Edit client → changes persist
[ ] Delete client → confirmation shown → client removed
[ ] Add data source → wizard completes
[ ] Create warehouse → preview shows correct schema
[ ] Build report → KPIs and charts render
[ ] Schedule report → confirmation shown
[ ] Send test email → email received
[ ] Trigger alert → alert fires correctly
[ ] Error handling → all errors show recovery instructions
```

### Phase 1 Complete
- [ ] All critical gaps resolved
- [ ] All agent sign-offs passed
- [ ] Manual testing passed
- [ ] **APPROVED FOR PHASE 2**

**Approval Date:** ____________
**Approved By:** ____________

---

## Phase 2: MLP (Minimum Lovable Product)

> **Goal:** Users actively enjoy and recommend the tool
>
> **Unlock Criteria:** Phase 1 complete with all sign-offs

### Phase 2 Gaps (Preview)

| ID | Gap | Type | Priority |
|----|-----|------|----------|
| GAP-P2-001 | Visual Lineage Graph (D3.js) | Feature | High |
| GAP-P2-002 | Client Templates/Cloning | Feature | High |
| GAP-P2-003 | Cross-Client Dashboard | Feature | High |
| GAP-P2-004 | Bulk Import from CSV | Feature | Medium |
| GAP-P2-005 | Keyboard Navigation | Feature | Medium |
| GAP-P2-006 | Undo/Redo | Feature | Medium |
| GAP-P2-007 | Favorites/Recent Items | Feature | Low |
| GAP-P2-008 | Imp Guided Tours | Delight | Medium |
| GAP-P2-009 | Comparison Time Periods | Feature | Medium |

### Phase 2 Validation Gate

```
[ ] All Phase 2 critical gaps resolved
[ ] Agent: style-validator → PASS
[ ] Agent: code-reviewer → PASS
[ ] Agent: product-vision-reviewer → MLP Readiness ≥95%
[ ] User testing feedback incorporated
[ ] Performance: <3s page loads
```

---

## Phase 3: MAP (Minimum Awesome Product)

> **Goal:** Competitive feature parity, "wow" factor
>
> **Unlock Criteria:** Phase 2 complete with all sign-offs

### Phase 3 Gaps (Preview)

| ID | Gap | Type |
|----|-----|------|
| GAP-P3-001 | Role-Based Permissions | Feature |
| GAP-P3-002 | Client Portal (View-Only) | Feature |
| GAP-P3-003 | Audit Trail / Change History | Feature |
| GAP-P3-004 | Public API + Swagger Docs | Feature |
| GAP-P3-005 | Webhooks | Feature |
| GAP-P3-006 | White-Label Reports | Feature |
| GAP-P3-007 | SSO Integration | Feature |
| GAP-P3-008 | Direct Platform API Connections | Feature |

---

## Agent Invocation Reference

### style-validator
**When:** After ANY CSS or `.module.css` changes

```
Invoke: Agent: style-validator

Validates:
- border-radius: 0 (no rounded corners)
- border: 2px solid (no 1px borders)
- Semantic color tokens (no hardcoded hex)
- Win98 border system usage
- Form spacing hierarchy
```

### code-reviewer
**When:** After significant code changes or new features

```
Invoke: Agent: code-reviewer
Skills used: win98-dungeon, supabase-patterns

Validates:
- React patterns (PropTypes, CSS Modules, hooks)
- Express patterns (RESTful, error handling, validation)
- No hardcoded values
- Code quality (unused imports, console.logs)
```

### product-vision-reviewer
**When:** Before phase promotion, monthly progress checks

```
Invoke: Agent: product-vision-reviewer
Skills used: product-vision, win98-dungeon

Validates:
- Mission pillar alignment (Clarity, Automation, Accessibility, Delight)
- Phase requirements completeness
- Gap identification and prioritization
- UX consistency
```

---

## Skill Invocation Reference

### win98-dungeon
**When:** Before ANY styling work

```
Invoke: Skill: win98-dungeon

Provides:
- Design token reference
- Component patterns (Modal, Button, Card, Form)
- 3D border system (raised, inset, pressed)
- Form spacing hierarchy (24px/16px/8px)
- Forbidden patterns list
```

### wizard-patterns
**When:** Building multi-step flows or forms

```
Invoke: Skill: wizard-patterns

Provides:
- Wizard container pattern
- Step component template
- Navigation patterns
- Validation patterns
- State management
```

### supabase-patterns
**When:** Backend route or service work

```
Invoke: Skill: supabase-patterns

Provides:
- RESTful route conventions
- Service layer patterns
- Error handling patterns
- Query patterns
```

### platform-schemas
**When:** Working with platform data fields

```
Invoke: Skill: platform-schemas

Provides:
- Meta Ads, Google Ads, TikTok Ads field schemas
- GA4, Shopify field schemas
- Field mapping patterns
```

### product-vision
**When:** Planning features or prioritizing work

```
Invoke: Skill: product-vision

Provides:
- Mission statement and pillars
- Maturity phase definitions
- Gap categorization framework
- Prioritization criteria
```

---

## Commit Message Convention

Reference gap IDs in commits:

```
feat(client): add EditClientModal component

Implements GAP-P1-001 (Client Editing UI)
- Create EditClientModal following AddClientModal pattern
- Add Edit button to Dashboard client cards
- Add Edit button to ClientDetail header

Validated: style-validator ✓, code-reviewer ✓
```

---

## Progress Tracking

| Phase | Status | Readiness | Last Review |
|-------|--------|-----------|-------------|
| Phase 0 (MVP) | ✅ Complete | 100% | — |
| Phase 1 (MMP) | 🔄 In Progress | 70% | 2024-12-04 |
| Phase 2 (MLP) | ⏳ Pending | — | — |
| Phase 3 (MAP) | ⏳ Pending | — | — |

---

*This document is the source of truth for product progression. Update after each implementation and validation cycle.*
