# Available Sprites

## Sprite Sheets

All sprites live in `client/public/assets/psx/`:

| File | Contents |
|------|----------|
| `ui-sprites.png` | Hourglass, Star, Coin |
| `status-sprites.png` | Hearts (4 colors), Tubes (3 colors) |
| `platform-sprites.png` | Floppy, Monitor, Lock, Gameboy |

## UI Sprites

### Hourglass
- **Sprite**: `hourglass`
- **Sheet**: `ui-sprites.png`
- **Animation**: `spin` (looping)
- **Use**: Loading states, wait indicators

```jsx
<PSXSprite sprite="hourglass" animation="spin" />
```

### Star
- **Sprite**: `star`
- **Sheet**: `ui-sprites.png`
- **Animation**: `pulse` (looping)
- **Use**: Favorites, ratings, highlights

```jsx
<PSXSprite sprite="star" animation="pulse" />
```

### Coin
- **Sprite**: `coin`
- **Sheet**: `ui-sprites.png`
- **Animation**: `spin` (looping)
- **Use**: Currency, rewards, points

```jsx
<PSXSprite sprite="coin" animation="spin" />
```

## Status Sprites - Hearts

### Heart Green
- **Sprite**: `heartGreen`
- **Animation**: `pulse`
- **Status**: `active`

### Heart Blue
- **Sprite**: `heartBlue`
- **Animation**: `pulse`
- **Status**: `connected`, `inactive`

### Heart Red
- **Sprite**: `heartRed`
- **Animation**: `pulse`
- **Status**: `error`, `disconnected`

### Heart Yellow
- **Sprite**: `heartYellow`
- **Animation**: `pulse`
- **Status**: `pending`, `onboarding`

## Status Sprites - Tubes

### Tube Green
- **Sprite**: `tubeGreen`
- **Animation**: `bubble`
- **Status**: `active` (ETL running)

### Tube Blue
- **Sprite**: `tubeBlue`
- **Animation**: `bubble`
- **Status**: `paused`, `deprecated`

### Tube Red
- **Sprite**: `tubeRed`
- **Animation**: `bubble`
- **Status**: `error`

## Platform Sprites

### Floppy Disk
- **Sprite**: `floppy`
- **Animation**: `idle`
- **Category**: `warehouse`, `data-warehouse`
- **Use**: Data warehouse indicators

### Monitor
- **Sprite**: `monitor`
- **Animation**: `idle`
- **Category**: `integration`, `api`
- **Use**: API connections, integrations

### Lock
- **Sprite**: `lock`
- **Animation**: `idle`
- **Category**: `auth`, `security`
- **Use**: Authentication, permissions

### Gameboy
- **Sprite**: `gameboy`
- **Animation**: `idle`
- **Category**: `mobile`, `app`
- **Use**: Mobile apps, portable devices

## Status Mapping

```javascript
// Heart status mapping
const heartStatusMap = {
  active: 'heartGreen',
  connected: 'heartBlue',
  error: 'heartRed',
  pending: 'heartYellow',
  onboarding: 'heartYellow',
  inactive: 'heartBlue',
  disconnected: 'heartRed',
};

// Tube status mapping
const tubeStatusMap = {
  active: 'tubeGreen',
  error: 'tubeRed',
  paused: 'tubeBlue',
  deprecated: 'tubeBlue',
};

// Platform category mapping
const platformCategoryMap = {
  warehouse: 'floppy',
  'data-warehouse': 'floppy',
  integration: 'monitor',
  api: 'monitor',
  auth: 'lock',
  security: 'lock',
  mobile: 'gameboy',
  app: 'gameboy',
};
```
