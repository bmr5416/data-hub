# Fun Mode Design Tokens

Design tokens for vintage RPG-esque "Fun Mode" - toggleable retro gaming aesthetic inspired by classic 8-bit/16-bit RPGs and Windows 98/XP interfaces.

---

## Dependencies & Resources

### MIT-Licensed CSS Libraries

| Library | Description | Install/CDN |
|---------|-------------|-------------|
| **NES.css** | 8-bit NES-style CSS framework (21k+ ⭐) | `npm install nes.css` or `unpkg.com/nes.css@latest/css/nes.min.css` |
| **98.css** | Windows 98 faithful UI recreation (10k+ ⭐) | `npm install 98.css` or `unpkg.com/98.css` |
| **XP.css** | Windows XP-style CSS framework | `npm install xp.css` or CDN via https://botoxparty.github.io |
| **pixel-ui-dialog** | RPG dialog box component | https://github.com/browsermage/pixel-ui-dialog |
| **RPGDialogBox** | Classic RPG text box | https://github.com/Gunbard/RPGDialogBox |

### Pixel Art UI Packs (Free/Open)

| Resource | License | Source |
|----------|---------|--------|
| OpenGameArt pixel fonts | CC0/Public Domain | https://opengameart.org/content/fonts-huds-and-menus-pixelart |
| CraftPix Basic Pixel UI | Free for commercial | https://craftpix.net/freebies/free-basic-pixel-art-ui-for-rpg |
| Lospec Palettes | Free | https://lospec.com/palette-list |

---

## Fonts

```
"Press Start 2P", "VT323", "Kongtext", "Silkscreen", "Pixelify Sans", monospace
```

### Font Stack Details

| Font | Style | Google Fonts | Use Case |
|------|-------|--------------|----------|
| **Press Start 2P** | Arcade/NES | ✅ Yes | Headlines, buttons, titles |
| **VT323** | Terminal/CRT | ✅ Yes | Body text, code, data |
| **Silkscreen** | Pixel sans | ✅ Yes | UI labels, navigation |
| **Pixelify Sans** | Modern pixel | ✅ Yes | Larger body text |
| **Kongtext** | 8-bit NES | ⚠️ DaFont | Alt headlines |
| **美咲フォント** | Japanese pixel | External | i18n support |

### CSS Import

```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Silkscreen&family=Pixelify+Sans:wght@400;700&display=swap');
```

---

## Text Colors

| Name | Hex | RGB | Use Case |
|------|-----|-----|----------|
| Gold/XP | `#FFD700` | `rgb(255, 215, 0)` | Headings, highlights, loot |
| Parchment Text | `#3D2914` | `rgb(61, 41, 20)` | Primary body text |
| Frost White | `#F0F0F0` | `rgb(240, 240, 240)` | Light mode text |
| Crimson HP | `#E63946` | `rgb(230, 57, 70)` | Errors, warnings, low HP |
| Mana Blue | `#4A90D9` | `rgb(74, 144, 217)` | Links, MP indicators |
| Nature Green | `#2D6A4F` | `rgb(45, 106, 79)` | Success, healing, XP |
| Shadow Black | `#1A1A2E` | `rgb(26, 26, 46)` | Dark mode primary |
| Stone Gray | `#6C757D` | `rgb(108, 117, 125)` | Disabled, secondary |

---

## Background Colors

| Name | Hex | RGB | Use Case |
|------|-----|-----|----------|
| Parchment | `#F4E4C1` | `rgb(244, 228, 193)` | Main content area |
| Aged Paper | `#E8D4A8` | `rgb(232, 212, 168)` | Cards, panels |
| Royal Purple | `#2D1B4E` | `rgb(45, 27, 78)` | Dark mode bg |
| Dungeon Stone | `#3A3A5C` | `rgb(58, 58, 92)` | Dark mode cards |
| Win98 Gray | `#C0C0C0` | `rgb(192, 192, 192)` | Classic window bg |
| Win98 Teal | `#008080` | `rgb(0, 128, 128)` | Desktop/accent |
| XP Blue | `#0A246A` | `rgb(10, 36, 106)` | Title bars |
| XP Green | `#1F7C1F` | `rgb(31, 124, 31)` | Start button |
| Treasure Chest | `#5C4033` | `rgb(92, 64, 51)` | Wood textures |
| Dragon Fire | `#FF6B35` | `rgb(255, 107, 53)` | Accent, CTA |

---

## SNES/JRPG Color Palette (Jehkoba32-Inspired)

*16-bit era vibrancy for authentic retro feel*

| Swatch | Hex | Name |
|--------|-----|------|
| 🟦 | `#0D2B45` | Midnight Quest |
| 🟦 | `#203C56` | Deep Sea Cave |
| 🟦 | `#544E68` | Phantom Purple |
| 🟩 | `#8D697A` | Mystic Rose |
| 🟧 | `#D08159` | Desert Sun |
| 🟨 | `#FFAA5E` | Golden Loot |
| 🟨 | `#FFD4A3` | Light Potion |
| ⬜ | `#FFECD6` | Parchment Glow |
| 🟩 | `#1E6F50` | Forest Spirit |
| 🟩 | `#30A46C` | Healing Herb |
| 🟨 | `#A3E048` | Stamina Leaf |
| 🟥 | `#E23D28` | Critical Hit |
| 🟪 | `#9B5DE5` | Mage Staff |
| 🟦 | `#00BBF9` | Ice Spell |
| ⬜ | `#FFFFFF` | Pure Light |
| ⬛ | `#0F0F1B` | Void Black |

---

## Font Sizes (Pixel-Perfect Scale)

*Based on 8px grid for crisp rendering*

| Size | px | rem | Usage |
|------|-----|-----|-------|
| XS | `8px` | `0.5rem` | Tiny labels, HP numbers |
| SM | `12px` | `0.75rem` | UI labels, stats |
| BASE | `16px` | `1rem` | Body text |
| MD | `20px` | `1.25rem` | Subheadings |
| LG | `24px` | `1.5rem` | Section headers |
| XL | `32px` | `2rem` | Page titles |
| 2XL | `40px` | `2.5rem` | Hero headlines |
| 3XL | `48px` | `3rem` | Quest complete! |

---

## Spacing Scale (8px Grid)

```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px, 128px
```

| Token | Value | Use Case |
|-------|-------|----------|
| `--space-xxs` | `4px` | Icon padding |
| `--space-xs` | `8px` | Inline gaps |
| `--space-sm` | `12px` | Button padding |
| `--space-md` | `16px` | Card padding |
| `--space-lg` | `24px` | Section gaps |
| `--space-xl` | `32px` | Container margins |
| `--space-2xl` | `48px` | Section breaks |
| `--space-3xl` | `64px` | Hero spacing |

---

## CSS Variables (Fun Mode)

```css
:root[data-theme="fun"] {
  /* Core Palette */
  --color-primary: #FFD700;
  --color-secondary: #4A90D9;
  --color-accent: #FF6B35;
  --color-success: #2D6A4F;
  --color-danger: #E63946;
  --color-warning: #FFAA5E;
  
  /* Backgrounds */
  --bg-primary: #F4E4C1;
  --bg-secondary: #E8D4A8;
  --bg-dark: #2D1B4E;
  --bg-card: #FFECD6;
  --bg-window: #C0C0C0;
  
  /* Text */
  --text-primary: #3D2914;
  --text-secondary: #6C757D;
  --text-inverse: #F0F0F0;
  --text-gold: #FFD700;
  
  /* Fonts */
  --font-display: "Press Start 2P", monospace;
  --font-body: "VT323", "Silkscreen", monospace;
  --font-ui: "Silkscreen", monospace;
  
  /* Sizing */
  --border-pixel: 4px;
  --border-radius: 0px; /* Sharp pixel edges */
  --header-height: 48px;
  --sidebar-width: 200px;
  
  /* Shadows (Pixel-style) */
  --shadow-inset: inset -2px -2px 0 #888, inset 2px 2px 0 #fff;
  --shadow-outset: 2px 2px 0 #000, -2px -2px 0 #fff;
  --shadow-window: 4px 4px 0 rgba(0,0,0,0.5);
  
  /* Animation */
  --transition-speed: 0ms; /* Instant for retro feel */
  --blink-speed: 500ms;
  
  /* Win98/XP Specific */
  --win98-title-blue: #000080;
  --win98-title-active: linear-gradient(90deg, #000080, #1084d0);
  --xp-title-blue: #0A246A;
  --xp-button-face: #ECE9D8;
}
```

---

## Texture & Effect Classes

### CRT Scanline Overlay

```css
.crt-scanlines::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1),
    rgba(0, 0, 0, 0.1) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 1000;
}

.crt-flicker {
  animation: crt-flicker 0.15s infinite;
}

@keyframes crt-flicker {
  0% { opacity: 0.97; }
  50% { opacity: 1; }
}
```

### Pixel Border (NES-style)

```css
.pixel-border {
  border-style: solid;
  border-width: 4px;
  border-image: url("data:image/svg+xml,...") 4 fill;
  /* Or use box-shadow for pure CSS: */
  box-shadow:
    0 -4px 0 0 #000,
    0 4px 0 0 #000,
    -4px 0 0 0 #000,
    4px 0 0 0 #000;
}
```

### Win98 Window Frame

```css
.window-98 {
  background: #c0c0c0;
  border: 2px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  box-shadow: 
    inset 1px 1px 0 #dfdfdf,
    inset -1px -1px 0 #0a0a0a;
}

.title-bar-98 {
  background: linear-gradient(90deg, #000080, #1084d0);
  color: white;
  font-family: "Pixelify Sans", sans-serif;
  font-weight: bold;
  padding: 3px 4px;
  display: flex;
  justify-content: space-between;
}
```

---

## Transition Messages (Fun Mode)

*Quest-style loading/status messages*

```javascript
const funModeMessages = {
  loading: [
    "⚔️ Sharpening pixels...",
    "🎮 Loading save file...",
    "🗺️ Generating dungeon map...",
    "💾 Inserting cartridge...",
    "🧙 Casting render spell...",
  ],
  success: [
    "✨ Quest Complete!",
    "🏆 Achievement Unlocked!",
    "💰 Loot Acquired!",
    "⬆️ Level Up!",
    "🎉 Victory Fanfare!",
  ],
  error: [
    "💀 Game Over...",
    "❌ Critical Miss!",
    "🔥 You Died",
    "⚠️ Corruption Detected",
    "😵 It's Super Effective!",
  ],
  idle: [
    "Press START to continue",
    "Insert Coin ●●○",
    "Waiting for Player 2...",
    "Autosaving...",
  ]
};
```

---

## Toggle Implementation

### CSS Class Toggle

```css
/* Base theme */
:root {
  --font-display: proxima-nova, sans-serif;
  --bg-primary: rgb(242, 240, 233);
}

/* Fun Mode Override */
:root.fun-mode,
:root[data-fun-mode="true"] {
  --font-display: "Press Start 2P", monospace;
  --bg-primary: #F4E4C1;
  /* ... all fun tokens */
}
```

### React Toggle Hook

```jsx
const useFunMode = () => {
  const [isFunMode, setIsFunMode] = useState(false);
  
  useEffect(() => {
    document.documentElement.classList.toggle('fun-mode', isFunMode);
    document.documentElement.setAttribute('data-fun-mode', isFunMode);
  }, [isFunMode]);
  
  return [isFunMode, setIsFunMode];
};
```

---

## Asset Sources

| Asset Type | Recommended Source | License |
|------------|-------------------|---------|
| Pixel Fonts | Google Fonts | OFL |
| UI Sprites | OpenGameArt.org | CC0/Various |
| Sound FX | freesound.org | CC0 |
| Color Palettes | lospec.com | Free |
| Window Chrome | 98.css / XP.css | MIT |

---

## Quick Start

```html
<!-- Include NES.css for instant retro UI -->
<link href="https://unpkg.com/nes.css/css/nes.min.css" rel="stylesheet">

<!-- Include pixel fonts -->
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">

<!-- Optional: 98.css for Windows chrome -->
<link href="https://unpkg.com/98.css" rel="stylesheet">
```

```css
/* Activate fun mode */
body.fun-mode {
  font-family: "VT323", monospace;
  background: #F4E4C1 url('/textures/parchment.png');
  image-rendering: pixelated;
}

body.fun-mode h1,
body.fun-mode h2,
body.fun-mode h3 {
  font-family: "Press Start 2P", monospace;
  color: #FFD700;
  text-shadow: 2px 2px 0 #000;
}
```

---

*This design system can be toggled alongside light/dark mode for the ultimate nostalgic experience. All referenced libraries are MIT-licensed and production-ready.*

---

## Implementation Status

Fun Mode has been implemented in this codebase. Below documents the actual implementation.

### Architecture

| Aspect | Implementation |
|--------|----------------|
| Toggle Mechanism | `data-fun-mode="true"` attribute on `document.documentElement` |
| State Management | `FunModeContext.jsx` with localStorage persistence (`capi-fun-mode`) |
| CSS Organization | Separate `fun-mode.css` imported after `index.css` |
| Theme Combinations | 4 states: light, dark, light+fun, dark+fun |

### Files Created

| File | Purpose |
|------|---------|
| `client/src/styles/fun-mode.css` | Design tokens + global overrides |
| `client/src/contexts/FunModeContext.jsx` | State management (toggle, localStorage) |
| `client/src/components/common/FunModeToggle.jsx` | Toggle button component |
| `client/src/components/common/FunModeToggle.module.css` | Toggle styles |
| `client/src/components/common/SettingsBar.jsx` | Combined theme + fun mode controls |
| `client/src/components/common/SettingsBar.module.css` | Settings bar styles |
| `client/src/data/funModeMessages.js` | Quest-style loading messages |

### Implemented Design Tokens

```css
[data-fun-mode="true"] {
  /* Typography */
  --font-family: "VT323", "Silkscreen", monospace;
  --font-display: "Press Start 2P", monospace;
  --font-ui: "Silkscreen", monospace;

  /* Core Palette - Parchment Theme (Light) */
  --color-primary: #FFD700;           /* Gold/XP - accent only */
  --color-bg-primary: #FFECD6;        /* Parchment Glow */
  --color-text-primary: #3D2914;      /* Parchment Text */

  /* 90s-authentic UI colors */
  --color-button-bg: #C0C0C0;         /* Win98 gray for buttons */
  --color-button-text: #000000;
  --color-nav-active-bg: #A49468;     /* Aged brass for active nav */
  --color-nav-active-text: #1A1008;

  /* Pixel-perfect sizing */
  --radius-sm: 0;
  --radius-md: 0;
  --radius-lg: 0;
  --shadow-md: 4px 4px 0 rgba(0,0,0,0.4);
  --transition-fast: 0ms;             /* Instant for retro feel */

  /* Win98-style 3D borders */
  --win98-border-light: #ffffff;
  --win98-border-dark: #808080;
  --win98-border-darker: #0a0a0a;
  --win98-border-lighter: #dfdfdf;

  /* 90s-era textures (CSS gradients) */
  --texture-main: /* parchment paper grain */;
  --texture-sidebar: /* diagonal weave */;
  --texture-card: /* corner shine gradient */;
}

[data-theme="dark"][data-fun-mode="true"] {
  /* Dungeon Theme overrides */
  --color-bg-primary: #3A3A5C;        /* Dungeon Stone */
  --color-bg-secondary: #2D1B4E;      /* Royal Purple */
  --color-text-primary: #FFECD6;
  --color-button-bg: #5A5A7C;
  --color-button-text: #FFECD6;
  --color-nav-active-bg: #4A4A6C;
  --color-nav-active-text: #FFD700;   /* Gold text on dark */
}
```

### Win98 Border Pattern

```css
/* Raised button/card */
.element {
  border: 2px solid;
  border-color: var(--win98-border-light) var(--win98-border-dark)
               var(--win98-border-dark) var(--win98-border-light);
  box-shadow:
    inset 1px 1px 0 var(--win98-border-lighter),
    inset -1px -1px 0 var(--win98-border-darker);
}

/* Pressed/inset button */
.element:active {
  border-color: var(--win98-border-dark) var(--win98-border-light)
               var(--win98-border-light) var(--win98-border-dark);
  box-shadow:
    inset -1px -1px 0 var(--win98-border-lighter),
    inset 1px 1px 0 var(--win98-border-darker);
}
```

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CRT Scanlines | Not implemented | User preference for cleaner visuals |
| Primary button color | Win98 gray (not gold) | More authentic 90s aesthetic |
| Nav active state | Inset/pressed style | Mimics depressed Win98 button |
| Gold usage | Accent only (highlights, hover) | Better contrast, avoids readability issues |
| Textures | CSS gradients via variables | No hardcoded styles, respects themes |

### Contrast-Safe Colors

To avoid gold-on-gold readability issues, these variables stay dark in both themes:

```css
--color-on-primary: #1A1008;    /* Dark text on gold backgrounds */
--color-on-warning: #5C3D00;    /* Dark text on yellow/orange */
--color-on-attention: #7A2E00;  /* Dark text on attention orange */
```

---

## Imp Assistant

"Imp" is a Clippy-like context-aware helper that appears exclusively in Fun Mode. The name puns on "impressions" (core advertising metric) while fitting the retro RPG creature theme.

### Architecture

| Component | File | Purpose |
|-----------|------|---------|
| Main | `components/imp/Imp.jsx` | Orchestration, route detection, visibility |
| Sprite | `components/imp/ImpSprite.jsx` | Animated Clippy from sprite sheet |
| Balloon | `components/imp/ImpBalloon.jsx` | Speech bubble with word-by-word reveal |
| Context | `contexts/ImpContext.jsx` | State, localStorage persistence |
| Hook | `hooks/useImpTip.js` | Route-based tip selection |
| Animations | `data/impAnimations.js` | Sprite frame coordinates |
| Tips | `data/impTips.js` | 40+ contextual messages |

### Sprite Sheet

```
Location: client/public/agents/Clippy/map.png
Frame Size: 124×93 pixels
Source: modern-clippy (MIT) - https://github.com/vchaindz/modern-clippy

Animations:
- Idle (default)
- Wave (greeting)
- Thinking (processing)
- Explain (showing tip)
- GetAttention (important)
- Congratulate (success)
- Show/Hide (appear/disappear)
```

### Balloon Design (from clippyjs)

```css
.balloon {
  background: #FFC;              /* Classic yellow */
  color: black;
  border: 1px solid black;
  border-radius: 5px;
  font-family: "Microsoft Sans Serif", sans-serif;
  font-size: 12px;
}

/* Win98-style title bar */
.header {
  background: linear-gradient(90deg, #000080, #1084d0);
  color: white;
  font-family: "Tahoma", sans-serif;
  font-size: 11px;
}

/* Tip pointer (base64 from clippy.css) */
.tip {
  background: url(data:image/png;base64,...);
}
```

### Behavior

| Trigger | Action |
|---------|--------|
| Route change | Show contextual tip after 2s delay |
| Click sprite | Get new tip (when minimized/closed) |
| X button / Escape | Dismiss and minimize |
| Auto-close | 3s after text finishes |

### Tip Context Matching

Tips filter by:
- `page` - dashboard, clientDetail, wizard, newClient, docs
- `platform` - snowflake, salesforce, ga4, etc.
- `phase` - wizard phases 1-6
- `condition` - empty_clients, no_platforms, etc.

### localStorage Keys

```javascript
'capi-imp-seen-tips'  // Array of shown tip IDs
'capi-imp-dismissed'  // Boolean, user minimized state
```

### Accessibility

- `role="dialog"` with aria-labelledby/describedby
- Focus management (dismiss button focused on open)
- Escape key dismisses
- `prefers-reduced-motion` skips animations, shows full text

---

## Loading Animation Behavior

The loading experience differs between normal mode and Fun Mode:

### Normal Mode

| Aspect | Behavior |
|--------|----------|
| Spinner | Clean, minimal circular spinner |
| Messages | None - spinner only |
| Duration | Shows only while data is loading (no artificial delay) |
| Centering | Full viewport vertical centering |

### Fun Mode

| Aspect | Behavior |
|--------|----------|
| Spinner | Pixel-style square spinner (stepped animation) |
| Quest Messages | Rotating messages from `funModeMessages.loading` (6s interval) |
| Sayings Card | Separate card with dark humor sayings from `funModeMessages.sayings` (9s interval) |
| Duration | Minimum 6 seconds to allow reading messages |
| Centering | Full viewport vertical centering |
| Cursor | Blinking `>` terminal prompt |

### Implementation Files

| File | Purpose |
|------|---------|
| `components/common/LoadingAnimation.jsx` | Conditional rendering based on `funMode` |
| `components/common/LoadingAnimation.module.css` | Pixel spinner + full viewport centering |
| `hooks/useMinLoadingTime.js` | Fun Mode-aware delay (6s in fun, 0 in normal) |
| `data/funModeMessages.js` | Quest-style loading messages |

### Code Attribution

- Sprite sheet: [modern-clippy](https://github.com/vchaindz/modern-clippy) (MIT)
- Balloon/word reveal: [clippyjs](https://github.com/pi0/clippyjs) (MIT)