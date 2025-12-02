/**
 * Mimic Chest Animation Definitions
 * Sprite source: OpenGameArt - "Chest and Mimic" by IndigoFenix/Redshrike
 * License: CC-BY 3.0 (Credit: Stephen Challener/Redshrike)
 * URL: https://opengameart.org/content/chest-and-mimic
 *
 * Sprite sheet: 80x96px (5 columns × 6 rows of 16×16 frames)
 * Layout (based on RPG chest conventions):
 *   Row 0: Down-facing chest states (closed, opening, open, mimic-closed, mimic-open)
 *   Row 1: Left-facing chest states
 *   Row 2: Right-facing chest states
 *   Row 3: Up-facing chest states
 *   Row 4-5: Additional mimic animation frames
 *
 * For our minimized Imp icon, we use the down-facing (front) view.
 */

// Frame dimensions
export const MIMIC_FRAME_WIDTH = 16;
export const MIMIC_FRAME_HEIGHT = 16;
export const MIMIC_SPRITE_PATH = '/agents/Mimic/chest_mimic.png';

// Display size (scaled up for visibility)
export const MIMIC_DISPLAY_SIZE = 48; // 16px × 3 = 48px

/**
 * Animation definitions
 * Each frame: { x, y, duration }
 *   - x, y: position in sprite sheet (pixels)
 *   - duration: milliseconds to display frame
 */
export const mimicAnimations = {
  // Dormant closed chest - single frame, static
  HiddenIdle: {
    frames: [
      { x: 0, y: 0, duration: 1000 }
    ],
    loop: true
  },

  // Chest with eyes peeking through (mimic reveal tease)
  // Uses mimic-closed frame which shows subtle eyes
  RevealedIdle: {
    frames: [
      { x: 48, y: 0, duration: 200 },  // Mimic closed (eyes visible)
      { x: 48, y: 0, duration: 800 },  // Hold
      { x: 48, y: 0, duration: 200 },  // Still visible
      { x: 0, y: 0, duration: 100 },   // Quick return to normal
    ],
    loop: false
  },

  // Quick peek - eyes briefly visible then hide
  QuickPeek: {
    frames: [
      { x: 0, y: 0, duration: 100 },   // Normal chest
      { x: 48, y: 0, duration: 150 },  // Eyes peek
      { x: 48, y: 0, duration: 300 },  // Hold briefly
      { x: 0, y: 0, duration: 100 },   // Return to normal
    ],
    loop: false
  },

  // Surprise attack - chest opens revealing mimic mouth
  SurpriseAttack: {
    frames: [
      { x: 0, y: 0, duration: 100 },   // Closed chest
      { x: 16, y: 0, duration: 80 },   // Starting to open
      { x: 32, y: 0, duration: 80 },   // Opening more
      { x: 64, y: 0, duration: 150 },  // Mimic fully revealed!
      { x: 64, y: 0, duration: 200 },  // Hold reveal
    ],
    loop: false
  },

  // Idle with subtle movement (alternate between normal and slightly open)
  IdleBreathe: {
    frames: [
      { x: 0, y: 0, duration: 2000 },  // Closed
      { x: 16, y: 0, duration: 300 },  // Slight movement (breathing)
      { x: 0, y: 0, duration: 2000 },  // Closed again
    ],
    loop: true
  },

  // Excited wiggle (when user hovers for a while)
  Wiggle: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 0, y: 16, duration: 100 },  // Shift to left-facing row
      { x: 0, y: 0, duration: 100 },
      { x: 0, y: 32, duration: 100 },  // Shift to right-facing row
      { x: 0, y: 0, duration: 100 },
    ],
    loop: false
  }
};

/**
 * Get animation by name with fallback
 */
export function getMimicAnimation(name) {
  return mimicAnimations[name] || mimicAnimations.HiddenIdle;
}

/**
 * Get list of all animation names
 */
export function getMimicAnimationNames() {
  return Object.keys(mimicAnimations);
}

/**
 * Calculate total duration of an animation
 */
export function getMimicAnimationDuration(name) {
  const animation = getMimicAnimation(name);
  return animation.frames.reduce((total, frame) => total + frame.duration, 0);
}

/**
 * Check if animation should loop
 */
export function isMimicAnimationLoop(name) {
  const animation = getMimicAnimation(name);
  return animation.loop === true;
}
