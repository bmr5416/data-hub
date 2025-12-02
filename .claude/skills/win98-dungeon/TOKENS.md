# Design Tokens Reference

All tokens defined in `client/src/styles/index.css`.

## Typography

```css
--font-family: "VT323", monospace;     /* Body text */
--font-display: "Press Start 2P";      /* Headings h1-h3 */
--font-ui: "Silkscreen", monospace;    /* Labels, buttons */
--font-mono: "SF Mono", monospace;     /* Code blocks */
```

### Sizes
```css
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
```

## Colors

### Primary (Gold Theme)
```css
--color-primary: #FFD700;        /* Gold - accents, active states */
--color-primary-dark: #E5C100;   /* Darker gold */
--color-primary-light: #FFAA5E;  /* Orange/light gold */
```

### Backgrounds
```css
--color-bg-primary: #3A3A5C;     /* Cards, modals, panels */
--color-bg-secondary: #2D1B4E;   /* Page background, overlays */
--color-bg-hover: #4A4A6C;       /* Hover states */
```

### Text
```css
--color-text-primary: #FFECD6;   /* Main text (parchment) */
--color-text-secondary: #C4B4A8; /* Subtitles, hints */
--color-text-muted: #B8A89C;     /* Muted text */
--color-text-disabled: #9A8A7E;  /* Disabled states */
--color-text-placeholder: #8D697A; /* Placeholders */
```

### Semantic
```css
--color-success: #30A46C;
--color-error: #E23D28;
--color-warning: #FFAA5E;
--color-info: #00BBF9;
```

### UI Elements
```css
--color-button-bg: #5A5A7C;
--color-button-text: #FFECD6;
--color-button-hover: #6A6A8C;
--color-link: #00BBF9;
```

## Win98 Border System

### Base Colors
```css
--win98-bg: #3A3A5C;
--win98-border-light: #5A5A7C;
--win98-border-dark: #2D1B4E;
--win98-border-darker: #1A1A2E;
--win98-border-lighter: #4A4A6C;
```

### Raised Effect (buttons, cards, nav)
```css
border: 2px solid;
border-color: var(--win98-raised-border);
box-shadow: var(--win98-raised-shadow);
```
Visual: Light top/left, dark bottom/right

### Pressed Effect (active states)
```css
border: 2px solid;
border-color: var(--win98-pressed-border);
box-shadow: var(--win98-pressed-shadow);
```
Visual: Dark top/left, light bottom/right

### Inset Effect (inputs, wells)
```css
border: 2px solid;
border-color: var(--win98-inset-border);
box-shadow: var(--win98-inset-shadow);
background: var(--win98-form-bg);
```
Visual: Sunken/carved appearance

## Spacing

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-8: 48px;
--space-10: 64px;
```

### Form Spacing Hierarchy (Standardized)

Use this hierarchy for ALL modal forms, wizard steps, and form layouts:

| Context | Token | Value | Purpose |
|---------|-------|-------|---------|
| Between sections | `--space-5` | 24px | Major content separation |
| Within sections | `--space-4` | 16px | Field-to-field spacing |
| Label to input | `--space-2` | 8px | Tight label association |
| Section padding | `--space-4` | 16px | Internal content padding |

```
Content Container (gap: 24px)
  └── Section (padding: 16px, internal gap: 16px)
        ├── Section Title (margin: 0, use parent gap)
        ├── Form Field (gap: 8px)
        │     ├── label
        │     └── input
        └── Form Field (gap: 8px)
              ├── label
              └── select
```

## Radius (ALL ZERO)

```css
--radius-sm: 0;
--radius-md: 0;
--radius-lg: 0;
--radius-xl: 0;
/* Only --radius-full: 9999px exists for circles */
```

## Shadows

```css
--shadow-sm: 2px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-md: 4px 4px 0 rgba(0, 0, 0, 0.4);
--shadow-lg: 6px 6px 0 rgba(0, 0, 0, 0.5);
```

## Textures

```css
--texture-main     /* Page backgrounds - scanlines + gradient */
--texture-sidebar  /* Sidebar - diagonal stripes */
--texture-card     /* Card/modal content - subtle gradient */
```

## Layout

```css
--sidebar-width: 260px;
--header-height: 60px;
```

## Audio System

### Volume Levels
```css
--audio-volume-muted: 0;
--audio-volume-low: 0.15;
--audio-volume-medium-low: 0.3;
--audio-volume-medium: 0.5;
--audio-volume-medium-high: 0.6;
--audio-volume-high: 0.7;
--audio-volume-max: 1.0;
```

### Category Defaults
```css
--audio-level-ui: var(--audio-volume-medium-low);       /* 0.3 */
--audio-level-feedback: var(--audio-volume-medium);     /* 0.5 */
--audio-level-alert: var(--audio-volume-high);          /* 0.7 */
--audio-level-ambient: var(--audio-volume-medium-low);  /* 0.3 */
```

### Timing
```css
--audio-fade-duration: 150ms;
--audio-debounce-ui: 50ms;
--audio-debounce-feedback: 200ms;
```

### Sound Tokens (in audioSounds.js)
| Token | Category | Duration | Volume |
|-------|----------|----------|--------|
| `ui.click` | ui | 67ms | 0.3 |
| `ui.toggle` | ui | 93ms | 0.3 |
| `ui.tab` | ui | 60ms | 0.15 |
| `modal.open` | modal | 273ms | 0.5 |
| `modal.close` | modal | 272ms | 0.3 |
| `feedback.success` | feedback | 350ms | 0.5 |
| `feedback.error` | feedback | 265ms | 0.5 |
| `feedback.warning` | feedback | 300ms | 0.5 |
| `wizard.step` | wizard | 305ms | 0.5 |
| `wizard.complete` | wizard | 516ms | 0.6 |
| `imp.interact` | imp | 195ms | 0.5 |
| `imp.appear` | imp | 282ms | 0.3 |
| `imp.dismiss` | imp | 174ms | 0.3 |

See [AUDIO.md](AUDIO.md) for full audio system documentation.
