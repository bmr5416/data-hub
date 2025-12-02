# Wizard State Management

## useWizard Hook

Location: `client/src/hooks/useWizard.js`

### Usage

```jsx
import { useWizard } from '../../hooks/useWizard';

const wizard = useWizard({
  steps,
  initialData,
  onComplete
});
```

### Input Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `steps` | `array` | Array of step definitions |
| `initialData` | `object` | Initial wizard data state |
| `onComplete` | `function` | Called with final data on completion |

### Return Values

```javascript
const {
  // State
  currentStepIndex,  // number: 0-based index
  currentStep,       // object: current step definition
  data,              // object: accumulated wizard data
  visitedSteps,      // Set: indices of visited steps
  isSubmitting,      // boolean: submission in progress
  error,             // string|null: error message

  // Computed
  canGoBack,         // boolean: can navigate backward
  canGoNext,         // boolean: current step is valid
  isLastStep,        // boolean: on final step

  // Actions
  goToStep,          // (index) => void: navigate to step
  goBack,            // () => void: go to previous step
  goNext,            // () => void: go to next step
  updateData,        // (updates) => void: merge data updates
  reset,             // () => void: reset to initial state
  submit,            // () => Promise: call onComplete
} = wizard;
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Wizard Component                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │            useWizard Hook                         │   │
│  │                                                   │   │
│  │  data: { field1, field2, ... }                   │   │
│  │         ↑                                         │   │
│  │         │ updateData({ fieldX: value })          │   │
│  │         │                                         │   │
│  └─────────┼────────────────────────────────────────┘   │
│            │                                             │
│  ┌─────────┴────────────────────────────────────────┐   │
│  │          Step Component                           │   │
│  │                                                   │   │
│  │  <input onChange={(e) =>                         │   │
│  │    onChange({ fieldX: e.target.value })          │   │
│  │  } />                                            │   │
│  │                                                   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## State Persistence

Data persists across steps within the wizard:

```jsx
// Step 1 sets:
onChange({ platformId: 'meta-ads' });

// Step 2 can read:
const platformId = data.platformId; // 'meta-ads'

// Step 2 adds more data:
onChange({ warehouseId: 'wh-123' });

// Final data has both:
// { platformId: 'meta-ads', warehouseId: 'wh-123' }
```

## Validation

### Per-Step Validation

```javascript
const steps = [
  {
    id: 'platform',
    title: 'Select Platform',
    component: PlatformStep,
    isValid: (data) => Boolean(data.platformId),
  },
  {
    id: 'config',
    title: 'Configuration',
    component: ConfigStep,
    isValid: (data) => data.fields?.length > 0,
  },
];
```

### Conditional Navigation

```jsx
// canGoNext is automatically false if isValid returns false
<Button
  disabled={!canGoNext || isSubmitting}
  onClick={goNext}
>
  Next
</Button>
```

## Reset Behavior

```jsx
const handleCancel = () => {
  reset();  // Resets: currentStepIndex=0, data=initialData, visitedSteps={0}
  onCancel?.();
};

const handleComplete = async () => {
  await submit();
  reset();  // Clean up after successful completion
};
```

## Error Handling

```jsx
// The hook manages error state
const handleSubmit = async () => {
  try {
    setIsSubmitting(true);
    await onComplete(data);
  } catch (err) {
    setError(err.message);  // Displayed by Wizard component
    throw err;
  } finally {
    setIsSubmitting(false);
  }
};
```
