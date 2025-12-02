/**
 * PSX Pixel Art Sprite Animation Definitions
 *
 * Retro PlayStation 1 style assets for Data Hub UI
 * Source: PSX Asset Pack (animated GIFs converted to sprite sheets)
 *
 * Grid layout: 10 columns × 6 rows per asset (60 frames)
 * Frame size: 32×32px
 * Frame duration: 30ms (1.8s loop)
 */

// Frame dimensions
export const FRAME_SIZE = 32;
export const GRID_COLS = 10;
export const GRID_ROWS = 6;
export const FRAMES_PER_ASSET = 60;
export const FRAME_DURATION = 30;

// Sprite sheet paths
export const SPRITE_PATHS = {
  ui: '/assets/psx/ui-sprites.png',
  status: '/assets/psx/status-sprites.png',
  platform: '/assets/psx/platform-sprites.png',
};

// Size scale tokens (matches design system)
export const SIZES = {
  xs: 16,   // Inline icons
  sm: 24,   // Badges, status
  md: 32,   // Cards, buttons (native size)
  lg: 48,   // Hero elements
};

/**
 * Generate frame coordinates for a 60-frame animation
 * @param {number} assetRow - Row index of asset in sprite sheet (0-based)
 * @param {number} duration - Frame duration in ms (default 30)
 * @returns {Array} Array of frame objects with x, y, duration
 */
function generateFrames(assetRow, duration = FRAME_DURATION) {
  const frames = [];
  const baseY = assetRow * GRID_ROWS * FRAME_SIZE;

  for (let i = 0; i < FRAMES_PER_ASSET; i++) {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    frames.push({
      x: col * FRAME_SIZE,
      y: baseY + row * FRAME_SIZE,
      duration,
    });
  }
  return frames;
}

/**
 * PSX Sprite definitions
 *
 * Each sprite has:
 * - sheet: which sprite sheet to use
 * - row: row index in the sheet (each asset takes 192px = 6 rows of 32px)
 * - animations: named animation sequences
 */
export const sprites = {
  // ===== UI SPRITES (ui-sprites.png) =====

  hourglass: {
    sheet: 'ui',
    row: 0,
    animations: {
      spin: { frames: generateFrames(0), loop: true },
    },
  },

  star: {
    sheet: 'ui',
    row: 1,
    animations: {
      pulse: { frames: generateFrames(1), loop: true },
    },
  },

  coin: {
    sheet: 'ui',
    row: 2,
    animations: {
      spin: { frames: generateFrames(2), loop: true },
    },
  },

  // ===== STATUS SPRITES (status-sprites.png) =====

  heartRed: {
    sheet: 'status',
    row: 0,
    status: 'error',
    animations: {
      pulse: { frames: generateFrames(0), loop: true },
    },
  },

  heartGreen: {
    sheet: 'status',
    row: 1,
    status: 'active',
    animations: {
      pulse: { frames: generateFrames(1), loop: true },
    },
  },

  heartBlue: {
    sheet: 'status',
    row: 2,
    status: 'connected',
    animations: {
      pulse: { frames: generateFrames(2), loop: true },
    },
  },

  heartYellow: {
    sheet: 'status',
    row: 3,
    status: 'pending',
    animations: {
      pulse: { frames: generateFrames(3), loop: true },
    },
  },

  tubeRed: {
    sheet: 'status',
    row: 4,
    status: 'error',
    animations: {
      bubble: { frames: generateFrames(4), loop: true },
    },
  },

  tubeGreen: {
    sheet: 'status',
    row: 5,
    status: 'active',
    animations: {
      bubble: { frames: generateFrames(5), loop: true },
    },
  },

  tubeBlue: {
    sheet: 'status',
    row: 6,
    status: 'paused',
    animations: {
      bubble: { frames: generateFrames(6), loop: true },
    },
  },

  // ===== PLATFORM SPRITES (platform-sprites.png) =====

  floppy: {
    sheet: 'platform',
    row: 0,
    category: 'warehouse',
    animations: {
      idle: { frames: generateFrames(0), loop: true },
    },
  },

  monitor: {
    sheet: 'platform',
    row: 1,
    category: 'integration',
    animations: {
      idle: { frames: generateFrames(1), loop: true },
    },
  },

  lock: {
    sheet: 'platform',
    row: 2,
    category: 'auth',
    animations: {
      idle: { frames: generateFrames(2), loop: true },
    },
  },

  gameboy: {
    sheet: 'platform',
    row: 3,
    category: 'mobile',
    animations: {
      idle: { frames: generateFrames(3), loop: true },
    },
  },
};

// Helper: Get sprite by status value
export const getHeartByStatus = (status) => {
  const statusMap = {
    active: 'heartGreen',
    connected: 'heartBlue',
    error: 'heartRed',
    pending: 'heartYellow',
    onboarding: 'heartYellow',
    inactive: 'heartBlue',
    disconnected: 'heartRed',
  };
  return sprites[statusMap[status]] || sprites.heartBlue;
};

// Helper: Get tube by status value
export const getTubeByStatus = (status) => {
  const statusMap = {
    active: 'tubeGreen',
    error: 'tubeRed',
    paused: 'tubeBlue',
    deprecated: 'tubeBlue',
  };
  return sprites[statusMap[status]] || sprites.tubeBlue;
};

// Helper: Get platform icon by category
export const getPlatformIcon = (category) => {
  const categoryMap = {
    warehouse: 'floppy',
    'data-warehouse': 'floppy',
    integration: 'monitor',
    api: 'monitor',
    auth: 'lock',
    security: 'lock',
    mobile: 'gameboy',
    app: 'gameboy',
  };
  return sprites[categoryMap[category]] || sprites.monitor;
};
