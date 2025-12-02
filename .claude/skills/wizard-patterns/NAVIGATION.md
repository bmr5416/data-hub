# Wizard Navigation

## WizardNavigation Component

Location: `client/src/components/wizard/WizardNavigation.jsx`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onBack` | `function` | required | Called when Back is clicked |
| `onNext` | `function` | required | Called when Next/Complete is clicked |
| `onCancel` | `function` | - | Called when Cancel is clicked |
| `isFirstStep` | `boolean` | required | Hides Back button if true |
| `isLastStep` | `boolean` | required | Changes Next to Complete |
| `isValid` | `boolean` | required | Disables Next if false |
| `isSubmitting` | `boolean` | required | Shows loading state |
| `nextLabel` | `string` | `'Next'` | Custom Next button label |
| `backLabel` | `string` | `'Back'` | Custom Back button label |
| `cancelLabel` | `string` | `'Cancel'` | Custom Cancel button label |
| `canGoBack` | `boolean` | `true` | Disables Back if false |

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Cancel]                      [← Back]    [Next →]     │
│   ghost                        secondary    primary     │
└─────────────────────────────────────────────────────────┘
```

### Usage in Wizard

```jsx
<WizardNavigation
  onBack={goBack}
  onNext={handleNext}
  onCancel={handleCancel}
  isFirstStep={currentStepIndex === 0}
  isLastStep={isLastStep}
  isValid={canGoNext}
  isSubmitting={isSubmitting}
  nextLabel={isLastStep ? 'Complete' : 'Next'}
  canGoBack={canGoBack}
/>
```

## Button States

### Next Button

| State | Label | Disabled |
|-------|-------|----------|
| Default | `Next →` | `!isValid` |
| Last step | `Complete` | `!isValid` |
| Submitting | `Processing...` | `true` |

### Back Button

| State | Visibility | Disabled |
|-------|------------|----------|
| First step | Hidden | - |
| Other steps | Visible | `isSubmitting \|\| !canGoBack` |

### Cancel Button

| State | Disabled |
|-------|----------|
| Normal | `false` |
| Submitting | `true` |

## Navigation Flow

```
Step 1        Step 2        Step 3        Step 4
[Cancel]      [Cancel]      [Cancel]      [Cancel]
              [Back]        [Back]        [Back]
[Next →]      [Next →]      [Next →]      [Complete]
```

## Custom Navigation

For specialized navigation needs, you can use the wizard hook values directly:

```jsx
const wizard = useWizard({ steps, initialData, onComplete });

// Custom navigation logic
const handleSpecialNext = async () => {
  if (wizard.isLastStep) {
    // Custom completion logic
    await wizard.submit();
    navigate('/success');
  } else if (shouldSkipStep(wizard.currentStepIndex)) {
    // Skip a step
    wizard.goToStep(wizard.currentStepIndex + 2);
  } else {
    wizard.goNext();
  }
};
```

## CSS Styling

Location: `client/src/components/wizard/WizardNavigation.module.css`

```css
.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-top: 2px solid var(--win98-border-dark);
  background: var(--color-bg-primary);
}

.actions {
  display: flex;
  gap: var(--space-3);
}
```

## Accessibility

- Cancel uses `ghost` variant (less prominent)
- Back uses `secondary` variant
- Next/Complete uses `primary` variant (most prominent)
- All buttons disabled during submission
- Proper focus management between steps
