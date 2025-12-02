---
name: win98-dungeon
description: Win98 dungeon design system for Data Hub. Use when writing CSS, styling components, or reviewing UI code. Enforces strict retro aesthetic with zero border-radius, 3D borders, and semantic tokens.
---

# Win98 Dungeon Design System

This is the **permanent** design system for Data Hub. All UI code must follow these rules absolutely.

## Quick Reference

| Element | Background | Border | Font |
|---------|------------|--------|------|
| Modal/Card | `--color-bg-primary` | `--win98-raised-border` | varies |
| Form input | `--win98-form-bg` | `--win98-inset-border` | `--font-ui` |
| Button | `--color-button-bg` | `--win98-raised-border` | `--font-ui` |
| Button:active | `--color-button-bg` | `--win98-pressed-border` | `--font-ui` |
| Title | - | - | `--font-ui` + gold |
| Body text | - | - | `--font-family` |
| Heading | - | - | `--font-display` |

## Absolute Rules

### 1. NO ROUNDED CORNERS
All `border-radius` must be `0`. No exceptions.

### 2. 2px SOLID BORDERS
All borders must be `2px solid`. Never `1px`.

### 3. SEMANTIC TOKENS ONLY
No hardcoded hex colors. Use `var(--color-*)` or `var(--win98-*)`.

### 4. CORRECT FONT TOKENS
- `--font-display`: Headings (h1, h2, h3)
- `--font-ui`: Labels, buttons, UI text
- `--font-family`: Body text, paragraphs

### 5. GOLD TITLES
Titles use `color: var(--color-primary)` with `text-shadow: 2px 2px 0 rgba(0,0,0,0.5)`.

### 6. 3D BORDER SYSTEM
- **Raised**: buttons, cards, nav items (default)
- **Pressed**: active buttons, selected tabs
- **Inset**: form inputs, text areas

## Files in This Skill

- [TOKENS.md](TOKENS.md) - Complete design token reference
- [AUDIO.md](AUDIO.md) - Audio system and sound tokens
- [COMPONENTS.md](COMPONENTS.md) - Component pattern library
- [FORBIDDEN.md](FORBIDDEN.md) - Banned patterns and anti-patterns
- [VALIDATION.md](VALIDATION.md) - Self-check validation checklist

## Source of Truth

- `client/src/styles/index.css` - Token definitions
- `client/src/styles/README.md` - Full documentation
- `CLAUDE.md` - Styling architecture diagrams
