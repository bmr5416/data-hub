# Data Hub Audio System

Windows 95-style sound effects for UI interactions.

## Source

**Juhani Junkala "Essential Retro Video Game Sound Effects Collection"**
- License: CC0 (Public Domain)
- URL: https://opengameart.org/content/512-sound-effects-8-bit-style

## Sound Reference

### UI Sounds (`/ui/`)
| File | Token | Duration | Use Case |
|------|-------|----------|----------|
| `click.mp3` | `ui.click` | 67ms | Button clicks |
| `toggle.mp3` | `ui.toggle` | 93ms | Switch/checkbox toggles |
| `tab.mp3` | `ui.tab` | 60ms | Tab selection |

### Modal Sounds (`/modal/`)
| File | Token | Duration | Use Case |
|------|-------|----------|----------|
| `open.mp3` | `modal.open` | 273ms | Modal/dialog appears |
| `close.mp3` | `modal.close` | 272ms | Modal/dialog dismissed |

### Transition Sounds (`/transition/`)
| File | Token | Duration | Use Case |
|------|-------|----------|----------|
| `page.mp3` | `transition.page` | 259ms | Page navigation |

### Feedback Sounds (`/feedback/`)
| File | Token | Duration | Use Case |
|------|-------|----------|----------|
| `success.mp3` | `feedback.success` | 350ms | Successful operations |
| `error.mp3` | `feedback.error` | 265ms | Error notifications |
| `warning.mp3` | `feedback.warning` | 300ms | Warning alerts |

### Wizard Sounds (`/wizard/`)
| File | Token | Duration | Use Case |
|------|-------|----------|----------|
| `step.mp3` | `wizard.step` | 305ms | Step completion |
| `complete.mp3` | `wizard.complete` | 516ms | Wizard completion |

### Data Sounds (`/data/`)
| File | Token | Duration | Use Case |
|------|-------|----------|----------|
| `upload.mp3` | `data.upload` | 294ms | Upload complete |

### Notification Sounds (`/notification/`)
| File | Token | Duration | Use Case |
|------|-------|----------|----------|
| `alert.mp3` | `notification.alert` | 510ms | System alerts |

### Imp Character Sounds (`/imp/`)
| File | Token | Duration | Use Case |
|------|-------|----------|----------|
| `interact.mp3` | `imp.interact` | 195ms | Imp clicked/speaking |
| `appear.mp3` | `imp.appear` | 282ms | Imp shows up |
| `dismiss.mp3` | `imp.dismiss` | 174ms | Imp minimizes |

## Usage

```jsx
import { useAudio } from '../../hooks/useAudio';

function MyComponent() {
  const { playClick, playModalOpen, playSuccess } = useAudio();

  return (
    <button onClick={() => {
      playClick();
      // ... action
    }}>
      Click Me
    </button>
  );
}
```

## Architecture

```
sounds/
├── ui/                 # UI interaction sounds
│   ├── click.mp3
│   ├── toggle.mp3
│   └── tab.mp3
├── modal/              # Dialog sounds
│   ├── open.mp3
│   └── close.mp3
├── transition/         # Navigation sounds
│   └── page.mp3
├── feedback/           # User feedback sounds
│   ├── success.mp3
│   ├── error.mp3
│   └── warning.mp3
├── wizard/             # Wizard progression sounds
│   ├── step.mp3
│   └── complete.mp3
├── data/               # Data operation sounds
│   └── upload.mp3
├── notification/       # Alert sounds
│   └── alert.mp3
└── imp/                # Imp character sounds
    ├── interact.mp3
    ├── appear.mp3
    └── dismiss.mp3
```

## Configuration

Sound definitions are in `client/src/data/audioSounds.js`:
- Volume levels per sound
- Priority (higher priority interrupts lower)
- Debounce timing (prevents rapid-fire)
- Preload flags

Audio state is managed by `client/src/contexts/AudioContext.jsx`:
- Global on/off toggle
- localStorage persistence
- Audio element caching

## Technical Specs

- Format: MP3 (128kbps)
- Sample Rate: 44.1kHz
- Channels: Mono
- Total Size: ~83KB (all 16 sounds)

## Development

To modify sounds, see `/dev-assets/audio/README.md` for:
- Sound analysis tools
- Selection criteria
- Conversion scripts
