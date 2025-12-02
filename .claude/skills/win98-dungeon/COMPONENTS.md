# Component Patterns

CSS patterns for common UI elements following Win98 dungeon style.

## Modal

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

## Card

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

## Button

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

.button:hover {
  background: var(--color-button-hover);
}

.button:active {
  border-color: var(--win98-pressed-border);
  box-shadow: var(--win98-pressed-shadow);
}
```

### Primary Button

```css
.buttonPrimary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
```

### Danger Button

```css
.buttonDanger {
  background: var(--color-error);
  color: var(--color-text-primary);
}
```

## Modal Form Layout (Standardized)

Use this pattern for ALL modal forms and wizard steps:

```css
/* Modal/Wizard content container */
.modalContent {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);  /* 24px - between sections */
  padding: var(--space-4);
  overflow-y: auto;
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

/* Section title */
.sectionTitle {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-primary);
  margin: 0;  /* Parent gap handles spacing */
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

### Spacing Hierarchy

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

## Form Input

```css
.input {
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

.input:focus {
  outline: none;
  background: var(--win98-form-bg-focus);
  border-color: var(--color-primary) var(--win98-border-light)
               var(--win98-border-light) var(--color-primary);
}

.input::placeholder {
  color: var(--color-text-placeholder);
}
```

## Form Label

```css
.label {
  font-family: var(--font-ui);
  color: var(--color-text-primary);
  /* Note: margin handled by parent .formField gap */
}
```

## Title (Gold)

```css
.title {
  font-family: var(--font-ui);
  color: var(--color-primary);
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}
```

## Section Header

```css
.sectionHeader {
  font-family: var(--font-display);
  color: var(--color-primary);
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
  padding-bottom: var(--space-3);
  border-bottom: 2px solid var(--win98-border-dark);
  margin-bottom: var(--space-4);
}
```

## Separator

```css
.separator {
  border: none;
  border-bottom: 2px solid var(--win98-border-dark);
  margin: var(--space-4) 0;
}
```

## Nav Item

```css
.navItem {
  background: var(--color-bg-primary);
  border: 2px solid;
  border-color: var(--win98-raised-border);
  box-shadow: var(--win98-raised-shadow);
  border-radius: 0;
  font-family: var(--font-ui);
  color: var(--color-text-primary);
  padding: var(--space-3) var(--space-4);
}

.navItemActive {
  background: var(--color-nav-active-bg);
  border-color: var(--win98-pressed-border);
  box-shadow: var(--win98-pressed-shadow);
  color: var(--color-nav-active-text);
}
```

## Table

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-family);
}

.tableHeader {
  background: var(--color-bg-secondary);
  border-bottom: 2px solid var(--win98-border-dark);
}

.tableHeader th {
  font-family: var(--font-ui);
  color: var(--color-primary);
  text-align: left;
  padding: var(--space-3) var(--space-4);
}

.tableRow {
  border-bottom: 2px solid var(--win98-border-dark);
}

.tableRow:hover {
  background: var(--color-bg-hover);
}

.tableCell {
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-primary);
}
```

## Status Badge

```css
.badge {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  border: 2px solid;
  border-color: var(--win98-raised-border);
  border-radius: 0;
}

.badgeSuccess {
  background: var(--color-success-light);
  color: var(--color-success);
}

.badgeError {
  background: var(--color-error-light);
  color: var(--color-error);
}

.badgeWarning {
  background: var(--color-warning-light);
  color: var(--color-warning-text);
}
```
