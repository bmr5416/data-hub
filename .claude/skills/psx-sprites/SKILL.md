---
name: psx-sprites
description: PSX pixel art sprite system for Data Hub UI. Use when adding loading animations, status indicators, or decorative pixel art elements. Covers PSXSprite component, available sprites, and status mappings.
---

# PSX Sprites

Data Hub uses retro PlayStation 1 style animated sprites for loading states, status indicators, and decorative elements.

## Quick Usage

```jsx
import PSXSprite from '../components/common/PSXSprite';

// Basic usage
<PSXSprite sprite="hourglass" />

// With size and animation
<PSXSprite sprite="heartGreen" animation="pulse" size="lg" />

// Interactive
<PSXSprite sprite="star" onClick={handleClick} />
```

## Files in This Skill

- [SPRITES.md](SPRITES.md) - Available sprites catalog
- [ANIMATIONS.md](ANIMATIONS.md) - Animation definitions

## Available Sprites

### UI Sprites
| Name | Animation | Use For |
|------|-----------|---------|
| `hourglass` | spin | Loading states |
| `star` | pulse | Favorites, ratings |
| `coin` | spin | Currency, rewards |

### Status Sprites (Hearts)
| Name | Status | Animation |
|------|--------|-----------|
| `heartGreen` | active | pulse |
| `heartBlue` | connected/inactive | pulse |
| `heartRed` | error/disconnected | pulse |
| `heartYellow` | pending/onboarding | pulse |

### Status Sprites (Tubes)
| Name | Status | Animation |
|------|--------|-----------|
| `tubeGreen` | active | bubble |
| `tubeBlue` | paused | bubble |
| `tubeRed` | error | bubble |

### Platform Sprites
| Name | Category | Animation |
|------|----------|-----------|
| `floppy` | warehouse | idle |
| `monitor` | integration | idle |
| `lock` | auth | idle |
| `gameboy` | mobile | idle |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sprite` | string | `'hourglass'` | Sprite name |
| `animation` | string | first available | Animation name |
| `size` | string | `'md'` | `'xs'`, `'sm'`, `'md'`, `'lg'` |
| `paused` | boolean | `false` | Pause animation |
| `onClick` | function | - | Makes sprite interactive |
| `className` | string | - | Additional CSS classes |
| `ariaLabel` | string | - | Accessibility label |

## Sizes

| Size | Pixels | Use For |
|------|--------|---------|
| `xs` | 16px | Inline text |
| `sm` | 24px | Badges, compact |
| `md` | 32px | Cards, buttons (native) |
| `lg` | 48px | Hero, emphasis |

## Status Helpers

```javascript
import { getHeartByStatus, getTubeByStatus } from '../../data/psxAnimations';

// Get heart sprite based on status
const heartSprite = getHeartByStatus('active');  // heartGreen
const heartSprite = getHeartByStatus('error');   // heartRed

// Get tube sprite based on ETL status
const tubeSprite = getTubeByStatus('active');    // tubeGreen
const tubeSprite = getTubeByStatus('paused');    // tubeBlue
```

## Component Location

- Component: `client/src/components/common/PSXSprite.jsx`
- Animations: `client/src/data/psxAnimations.js`
- Sprite sheets: `client/public/assets/psx/`
