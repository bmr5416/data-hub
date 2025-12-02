# Audio System

Windows 95-style sound effects for UI interactions. Part of the Win98 dungeon aesthetic.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUDIO SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AudioContext.jsx (Provider)                                    │
│       │                                                         │
│       ├── audioEnabled (localStorage persisted)                 │
│       ├── playSound(soundId)                                    │
│       └── toggleAudio()                                         │
│                                                                 │
│  useAudio.js (Hook)                                            │
│       │                                                         │
│       ├── playClick()          → ui.click                       │
│       ├── playToggle()         → ui.toggle                      │
│       ├── playTab()            → ui.tab                         │
│       ├── playModalOpen()      → modal.open                     │
│       ├── playModalClose()     → modal.close                    │
│       ├── playSuccess()        → feedback.success               │
│       ├── playError()          → feedback.error                 │
│       ├── playWarning()        → feedback.warning               │
│       ├── playWizardStep()     → wizard.step                    │
│       ├── playWizardComplete() → wizard.complete                │
│       ├── playImpInteract()    → imp.interact                   │
│       ├── playImpAppear()      → imp.appear                     │
│       └── playImpDismiss()     → imp.dismiss                    │
│                                                                 │
│  audioSounds.js (Data)                                         │
│       │                                                         │
│       └── Sound definitions (volume, debounce, priority)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Sound Tokens

### UI Sounds (High Frequency, Subtle)
| Token | Duration | Volume | Use Case |
|-------|----------|--------|----------|
| `ui.click` | 67ms | 0.3 | Button clicks |
| `ui.toggle` | 93ms | 0.3 | Switch/checkbox |
| `ui.tab` | 60ms | 0.15 | Tab selection |

### Modal Sounds (Medium Frequency)
| Token | Duration | Volume | Use Case |
|-------|----------|--------|----------|
| `modal.open` | 273ms | 0.5 | Dialog appears |
| `modal.close` | 272ms | 0.3 | Dialog dismissed |

### Feedback Sounds (Low Frequency, Important)
| Token | Duration | Volume | Use Case |
|-------|----------|--------|----------|
| `feedback.success` | 350ms | 0.5 | Success operations |
| `feedback.error` | 265ms | 0.5 | Error notifications |
| `feedback.warning` | 300ms | 0.5 | Warning alerts |

### Wizard Sounds (Low Frequency)
| Token | Duration | Volume | Use Case |
|-------|----------|--------|----------|
| `wizard.step` | 305ms | 0.5 | Step advancement |
| `wizard.complete` | 516ms | 0.6 | Wizard completion |

### Imp Character Sounds
| Token | Duration | Volume | Use Case |
|-------|----------|--------|----------|
| `imp.interact` | 195ms | 0.5 | Imp clicked/speaks |
| `imp.appear` | 282ms | 0.3 | Imp shows up |
| `imp.dismiss` | 174ms | 0.3 | Imp minimizes |

## Integration Patterns

### Button Click Sound
```jsx
import { useAudio } from '../../hooks/useAudio';

function MyComponent() {
  const { playClick } = useAudio();

  const handleClick = useCallback((e) => {
    playClick();
    onClick?.(e);
  }, [playClick, onClick]);

  return <button onClick={handleClick}>Click</button>;
}
```

### Modal Open/Close Sound
```jsx
import { useAudio } from '../../hooks/useAudio';

function MyModal({ isOpen, onClose }) {
  const { playModalOpen, playModalClose } = useAudio();

  // Play on open
  useEffect(() => {
    if (isOpen) playModalOpen();
  }, [isOpen, playModalOpen]);

  // Play on close
  const handleClose = useCallback(() => {
    playModalClose();
    onClose?.();
  }, [playModalClose, onClose]);

  return <Modal onClose={handleClose}>...</Modal>;
}
```

### Wizard Step Sound
```jsx
import { useAudio } from '../../hooks/useAudio';

function MyWizard() {
  const { playWizardStep, playWizardComplete } = useAudio();

  const handleNext = useCallback(async () => {
    if (isLastStep) {
      await submit();
      playWizardComplete();
    } else {
      playWizardStep();
      goNext();
    }
  }, [isLastStep, submit, goNext, playWizardStep, playWizardComplete]);
}
```

## Required Integrations

Components that **MUST** have audio integration:

| Component | Sounds Required |
|-----------|-----------------|
| `Button.jsx` | `playClick()` |
| `Modal.jsx` | `playModalOpen()`, `playModalClose()` |
| `Wizard.jsx` | `playWizardStep()`, `playWizardComplete()` |
| `Imp.jsx` | `playImpInteract()`, `playImpAppear()`, `playImpDismiss()` |
| `AudioToggle.jsx` | `playToggle()` |

Components that **SHOULD** have audio integration:

| Component | Sounds Recommended |
|-----------|-------------------|
| Tab components | `playTab()` on tab change |
| Form submissions | `playSuccess()` on success, `playError()` on failure |
| Alert/notification | `playWarning()` or `playError()` |
| File upload | `playSuccess()` on complete |

## CSS Audio Tokens

Defined in `client/src/styles/index.css`:

```css
:root {
  /* Volume levels (0-1 scale) */
  --audio-volume-muted: 0;
  --audio-volume-low: 0.15;
  --audio-volume-medium-low: 0.3;
  --audio-volume-medium: 0.5;
  --audio-volume-medium-high: 0.6;
  --audio-volume-high: 0.7;
  --audio-volume-max: 1.0;

  /* Category default volumes */
  --audio-level-ui: var(--audio-volume-medium-low);
  --audio-level-feedback: var(--audio-volume-medium);
  --audio-level-alert: var(--audio-volume-high);
  --audio-level-ambient: var(--audio-volume-medium-low);

  /* Timing */
  --audio-fade-duration: 150ms;
  --audio-debounce-ui: 50ms;
  --audio-debounce-feedback: 200ms;
}
```

## Source Files

| File | Purpose |
|------|---------|
| `client/src/data/audioSounds.js` | Sound definitions |
| `client/src/contexts/AudioContext.jsx` | Audio state provider |
| `client/src/hooks/useAudio.js` | Audio playback hook |
| `client/src/components/common/AudioToggle.jsx` | Mute toggle component |
| `client/public/assets/sounds/` | MP3 sound files |

## Sound Source

**Juhani Junkala "Essential Retro Video Game Sound Effects Collection"**
- License: CC0 (Public Domain)
- URL: https://opengameart.org/content/512-sound-effects-8-bit-style
