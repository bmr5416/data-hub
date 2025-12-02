# Product Showcase Landing Page Plan

## Overview

Create a public-facing product showcase page at `/` with a demo video and mission-driven copy. Login redirects authenticated users to `/dashboard`.

**Key Decisions:**
- Route: Root path (`/`) for landing, `/dashboard` for authenticated app
- Video: Playwright built-in `recordVideo` (already in project)
- Copy: Mission-driven ("Bring clarity to chaos")
- Demo: Core features highlight (2-3 min): Dashboard, Source Wizard, Report Builder

---

## Architecture Changes

### Current Flow
```
/ → Auth guard → isAuthenticated ? Routes : LoginPage
```

### New Flow
```
/           → LandingPage (public)
/login      → LoginPage (public)
/dashboard  → Layout + Dashboard (protected)
/clients/*  → Layout + ClientDetail (protected)
/settings   → Layout + Settings (protected)
```

---

## Implementation Steps

### Phase 1: Routing Restructure

**File: `client/src/App.jsx`**

```jsx
function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
      } />

      {/* Protected routes */}
      {isAuthenticated ? (
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          {/* ... other routes */}
        </Route>
      ) : (
        <Route path="/dashboard/*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
```

**Files to modify:**
- `client/src/App.jsx` - Restructure routes
- `client/src/components/common/Layout.jsx` - Update logo link to `/dashboard`

---

### Phase 2: Landing Page Component

**New files:**
- `client/src/pages/LandingPage.jsx`
- `client/src/pages/LandingPage.module.css`

**Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Logo + "Sign In" button (right-aligned)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HERO SECTION                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PSX Sprites (decorative)                               │   │
│  │                                                         │   │
│  │  "Bring clarity to chaos."                              │   │
│  │  (gold, --font-display, text-shadow)                    │   │
│  │                                                         │   │
│  │  "All-in-one marketing data platform for agencies"      │   │
│  │  (--font-ui, --color-text-secondary)                    │   │
│  │                                                         │   │
│  │  [Get Started] [Watch Demo]                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  VIDEO DEMO SECTION                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  <video> element with Win98-styled border               │   │
│  │  Poster frame + controls                                │   │
│  │  Hosted: /assets/demo/data-hub-demo.mp4                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FEATURES GRID (3 columns)                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ floppy sprite│ │monitor sprite│ │ star sprite  │            │
│  │ Data         │ │ Automated    │ │ Visual       │            │
│  │ Warehouse    │ │ Reports      │ │ Analytics    │            │
│  │ description  │ │ description  │ │ description  │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ tube sprite  │ │ lock sprite  │ │ coin sprite  │            │
│  │ Smart        │ │ Full         │ │ Multiple     │            │
│  │ Alerts       │ │ Lineage      │ │ Platforms    │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CTA SECTION                                                    │
│  "Ready to bring clarity to your data?"                         │
│  [Sign In to Get Started]                                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER: "Data Hub" | Win98 dungeon aesthetic                   │
└─────────────────────────────────────────────────────────────────┘
```

**Copy Content:**

| Section | Content |
|---------|---------|
| **Tagline** | "Bring clarity to chaos." |
| **Subtitle** | "All-in-one marketing data platform for agencies—warehouse, ETL, BI, and delivery unified." |
| **Feature 1** | **Data Warehouse** - Platform-specific tables with normalized schemas for Meta, Google, TikTok, GA4, and Shopify |
| **Feature 2** | **Automated Reports** - Scheduled PDF/CSV delivery via email with professional formatting |
| **Feature 3** | **Visual Analytics** - KPI cards and charts that bring your data to life |
| **Feature 4** | **Smart Alerts** - Threshold, trend, and freshness monitoring that catches issues before they become problems |
| **Feature 5** | **Full Lineage** - Answer "if X breaks, what reports fail?" in under 30 seconds |
| **Feature 6** | **Multi-Platform** - Meta Ads, Google Ads, TikTok Ads, GA4, Shopify, and custom sources |

---

### Phase 3: Demo Video Generation

**Approach: Playwright Script with Built-in Recording**

Since Playwright is already in the project (`tests/` directory), we can create a dedicated demo recording script.

**New files:**
- `scripts/record-demo.js` - Playwright script to record demo
- `client/public/assets/demo/` - Directory for video assets

**Script: `scripts/record-demo.js`**
```javascript
const { chromium } = require('playwright');

async function recordDemo() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: {
      dir: 'client/public/assets/demo/',
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Flow 1: Login and Dashboard overview
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'demo@example.com');
  await page.fill('#password', 'demopassword');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.waitForTimeout(2000); // Pause to show dashboard

  // Flow 2: Add Source Wizard (first few steps)
  await page.click('text=Add Source');
  await page.waitForTimeout(1500);
  await page.click('[data-platform="meta_ads"]');
  await page.waitForTimeout(1500);
  // ... continue through key steps

  // Flow 3: Report Builder preview
  // ...

  await context.close();
  await browser.close();

  console.log('Demo video saved to client/public/assets/demo/');
}

recordDemo();
```

**npm script addition to `package.json`:**
```json
{
  "scripts": {
    "record:demo": "node scripts/record-demo.js"
  }
}
```

**Post-processing (optional):**
- Use ffmpeg to trim/combine clips
- Add fade transitions between sections
- Compress for web: `ffmpeg -i input.webm -c:v libx264 -crf 23 -preset medium output.mp4`

---

### Phase 4: Styling (Win98 Dungeon Theme)

**LandingPage.module.css patterns:**

```css
/* Full-page layout without sidebar */
.container {
  min-height: 100vh;
  background: var(--texture-main);
  background-color: var(--color-bg-primary);
}

/* Header with login button */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-bottom: 2px solid;
  border-color: var(--win98-raised-border);
  background: var(--color-bg-secondary);
}

/* Hero section */
.hero {
  text-align: center;
  padding: var(--space-10) var(--space-6);
}

.tagline {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  color: var(--color-primary);
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
  margin-bottom: var(--space-4);
}

/* Video container with Win98 border */
.videoSection {
  padding: var(--space-8) var(--space-6);
  display: flex;
  justify-content: center;
}

.videoWrapper {
  max-width: 900px;
  width: 100%;
  border: 2px solid;
  border-color: var(--win98-inset-border);
  box-shadow: var(--win98-inset-shadow);
  background: #000;
}

.video {
  width: 100%;
  display: block;
}

/* Features grid */
.featuresGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
  padding: var(--space-8) var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

.featureCard {
  background: var(--color-bg-primary);
  border: 2px solid;
  border-color: var(--win98-raised-border);
  box-shadow: var(--win98-raised-shadow);
  padding: var(--space-5);
  text-align: center;
}
```

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `client/src/pages/LandingPage.jsx` | Public landing page component |
| `client/src/pages/LandingPage.module.css` | Landing page styles |
| `scripts/record-demo.js` | Playwright demo recording script |
| `client/public/assets/demo/data-hub-demo.mp4` | Demo video file |

### Modified Files
| File | Changes |
|------|---------|
| `client/src/App.jsx` | Restructure routes for public/protected split |
| `client/src/components/common/Layout.jsx` | Update logo link to `/dashboard` |
| `client/src/components/auth/LoginPage.jsx` | Add redirect to `/dashboard` on success |
| `package.json` | Add `record:demo` script |

---

## Validation Checklist

- [ ] Landing page accessible without authentication at `/`
- [ ] Login button navigates to `/login`
- [ ] Authenticated users redirected from `/login` to `/dashboard`
- [ ] Video plays correctly with controls
- [ ] All PSX sprites render and animate
- [ ] Win98 dungeon theme applied correctly (no rounded corners, 2px borders)
- [ ] Mobile responsive layout
- [ ] style-validator passes
- [ ] code-reviewer passes

---

## Demo Recording Steps (Manual)

1. Start dev server: `npm run dev`
2. Ensure test user exists in Supabase
3. Run recording: `npm run record:demo`
4. Review output in `client/public/assets/demo/`
5. (Optional) Post-process with ffmpeg for polish
6. Test video playback on landing page
