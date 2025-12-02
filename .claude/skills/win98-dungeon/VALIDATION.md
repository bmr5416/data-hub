# Validation Checklist

Use this checklist to validate CSS before committing.

## Pre-Commit Checklist

### Border Radius
- [ ] All `border-radius` values are `0`
- [ ] No `var(--radius-md)` or similar (except `--radius-full` for circles)

### Border Width
- [ ] All borders use `2px` width
- [ ] No `1px` borders anywhere

### Colors
- [ ] No hardcoded hex values (`#xxx` or `#xxxxxx`)
- [ ] No hardcoded color names (`white`, `black`, `gray`)
- [ ] All colors use `var(--color-*)` tokens
- [ ] Border colors use `var(--win98-*)` tokens

### Fonts
- [ ] Headings (h1-h3) use `--font-display`
- [ ] UI elements use `--font-ui`
- [ ] Body text uses `--font-family`
- [ ] No system fonts or font stacks

### 3D Border Effects
- [ ] Buttons use `--win98-raised-border` + `--win98-raised-shadow`
- [ ] Active buttons use `--win98-pressed-border` + `--win98-pressed-shadow`
- [ ] Form inputs use `--win98-inset-border` + `--win98-inset-shadow`
- [ ] Cards use `--win98-raised-border` + `--win98-raised-shadow`

### Title Styling
- [ ] Titles use `color: var(--color-primary)`
- [ ] Titles have `text-shadow: 2px 2px 0 rgba(0,0,0,0.5)`

### Separators
- [ ] All separators use `2px solid var(--win98-border-dark)`

### Form Spacing Hierarchy (Modal Forms)
- [ ] Modal content uses `gap: var(--space-5)` (24px between sections)
- [ ] Form sections use `gap: var(--space-4)` (16px between fields)
- [ ] Form fields use `gap: var(--space-2)` (8px label-input)
- [ ] Section titles use `margin: 0` (parent gap handles spacing)
- [ ] No arbitrary spacing values (use tokens only)

## Grep Commands for Validation

```bash
# Find rounded corners
grep -rn "border-radius:" --include="*.css" | grep -v ": 0"

# Find 1px borders
grep -rn "border.*1px" --include="*.css"

# Find hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" --include="*.css"

# Find wrong border tokens
grep -rn "color-gray-" --include="*.css" | grep "border"

# Find modern shadows
grep -rn "box-shadow:" --include="*.css" | grep -v "win98\|shadow-sm\|shadow-md\|shadow-lg"

# Find system fonts
grep -rn "font-family:" --include="*.css" | grep -v "var(--font"

# Find non-token spacing (arbitrary px values)
grep -rn "gap: [0-9]" --include="*.css"
grep -rn "margin.*[0-9]px" --include="*.css" | grep -v "margin: 0"

# Verify form spacing uses correct tokens
grep -rn "gap: var(--space-1)" --include="*.css"  # Should be rare (only 4px cases)
```

## Quick Visual Check

When reviewing a component, verify:

1. **No rounded corners visible** - All elements should have sharp 90-degree corners
2. **3D beveled appearance** - Buttons and cards should look raised
3. **Inputs appear sunken** - Form fields should look carved into the surface
4. **Gold accents** - Titles and active states should use gold color
5. **Pixel-perfect shadows** - Shadows should be offset (2px, 4px, 6px), not blurred

## Common Mistakes

### Mistake 1: Using wrong focus style
```css
/* WRONG */
.input:focus {
  outline: 2px solid var(--color-primary);
}

/* CORRECT */
.input:focus {
  outline: none;
  border-color: var(--color-primary) var(--win98-border-light)
               var(--win98-border-light) var(--color-primary);
}
```

### Mistake 2: Forgetting inset shadow on inputs
```css
/* WRONG */
.input {
  border: 2px solid;
  border-color: var(--win98-inset-border);
}

/* CORRECT - include the shadow */
.input {
  border: 2px solid;
  border-color: var(--win98-inset-border);
  box-shadow: var(--win98-inset-shadow);
}
```

### Mistake 3: Using texture without background color
```css
/* WRONG */
.card {
  background-image: var(--texture-card);
}

/* CORRECT */
.card {
  background: var(--color-bg-primary);
  background-image: var(--texture-card);
}
```

### Mistake 4: Missing hover state for buttons
```css
/* INCOMPLETE */
.button {
  background: var(--color-button-bg);
}

/* COMPLETE */
.button {
  background: var(--color-button-bg);
}
.button:hover {
  background: var(--color-button-hover);
}
.button:active {
  border-color: var(--win98-pressed-border);
  box-shadow: var(--win98-pressed-shadow);
}
```

### Mistake 5: Wrong form spacing hierarchy
```css
/* WRONG - too tight, inconsistent */
.formField {
  gap: var(--space-1);  /* 4px is too tight for label-input */
}
.modalContent {
  gap: var(--space-3);  /* 12px is too tight between sections */
}
.sectionTitle {
  margin-bottom: var(--space-3);  /* Creates double-spacing with parent gap */
}

/* CORRECT - standardized hierarchy */
.formField {
  gap: var(--space-2);  /* 8px for label-input */
}
.modalContent {
  gap: var(--space-5);  /* 24px between sections */
}
.formSection {
  gap: var(--space-4);  /* 16px between fields */
}
.sectionTitle {
  margin: 0;  /* Parent gap handles spacing */
}
```
