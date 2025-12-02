# Animation Definitions

## Technical Specs

| Property | Value |
|----------|-------|
| Frame size | 32×32 pixels |
| Grid layout | 10 columns × 6 rows |
| Frames per sprite | 60 |
| Frame duration | 30ms |
| Loop duration | ~1.8 seconds |

## Animation Types

### Spin
Rotational animation for loading/progress.

```javascript
hourglass: {
  animations: {
    spin: { frames: generateFrames(0), loop: true },
  },
}
```

**Used by**: hourglass, coin

### Pulse
Breathing/pulsing animation for status.

```javascript
heartGreen: {
  animations: {
    pulse: { frames: generateFrames(1), loop: true },
  },
}
```

**Used by**: star, all hearts

### Bubble
Bubbling animation for fluid/chemistry.

```javascript
tubeGreen: {
  animations: {
    bubble: { frames: generateFrames(5), loop: true },
  },
}
```

**Used by**: all tubes

### Idle
Subtle idle animation for static icons.

```javascript
floppy: {
  animations: {
    idle: { frames: generateFrames(0), loop: true },
  },
}
```

**Used by**: all platform sprites

## Frame Generation

Each sprite has 60 frames arranged in a 10×6 grid:

```javascript
function generateFrames(assetRow, duration = 30) {
  const frames = [];
  const baseY = assetRow * 6 * 32; // 6 rows per asset

  for (let i = 0; i < 60; i++) {
    const col = i % 10;
    const row = Math.floor(i / 10);
    frames.push({
      x: col * 32,
      y: baseY + row * 32,
      duration,
    });
  }
  return frames;
}
```

## Accessibility

PSXSprite respects reduced motion preferences:

```javascript
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // Show first frame only, no animation
  setCurrentFrame({ x: frames[0].x, y: frames[0].y });
}
```

## Controlling Animations

### Pause Animation
```jsx
<PSXSprite sprite="hourglass" paused={true} />
```

### Specific Animation
```jsx
<PSXSprite sprite="heartGreen" animation="pulse" />
```

### Custom Duration (not exposed, but possible)
Animation timing is defined in psxAnimations.js. Default is 30ms per frame.

## Integration with Loading States

```jsx
import { LoadingAnimation } from '../common/LoadingAnimation';

// LoadingAnimation uses PSXSprite internally
<LoadingAnimation /> // Shows hourglass + fun messages
```

## Performance Notes

- Sprites are memoized with React.memo
- Animation frames use setTimeout (not requestAnimationFrame)
- Cleanup on unmount prevents memory leaks
- Image rendering set to `pixelated` for crisp pixels
