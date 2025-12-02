# Step Component Template

## Basic Step Structure

```jsx
import PropTypes from 'prop-types';
import styles from './MyStep.module.css';

export default function MyStep({ data, onChange }) {
  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <h3 className={styles.title}>Step Title</h3>
        <p className={styles.description}>
          Brief description of what this step does.
        </p>
      </div>

      {/* Content Section */}
      <div className={styles.content}>
        {/* Form fields, selections, etc. */}
      </div>
    </div>
  );
}

MyStep.propTypes = {
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
```

## CSS Module Template

Uses standardized **Form Spacing Hierarchy**:
- 24px between sections (`--space-5`)
- 16px between fields (`--space-4`)
- 8px label-input (`--space-2`)

```css
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);  /* 24px - between major sections */
  padding: var(--space-4);
}

.header {
  /* No margin - parent gap handles spacing */
}

.title {
  font-family: var(--font-ui);
  color: var(--color-primary);
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
  margin-bottom: var(--space-2);
}

.description {
  font-family: var(--font-family);
  color: var(--color-text-secondary);
  font-size: var(--text-base);
}

/* Content section - contains form fields */
.content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);  /* 16px - between form fields */
}

/* Form section with visual grouping */
.section {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);  /* 16px - between fields in section */
  background: var(--color-bg-secondary);
  border: 2px solid;
  border-color: var(--win98-inset-border);
  box-shadow: var(--win98-inset-shadow);
  border-radius: 0;
}

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
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);  /* 8px - tight label-input association */
}

.label {
  font-family: var(--font-ui);
  color: var(--color-text-primary);
}

.input {
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
```

## Props Reference

| Prop | Type | Description |
|------|------|-------------|
| `data` | `object` | Current wizard data state |
| `onChange` | `function` | Updates wizard data: `onChange({ field: value })` |
| `isFirstStep` | `boolean` | True if this is the first step |
| `isLastStep` | `boolean` | True if this is the last step |

## Common Patterns

### Controlled Input

```jsx
<input
  type="text"
  value={data.fieldName || ''}
  onChange={(e) => onChange({ fieldName: e.target.value })}
  className={styles.input}
/>
```

### Select Dropdown

```jsx
<select
  value={data.selection || ''}
  onChange={(e) => onChange({ selection: e.target.value })}
  className={styles.select}
>
  <option value="">Select an option...</option>
  {options.map(opt => (
    <option key={opt.id} value={opt.id}>{opt.name}</option>
  ))}
</select>
```

### Checkbox

```jsx
<label className={styles.checkbox}>
  <input
    type="checkbox"
    checked={data.isEnabled || false}
    onChange={(e) => onChange({ isEnabled: e.target.checked })}
  />
  <span>Enable this feature</span>
</label>
```

### Multiple Fields Update

```jsx
const handleItemSelect = (item) => {
  onChange({
    selectedId: item.id,
    selectedName: item.name,
    // Can update multiple fields at once
  });
};
```

## Validation Function

Define in the step config:

```javascript
{
  id: 'my-step',
  title: 'My Step',
  component: MyStep,
  isValid: (data) => {
    // Return true if step is valid
    return Boolean(data.requiredField) && data.count > 0;
  }
}
```
