# Win98 Dungeon Design System

This is the **permanent** design system for Data Hub. All components must use these tokens.
There is no "fun mode" toggle - Win98 dungeon styling is always on.

> See also: `CLAUDE.md` → "Styling System" section for visual architecture diagrams and layout patterns.

---

## Token Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DESIGN TOKENS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─── TYPOGRAPHY ──────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │   --font-display    "Press Start 2P"     Headings (h1, h2, h3)      │   │
│  │   --font-ui         "Silkscreen"         Labels, buttons, UI text   │   │
│  │   --font-family     "VT323"              Body text                  │   │
│  │   --font-mono       "SF Mono"            Code blocks                │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── COLORS ──────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │   PRIMARY:          #FFD700 (Gold)       Accents, active states     │   │
│  │   BG-PRIMARY:       #3A3A5C (Stone)      Cards, modals, UI panels   │   │
│  │   BG-SECONDARY:     #2D1B4E (Purple)     Page background, overlays  │   │
│  │   BUTTON-BG:        #5A5A7C (Light)      Button backgrounds         │   │
│  │   TEXT-PRIMARY:     #FFECD6 (Parchment)  Main text color            │   │
│  │   TEXT-SECONDARY:   #C4B4A8 (Muted)      Subtitles, hints           │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── WIN98 3D BORDER SYSTEM ──────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │   RAISED (buttons, cards, nav items - default state):               │   │
│  │   ┌──────────────────┐                                              │   │
│  │   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← --win98-border-light (top/left)           │   │
│  │   │▓                ░│                                              │   │
│  │   │▓    CONTENT     ░│                                              │   │
│  │   │▓                ░│                                              │   │
│  │   │░░░░░░░░░░░░░░░░░░│ ← --win98-border-dark (bottom/right)         │   │
│  │   └──────────────────┘                                              │   │
│  │   Use: border-color: var(--win98-raised-border);                    │   │
│  │        box-shadow: var(--win98-raised-shadow);                      │   │
│  │                                                                      │   │
│  │   PRESSED (active buttons, selected tabs):                          │   │
│  │   ┌──────────────────┐                                              │   │
│  │   │░░░░░░░░░░░░░░░░░░│ ← --win98-border-dark (top/left)             │   │
│  │   │░                ▓│                                              │   │
│  │   │░    CONTENT     ▓│                                              │   │
│  │   │░                ▓│                                              │   │
│  │   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← --win98-border-light (bottom/right)        │   │
│  │   └──────────────────┘                                              │   │
│  │   Use: border-color: var(--win98-pressed-border);                   │   │
│  │        box-shadow: var(--win98-pressed-shadow);                     │   │
│  │                                                                      │   │
│  │   INSET (form inputs, text areas, wells):                           │   │
│  │   ┌──────────────────┐                                              │   │
│  │   │░░░░░░░░░░░░░░░░░░│ ← Sunken/carved effect                       │   │
│  │   │░ ┌────────────┐ ▓│                                              │   │
│  │   │░ │   INPUT    │ ▓│   background: var(--win98-form-bg)           │   │
│  │   │░ └────────────┘ ▓│                                              │   │
│  │   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│                                              │   │
│  │   └──────────────────┘                                              │   │
│  │   Use: border-color: var(--win98-inset-border);                     │   │
│  │        box-shadow: var(--win98-inset-shadow);                       │   │
│  │        background: var(--win98-form-bg);                            │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── TEXTURES ────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │   --texture-main     Scanlines + gradient      Page backgrounds     │   │
│  │   --texture-sidebar  Diagonal stripes          Sidebar background   │   │
│  │   --texture-card     Subtle gradient           Card/modal content   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── SPACING ─────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │   --space-1: 4px    --space-4: 16px    --space-8: 48px              │   │
│  │   --space-2: 8px    --space-5: 24px    --space-10: 64px             │   │
│  │   --space-3: 12px   --space-6: 32px                                 │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── CRITICAL: BORDER RADIUS ─────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │   ALL radius tokens are 0. NO ROUNDED CORNERS. EVER.                │   │
│  │                                                                      │   │
│  │   --radius-sm: 0                                                    │   │
│  │   --radius-md: 0                                                    │   │
│  │   --radius-lg: 0                                                    │   │
│  │   --radius-xl: 0                                                    │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Strict Rules

### 1. NO ROUNDED CORNERS

```css
/* WRONG */
border-radius: var(--radius-md);
border-radius: 8px;
border-radius: 0.5rem;

/* CORRECT */
border-radius: 0;
```

### 2. ALL BORDERS ARE 2px SOLID

```css
/* WRONG */
border: 1px solid var(--color-gray-300);
border: 1px solid #ccc;

/* CORRECT */
border: 2px solid;
border-color: var(--win98-raised-border);  /* or inset/pressed */
```

### 3. USE SEMANTIC TOKENS ONLY

```css
/* WRONG - hardcoded colors */
background: #f5f5f5;
color: #333;
border-color: #ccc;

/* CORRECT - semantic tokens */
background: var(--color-bg-primary);
color: var(--color-text-primary);
border-color: var(--win98-raised-border);
```

### 4. USE CORRECT FONT TOKENS

```css
/* Labels, buttons, UI elements */
font-family: var(--font-ui);

/* Headings (h1, h2, h3) */
font-family: var(--font-display);

/* Body text, paragraphs */
font-family: var(--font-family);
```

### 5. HEADERS USE GOLD COLOR + TEXT SHADOW

```css
.title {
  font-family: var(--font-ui);
  color: var(--color-primary);        /* Gold */
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}
```

### 6. SEPARATORS ARE 2px DARK BORDERS

```css
/* WRONG */
border-bottom: 1px solid var(--color-gray-200);
border-top: 1px solid #eee;

/* CORRECT */
border-bottom: 2px solid var(--win98-border-dark);
border-top: 2px solid var(--win98-border-dark);
```

---

## Form Spacing Hierarchy (Standardized)

Use this hierarchy for ALL modal forms, wizard steps, and form layouts:

| Context | Token | Value | Purpose |
|---------|-------|-------|---------|
| Between sections | `--space-5` | 24px | Major content separation |
| Within sections | `--space-4` | 16px | Field-to-field spacing |
| Label to input | `--space-2` | 8px | Tight label association |
| Section padding | `--space-4` | 16px | Internal content padding |

### Visual Structure

```
modalContent (gap: 24px - --space-5)
  └── formSection (padding: 16px, gap: 16px - --space-4)
        ├── sectionTitle (margin: 0)
        ├── formField (gap: 8px - --space-2)
        │     ├── label
        │     └── input
        └── formField (gap: 8px - --space-2)
              ├── label
              └── select
```

### CSS Pattern

```css
/* Modal/Wizard content container */
.modalContent {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);  /* 24px - between sections */
  padding: var(--space-4);
}

/* Form section (grouped fields) */
.formSection {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);  /* 16px - between fields */
  /* Win98 inset styling */
  background: var(--color-bg-secondary);
  border: 2px solid;
  border-color: var(--win98-inset-border);
  box-shadow: var(--win98-inset-shadow);
  border-radius: 0;
}

/* Section title - NO MARGIN (parent gap handles spacing) */
.sectionTitle {
  margin: 0;
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--win98-border-dark);
}

/* Form field (label + input pair) */
.formField {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);  /* 8px - tight label association */
}
```

### Forbidden Spacing Patterns

```css
/* WRONG - too tight for label-input */
.formField { gap: var(--space-1); }  /* 4px is too tight */

/* WRONG - arbitrary spacing */
.section { gap: 10px; }  /* Use tokens, not arbitrary px */

/* WRONG - double spacing */
.sectionTitle { margin-bottom: var(--space-3); }  /* Creates double-gap */
```

---

## Component Patterns

### Modal

```css
.modal {
  background: var(--color-bg-primary);
  background-image: var(--texture-card);
  border-radius: 0;
  border: 2px solid;
  border-color: var(--win98-raised-border);
  box-shadow: var(--win98-raised-shadow), var(--shadow-lg);
}

.header {
  padding: var(--space-4) var(--space-5);
  border-bottom: 2px solid var(--win98-border-dark);
}

.footer {
  padding: var(--space-4) var(--space-5);
  border-top: 2px solid var(--win98-border-dark);
}
```

### Form Field

```css
.field label {
  font-family: var(--font-ui);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 2px solid;
  border-color: var(--win98-inset-border);
  box-shadow: var(--win98-inset-shadow);
  background: var(--win98-form-bg);
  border-radius: 0;
  font-family: var(--font-ui);
  color: var(--color-text-primary);
}

.field input:focus {
  outline: none;
  border-color: var(--color-primary);
}
```

### Button

```css
.button {
  background: var(--color-button-bg);
  border: 2px solid;
  border-color: var(--win98-raised-border);
  box-shadow: var(--win98-raised-shadow);
  border-radius: 0;
  font-family: var(--font-ui);
  color: var(--color-button-text);
  padding: var(--space-2) var(--space-4);
}

.button:active {
  border-color: var(--win98-pressed-border);
  box-shadow: var(--win98-pressed-shadow);
}
```

### Card

```css
.card {
  background: var(--color-bg-primary);
  background-image: var(--texture-card);
  border: 2px solid;
  border-color: var(--win98-raised-border);
  box-shadow: var(--win98-raised-shadow);
  border-radius: 0;
}
```

---

## Forbidden Patterns

These patterns are **BANNED** from the codebase:

```css
/* NO fun-mode toggles */
:global([data-fun-mode="true"]) .element { }

/* NO modern shadows */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
box-shadow: 0 0 0 3px var(--color-primary-light);

/* NO rounded anything */
border-radius: var(--radius-md);
border-radius: 4px;

/* NO thin borders */
border: 1px solid;

/* NO hardcoded colors */
background: #f0f0f0;
color: #333333;
border-color: #cccccc;

/* NO modern gray tokens for borders */
border-color: var(--color-gray-200);
border-color: var(--color-gray-300);
```

---

## Quick Reference

| Element        | Background              | Border                       | Font             |
|----------------|-------------------------|------------------------------|------------------|
| Modal          | `--color-bg-primary`    | `--win98-raised-border`      | (varies)         |
| Card           | `--color-bg-primary`    | `--win98-raised-border`      | (varies)         |
| Form input     | `--win98-form-bg`       | `--win98-inset-border`       | `--font-ui`      |
| Button         | `--color-button-bg`     | `--win98-raised-border`      | `--font-ui`      |
| Button:active  | `--color-button-bg`     | `--win98-pressed-border`     | `--font-ui`      |
| Header/Footer  | (inherit)               | `--win98-border-dark` (sep)  | (varies)         |
| Title          | -                       | -                            | `--font-ui`      |
| Body text      | -                       | -                            | `--font-family`  |
| Heading        | -                       | -                            | `--font-display` |

---

## File: index.css

The single source of truth for all design tokens. Import via Vite's CSS handling.
All tokens defined in `:root` are globally available.
