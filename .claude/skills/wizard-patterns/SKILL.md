---
name: wizard-patterns
description: Multi-step wizard patterns for Data Hub. Use when building wizards, wizard steps, or multi-step forms. Covers Wizard container, step components, navigation, and state management.
---

# Wizard Patterns

Data Hub uses a reusable wizard system for multi-step flows. This skill covers the architecture and patterns.

## Architecture Overview

```
┌─────────────────────────────────────┐
│  Header (h1 + subtitle, gold)       │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │ WizardProgress (1─2─3─4)        ││
│  ├─────────────────────────────────┤│
│  │ Step Content (scrollable)       ││
│  │   <CurrentStepComponent         ││
│  │     data={data}                 ││
│  │     onChange={updateData}       ││
│  │   />                            ││
│  ├─────────────────────────────────┤│
│  │ WizardNavigation                ││
│  │   Cancel | Back | Next          ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Quick Start

### Using the Wizard Component

```jsx
import Wizard from '../components/wizard/Wizard';

const steps = [
  {
    id: 'step1',
    title: 'Step 1 Title',
    component: Step1Component,
    isValid: (data) => Boolean(data.requiredField),
  },
  {
    id: 'step2',
    title: 'Step 2 Title',
    component: Step2Component,
  },
];

<Wizard
  steps={steps}
  initialData={{ requiredField: '' }}
  onComplete={handleComplete}
  onCancel={handleCancel}
  title="Wizard Title"
  subtitle="Wizard description"
/>
```

### Creating a Step Component

```jsx
export default function MyStep({ data, onChange }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Step Title</h3>
        <p className={styles.description}>Step description</p>
      </div>
      <input
        value={data.fieldName || ''}
        onChange={(e) => onChange({ fieldName: e.target.value })}
      />
    </div>
  );
}

MyStep.propTypes = {
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
```

## Files in This Skill

- [STEP-TEMPLATE.md](STEP-TEMPLATE.md) - Step component boilerplate
- [STATE-MANAGEMENT.md](STATE-MANAGEMENT.md) - useWizard hook patterns
- [NAVIGATION.md](NAVIGATION.md) - WizardNavigation component usage

## Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Wizard | `components/wizard/Wizard.jsx` | Main container |
| WizardProgress | `components/wizard/WizardProgress.jsx` | Step indicator |
| WizardNavigation | `components/wizard/WizardNavigation.jsx` | Cancel/Back/Next |
| useWizard | `hooks/useWizard.js` | State management |

## Step Definition Shape

```javascript
{
  id: string,           // Required: unique identifier
  title: string,        // Required: displayed in progress bar
  component: Component, // Required: React component
  isValid: (data) => boolean,  // Optional: validation function
  canSkip: boolean      // Optional: allow skipping this step
}
```

## Audio Integration

Wizards **MUST** include audio feedback for step progression:

```jsx
import { useAudio } from '../../hooks/useAudio';

function MyWizard() {
  const { playWizardStep, playWizardComplete } = useAudio();

  const handleNext = useCallback(async () => {
    if (isLastStep) {
      await submit();
      playWizardComplete();  // Celebration fanfare (516ms)
    } else {
      playWizardStep();       // Progress chime (305ms)
      goNext();
    }
  }, [isLastStep, submit, goNext, playWizardStep, playWizardComplete]);
}
```

| Action | Sound | Duration |
|--------|-------|----------|
| Step advancement | `playWizardStep()` | 305ms |
| Wizard completion | `playWizardComplete()` | 516ms |

## Existing Wizards

- **SourceWizard** - `components/source-wizard/SourceWizard.jsx`
- **DataWarehouseWizard** - `components/warehouse/DataWarehouseWizard.jsx`
