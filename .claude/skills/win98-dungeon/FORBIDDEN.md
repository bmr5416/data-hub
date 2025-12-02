# Forbidden Patterns

These patterns are **BANNED** from the codebase. Never use them.

## Rounded Corners

```css
/* BANNED */
border-radius: 4px;
border-radius: 8px;
border-radius: var(--radius-md);
border-radius: var(--radius-lg);
border-radius: 0.5rem;
border-radius: 50%;  /* Use --radius-full only for intentional circles */

/* CORRECT */
border-radius: 0;
```

## Thin Borders

```css
/* BANNED */
border: 1px solid;
border: 1px solid var(--color-border);
border-width: 1px;

/* CORRECT */
border: 2px solid;
border-width: 2px;
```

## Hardcoded Colors

```css
/* BANNED */
background: #f5f5f5;
background: #fff;
background: white;
color: #333;
color: #333333;
color: black;
border-color: #ccc;
border-color: #cccccc;

/* CORRECT */
background: var(--color-bg-primary);
color: var(--color-text-primary);
border-color: var(--win98-raised-border);
```

## Wrong Border Tokens

```css
/* BANNED - gray tokens for borders */
border-color: var(--color-gray-200);
border-color: var(--color-gray-300);
border-color: var(--color-border);

/* CORRECT */
border-color: var(--win98-raised-border);
border-color: var(--win98-inset-border);
border-color: var(--win98-border-dark);
```

## Modern Shadows

```css
/* BANNED */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
box-shadow: 0 0 0 3px var(--color-primary-light);  /* Focus rings */

/* CORRECT */
box-shadow: var(--win98-raised-shadow);
box-shadow: var(--win98-pressed-shadow);
box-shadow: var(--win98-inset-shadow);
box-shadow: var(--shadow-sm);  /* 2px 2px pixel shadow */
```

## Fun Mode Toggles

```css
/* BANNED - there is no fun mode toggle */
:global([data-fun-mode="true"]) .element { }
[data-theme="modern"] { }
.modernMode { }
```

## Wrong Font Usage

```css
/* BANNED */
font-family: Arial, sans-serif;
font-family: system-ui;
font-family: -apple-system;
font-family: inherit;  /* in most cases */

/* CORRECT */
font-family: var(--font-display);  /* Headings */
font-family: var(--font-ui);       /* UI elements */
font-family: var(--font-family);   /* Body text */
```

## Transitions for Interactions

```css
/* BANNED - retro feel means instant */
transition: all 0.3s ease;
transition: background 200ms;
transition: color 150ms;

/* CORRECT - use CSS instant or content-only transitions */
/* Most transitions are 0ms in the design system */
transition: var(--transition-content);  /* 100ms for content only */
```

## Gradient Backgrounds (except textures)

```css
/* BANNED */
background: linear-gradient(to right, #fff, #f0f0f0);
background: radial-gradient(circle, #333, #000);

/* CORRECT - use texture tokens */
background-image: var(--texture-main);
background-image: var(--texture-card);
background-image: var(--texture-sidebar);
```

## Summary: What To Use Instead

| Banned Pattern | Correct Alternative |
|----------------|---------------------|
| `border-radius: Xpx` | `border-radius: 0` |
| `border: 1px solid` | `border: 2px solid` |
| `#hexcolor` | `var(--color-*)` |
| `var(--color-gray-*)` for borders | `var(--win98-*-border)` |
| Modern shadows | `var(--win98-*-shadow)` or `var(--shadow-*)` |
| System fonts | `var(--font-display/ui/family)` |
| Smooth transitions | `var(--transition-*)` (mostly 0ms) |
