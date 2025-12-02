/**
 * Clippy Animation Definitions - Complete Library
 * Extracted from ClippyJS (MIT License)
 * Source: https://github.com/pi0/clippyjs/blob/master/assets/agents/Clippy/agent.js
 *
 * Includes 40+ animations for idle states, expressions, gestures, and actions
 */

// Frame dimensions from the original Clippy sprite sheet
export const FRAME_WIDTH = 124;
export const FRAME_HEIGHT = 93;
export const SPRITE_PATH = '/agents/Clippy/map.png';

/**
 * Animation definitions with frame coordinates
 * Each frame has: { x, y, duration }
 * - x, y: position in sprite sheet (pixels)
 * - duration: milliseconds to display frame
 */
export const animations = {
  // ===== IDLE STATES =====

  // Default idle state - single frame
  Idle: {
    frames: [
      { x: 0, y: 0, duration: 400 }
    ],
    useQueue: false
  },

  // Idle looking around (37 frames)
  IdleSideToSide: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 2108, y: 744, duration: 100 },
      { x: 2232, y: 744, duration: 100 },
      { x: 2356, y: 744, duration: 100 },
      { x: 2480, y: 744, duration: 300 },
      { x: 2604, y: 744, duration: 100 },
      { x: 2728, y: 744, duration: 100 },
      { x: 2852, y: 744, duration: 300 },
      { x: 2976, y: 744, duration: 100 },
      { x: 3100, y: 744, duration: 100 },
      { x: 3224, y: 744, duration: 300 },
      { x: 0, y: 837, duration: 100 },
      { x: 124, y: 837, duration: 100 },
      { x: 248, y: 837, duration: 300 },
      { x: 372, y: 837, duration: 100 },
      { x: 496, y: 837, duration: 100 },
      { x: 620, y: 837, duration: 300 },
      { x: 744, y: 837, duration: 100 },
      { x: 868, y: 837, duration: 100 },
      { x: 992, y: 837, duration: 300 },
      { x: 1116, y: 837, duration: 100 },
      { x: 1240, y: 837, duration: 100 },
      { x: 1364, y: 837, duration: 300 },
      { x: 1488, y: 837, duration: 100 },
      { x: 1612, y: 837, duration: 100 },
      { x: 1736, y: 837, duration: 300 },
      { x: 1860, y: 837, duration: 100 },
      { x: 1984, y: 837, duration: 100 },
      { x: 2108, y: 837, duration: 300 },
      { x: 2232, y: 837, duration: 100 },
      { x: 2356, y: 837, duration: 100 },
      { x: 2480, y: 837, duration: 300 },
      { x: 2604, y: 837, duration: 100 },
      { x: 2728, y: 837, duration: 100 },
      { x: 2852, y: 837, duration: 300 },
      { x: 2976, y: 837, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Idle with atom animation (45 frames)
  IdleAtom: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 124, y: 93, duration: 100 },
      { x: 248, y: 93, duration: 100 },
      { x: 372, y: 93, duration: 100 },
      { x: 496, y: 93, duration: 100 },
      { x: 620, y: 93, duration: 100 },
      { x: 744, y: 93, duration: 100 },
      { x: 868, y: 93, duration: 100 },
      { x: 992, y: 93, duration: 100 },
      { x: 1116, y: 93, duration: 100 },
      { x: 1240, y: 93, duration: 100 },
      { x: 1364, y: 93, duration: 100 },
      { x: 1488, y: 93, duration: 100 },
      { x: 1612, y: 93, duration: 100 },
      { x: 1736, y: 93, duration: 100 },
      { x: 1860, y: 93, duration: 100 },
      { x: 1984, y: 93, duration: 100 },
      { x: 2108, y: 93, duration: 100 },
      { x: 2232, y: 93, duration: 100 },
      { x: 2356, y: 93, duration: 100 },
      { x: 2480, y: 93, duration: 100 },
      { x: 2604, y: 93, duration: 100 },
      { x: 2728, y: 93, duration: 100 },
      { x: 2852, y: 93, duration: 100 },
      { x: 2976, y: 93, duration: 100 },
      { x: 3100, y: 93, duration: 100 },
      { x: 3224, y: 93, duration: 100 },
      { x: 0, y: 186, duration: 100 },
      { x: 124, y: 186, duration: 100 },
      { x: 248, y: 186, duration: 100 },
      { x: 372, y: 186, duration: 100 },
      { x: 496, y: 186, duration: 100 },
      { x: 620, y: 186, duration: 100 },
      { x: 744, y: 186, duration: 100 },
      { x: 868, y: 186, duration: 100 },
      { x: 992, y: 186, duration: 100 },
      { x: 992, y: 93, duration: 100 },
      { x: 868, y: 93, duration: 100 },
      { x: 744, y: 93, duration: 100 },
      { x: 620, y: 93, duration: 100 },
      { x: 496, y: 93, duration: 100 },
      { x: 372, y: 93, duration: 100 },
      { x: 248, y: 93, duration: 100 },
      { x: 124, y: 93, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Idle rope pile fidget (75 frames)
  IdleRopePile: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 1488, y: 186, duration: 100 },
      { x: 1612, y: 186, duration: 100 },
      { x: 1736, y: 186, duration: 100 },
      { x: 1860, y: 186, duration: 100 },
      { x: 1984, y: 186, duration: 100 },
      { x: 2108, y: 186, duration: 100 },
      { x: 2232, y: 186, duration: 100 },
      { x: 2356, y: 186, duration: 100 },
      { x: 2480, y: 186, duration: 100 },
      { x: 2604, y: 186, duration: 100 },
      { x: 2728, y: 186, duration: 100 },
      { x: 2852, y: 186, duration: 100 },
      { x: 2976, y: 186, duration: 100 },
      { x: 3100, y: 186, duration: 100 },
      { x: 3224, y: 186, duration: 100 },
      { x: 0, y: 279, duration: 100 },
      { x: 124, y: 279, duration: 100 },
      { x: 248, y: 279, duration: 100 },
      { x: 372, y: 279, duration: 100 },
      { x: 496, y: 279, duration: 100 },
      { x: 620, y: 279, duration: 100 },
      { x: 744, y: 279, duration: 100 },
      { x: 868, y: 279, duration: 100 },
      { x: 992, y: 279, duration: 100 },
      { x: 1116, y: 279, duration: 100 },
      { x: 1240, y: 279, duration: 100 },
      { x: 1364, y: 279, duration: 100 },
      { x: 1488, y: 279, duration: 100 },
      { x: 1612, y: 279, duration: 100 },
      { x: 1736, y: 279, duration: 100 },
      { x: 1860, y: 279, duration: 100 },
      { x: 1984, y: 279, duration: 100 },
      { x: 2108, y: 279, duration: 100 },
      { x: 2232, y: 279, duration: 100 },
      { x: 2356, y: 279, duration: 100 },
      { x: 2480, y: 279, duration: 100 },
      { x: 2604, y: 279, duration: 100 },
      { x: 2728, y: 279, duration: 100 },
      { x: 2852, y: 279, duration: 100 },
      { x: 2976, y: 279, duration: 100 },
      { x: 3100, y: 279, duration: 100 },
      { x: 3224, y: 279, duration: 100 },
      { x: 0, y: 372, duration: 100 },
      { x: 124, y: 372, duration: 100 },
      { x: 248, y: 372, duration: 100 },
      { x: 372, y: 372, duration: 100 },
      { x: 496, y: 372, duration: 100 },
      { x: 620, y: 372, duration: 100 },
      { x: 744, y: 372, duration: 100 },
      { x: 868, y: 372, duration: 100 },
      { x: 992, y: 372, duration: 100 },
      { x: 1116, y: 372, duration: 100 },
      { x: 1240, y: 372, duration: 100 },
      { x: 1364, y: 372, duration: 100 },
      { x: 1488, y: 372, duration: 100 },
      { x: 1612, y: 372, duration: 100 },
      { x: 1736, y: 372, duration: 100 },
      { x: 1860, y: 372, duration: 100 },
      { x: 1984, y: 372, duration: 100 },
      { x: 2108, y: 372, duration: 100 },
      { x: 2232, y: 372, duration: 100 },
      { x: 2356, y: 372, duration: 100 },
      { x: 2480, y: 372, duration: 100 },
      { x: 2604, y: 372, duration: 100 },
      { x: 2728, y: 372, duration: 100 },
      { x: 2604, y: 372, duration: 100 },
      { x: 2852, y: 372, duration: 100 },
      { x: 2604, y: 372, duration: 100 },
      { x: 2976, y: 372, duration: 100 },
      { x: 3100, y: 372, duration: 100 },
      { x: 3224, y: 372, duration: 100 },
      { x: 0, y: 465, duration: 100 },
      { x: 124, y: 465, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Idle head scratch (19 frames)
  IdleHeadScratch: {
    frames: [
      { x: 1984, y: 2418, duration: 100 },
      { x: 2108, y: 2418, duration: 100 },
      { x: 2232, y: 2418, duration: 100 },
      { x: 2356, y: 2418, duration: 100 },
      { x: 2480, y: 2418, duration: 100 },
      { x: 2604, y: 2418, duration: 100 },
      { x: 2728, y: 2418, duration: 100 },
      { x: 2852, y: 2418, duration: 100 },
      { x: 2976, y: 2418, duration: 100 },
      { x: 3100, y: 2418, duration: 100 },
      { x: 3224, y: 2418, duration: 100 },
      { x: 0, y: 2511, duration: 100 },
      { x: 124, y: 2511, duration: 100 },
      { x: 248, y: 2511, duration: 100 },
      { x: 372, y: 2511, duration: 100 },
      { x: 496, y: 2511, duration: 100 },
      { x: 620, y: 2511, duration: 100 },
      { x: 744, y: 2511, duration: 100 },
      { x: 868, y: 2511, duration: 100 }
    ],
    useQueue: true
  },

  // Idle finger tap (11 frames)
  IdleFingerTap: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 2976, y: 2976, duration: 100 },
      { x: 3100, y: 2976, duration: 100 },
      { x: 3224, y: 2976, duration: 100 },
      { x: 0, y: 3069, duration: 100 },
      { x: 124, y: 3069, duration: 100 },
      { x: 248, y: 3069, duration: 150 },
      { x: 372, y: 3069, duration: 100 },
      { x: 496, y: 3069, duration: 100 },
      { x: 620, y: 3069, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Idle eyebrow raise (7 frames)
  IdleEyeBrowRaise: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 1116, y: 186, duration: 100 },
      { x: 1240, y: 186, duration: 100 },
      { x: 1364, y: 186, duration: 900 },
      { x: 1240, y: 186, duration: 100 },
      { x: 1116, y: 186, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Idle snooze - SLEEP ANIMATION (84 frames with breathing, twitching, dreams)
  IdleSnooze: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 2480, y: 2046, duration: 100 },
      { x: 2604, y: 2046, duration: 100 },
      { x: 2728, y: 2046, duration: 100 },
      { x: 2852, y: 2046, duration: 100 },
      { x: 2976, y: 2046, duration: 100 },
      { x: 3100, y: 2046, duration: 100 },
      { x: 3224, y: 2046, duration: 100 },
      { x: 0, y: 2139, duration: 400 },
      { x: 124, y: 2139, duration: 100 },
      { x: 248, y: 2139, duration: 100 },
      { x: 372, y: 2139, duration: 100 },
      { x: 496, y: 2139, duration: 100 },
      { x: 620, y: 2139, duration: 100 },
      { x: 744, y: 2139, duration: 100 },
      { x: 868, y: 2139, duration: 100 },
      { x: 992, y: 2139, duration: 100 },
      { x: 1116, y: 2139, duration: 100 },
      { x: 1240, y: 2139, duration: 100 },
      { x: 1364, y: 2139, duration: 100 },
      { x: 1488, y: 2139, duration: 100 },
      { x: 1612, y: 2139, duration: 100 },
      { x: 1736, y: 2139, duration: 100 },
      { x: 1860, y: 2139, duration: 100 },
      { x: 1984, y: 2139, duration: 100 },
      { x: 2108, y: 2139, duration: 100 },
      { x: 2232, y: 2139, duration: 100 },
      { x: 2356, y: 2139, duration: 200 },
      { x: 2480, y: 2139, duration: 200 },
      { x: 2604, y: 2139, duration: 200 },
      { x: 2728, y: 2139, duration: 200 },
      { x: 2852, y: 2139, duration: 200 },
      { x: 2976, y: 2139, duration: 200 },
      { x: 3100, y: 2139, duration: 200 },
      { x: 3224, y: 2139, duration: 200 },
      { x: 0, y: 2232, duration: 200 },
      { x: 124, y: 2232, duration: 200 },
      { x: 248, y: 2232, duration: 200 },
      { x: 372, y: 2232, duration: 100 },
      { x: 496, y: 2232, duration: 100 },
      { x: 620, y: 2232, duration: 100 },
      { x: 744, y: 2232, duration: 1200 },
      { x: 868, y: 2232, duration: 100 },
      { x: 992, y: 2232, duration: 100 },
      { x: 1116, y: 2232, duration: 100 },
      { x: 1240, y: 2232, duration: 100 },
      { x: 1364, y: 2232, duration: 100 },
      { x: 1488, y: 2232, duration: 100 },
      { x: 1612, y: 2232, duration: 400 },
      { x: 1736, y: 2232, duration: 100 },
      { x: 1860, y: 2232, duration: 100 },
      { x: 1984, y: 2232, duration: 100 },
      { x: 2108, y: 2232, duration: 100 },
      { x: 2232, y: 2232, duration: 100 },
      { x: 2356, y: 2232, duration: 100 },
      { x: 2480, y: 2232, duration: 100 },
      { x: 2604, y: 2232, duration: 600 },
      { x: 2728, y: 2232, duration: 300 },
      { x: 2852, y: 2232, duration: 300 },
      { x: 2976, y: 2232, duration: 300 },
      { x: 3100, y: 2232, duration: 100 },
      { x: 3224, y: 2232, duration: 100 },
      { x: 0, y: 2325, duration: 100 },
      { x: 124, y: 2325, duration: 100 },
      { x: 248, y: 2325, duration: 100 },
      { x: 372, y: 2325, duration: 100 },
      { x: 496, y: 2325, duration: 100 },
      { x: 620, y: 2325, duration: 100 },
      { x: 744, y: 2325, duration: 200 },
      { x: 868, y: 2325, duration: 200 },
      { x: 992, y: 2325, duration: 200 },
      { x: 1116, y: 2325, duration: 200 },
      { x: 1240, y: 2325, duration: 200 },
      { x: 1364, y: 2325, duration: 200 },
      { x: 1488, y: 2325, duration: 200 },
      { x: 1612, y: 2325, duration: 100 },
      { x: 1736, y: 2325, duration: 100 },
      { x: 1860, y: 2325, duration: 100 },
      { x: 1984, y: 2325, duration: 100 },
      { x: 2108, y: 2325, duration: 100 },
      { x: 2232, y: 2325, duration: 100 },
      { x: 2356, y: 2325, duration: 100 },
      { x: 2480, y: 2325, duration: 300 },
      { x: 2604, y: 2325, duration: 100 },
      { x: 2728, y: 2325, duration: 100 },
      { x: 2852, y: 2325, duration: 100 },
      { x: 2976, y: 2325, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true,
    isLoop: true  // Flag for sleep loop behavior
  },

  // ===== LOOK ANIMATIONS (for mouse tracking) =====

  // Look up (7 frames)
  LookUp: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 1736, y: 2883, duration: 100 },
      { x: 1860, y: 2883, duration: 100 },
      { x: 1984, y: 2883, duration: 1200 },
      { x: 2108, y: 2883, duration: 100 },
      { x: 2232, y: 2883, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Look down (7 frames)
  LookDown: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 2852, y: 0, duration: 100 },
      { x: 2976, y: 0, duration: 100 },
      { x: 3100, y: 0, duration: 1200 },
      { x: 3224, y: 0, duration: 100 },
      { x: 0, y: 93, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Look left (7 frames)
  LookLeft: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 248, y: 1488, duration: 100 },
      { x: 372, y: 1488, duration: 100 },
      { x: 496, y: 1488, duration: 1200 },
      { x: 620, y: 1488, duration: 100 },
      { x: 744, y: 1488, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Look right (7 frames)
  LookRight: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 620, y: 651, duration: 100 },
      { x: 744, y: 651, duration: 100 },
      { x: 868, y: 651, duration: 1200 },
      { x: 992, y: 651, duration: 100 },
      { x: 1116, y: 651, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Look up-left (7 frames)
  LookUpLeft: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 868, y: 1488, duration: 100 },
      { x: 992, y: 1488, duration: 100 },
      { x: 1116, y: 1488, duration: 1200 },
      { x: 1240, y: 1488, duration: 100 },
      { x: 1364, y: 1488, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Look up-right (7 frames)
  LookUpRight: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 248, y: 744, duration: 100 },
      { x: 372, y: 744, duration: 100 },
      { x: 496, y: 744, duration: 1200 },
      { x: 620, y: 744, duration: 100 },
      { x: 744, y: 744, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Look down-left (7 frames)
  LookDownLeft: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 744, y: 3069, duration: 100 },
      { x: 868, y: 3069, duration: 100 },
      { x: 992, y: 3069, duration: 1200 },
      { x: 1116, y: 3069, duration: 100 },
      { x: 1240, y: 3069, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Look down-right (7 frames)
  LookDownRight: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 3100, y: 2325, duration: 100 },
      { x: 3224, y: 2325, duration: 100 },
      { x: 0, y: 2418, duration: 1200 },
      { x: 124, y: 2418, duration: 100 },
      { x: 248, y: 2418, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // ===== GESTURE ANIMATIONS =====

  // Gesture up (17 frames)
  GestureUp: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 868, y: 744, duration: 100 },
      { x: 992, y: 744, duration: 100 },
      { x: 1116, y: 744, duration: 100 },
      { x: 1240, y: 744, duration: 100 },
      { x: 1364, y: 744, duration: 100 },
      { x: 1488, y: 744, duration: 100 },
      { x: 1612, y: 744, duration: 100 },
      { x: 1736, y: 744, duration: 100 },
      { x: 1860, y: 744, duration: 1200 },
      { x: 1984, y: 744, duration: 100 },
      { x: 1364, y: 744, duration: 100 },
      { x: 1240, y: 744, duration: 100 },
      { x: 1116, y: 744, duration: 100 },
      { x: 992, y: 744, duration: 100 },
      { x: 868, y: 744, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Gesture down (19 frames)
  GestureDown: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 1984, y: 1395, duration: 100 },
      { x: 2108, y: 1395, duration: 100 },
      { x: 2232, y: 1395, duration: 100 },
      { x: 2356, y: 1395, duration: 100 },
      { x: 2480, y: 1395, duration: 100 },
      { x: 2604, y: 1395, duration: 100 },
      { x: 2728, y: 1395, duration: 100 },
      { x: 2852, y: 1395, duration: 100 },
      { x: 2976, y: 1395, duration: 100 },
      { x: 3100, y: 1395, duration: 100 },
      { x: 3224, y: 1395, duration: 100 },
      { x: 0, y: 1488, duration: 100 },
      { x: 124, y: 1488, duration: 450 },
      { x: 2356, y: 1395, duration: 100 },
      { x: 2232, y: 1395, duration: 100 },
      { x: 2108, y: 1395, duration: 100 },
      { x: 1984, y: 1395, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Gesture left (16 frames)
  GestureLeft: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 3100, y: 1674, duration: 100 },
      { x: 3224, y: 1674, duration: 100 },
      { x: 0, y: 1767, duration: 100 },
      { x: 124, y: 1767, duration: 100 },
      { x: 248, y: 1767, duration: 100 },
      { x: 372, y: 1767, duration: 100 },
      { x: 496, y: 1767, duration: 100 },
      { x: 620, y: 1767, duration: 100 },
      { x: 744, y: 1767, duration: 1200 },
      { x: 868, y: 1767, duration: 100 },
      { x: 992, y: 1767, duration: 450 },
      { x: 0, y: 1767, duration: 100 },
      { x: 3224, y: 1674, duration: 100 },
      { x: 3100, y: 1674, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Gesture right (17 frames)
  GestureRight: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 620, y: 1860, duration: 100 },
      { x: 744, y: 1860, duration: 100 },
      { x: 868, y: 1860, duration: 100 },
      { x: 992, y: 1860, duration: 100 },
      { x: 1116, y: 1860, duration: 100 },
      { x: 1240, y: 1860, duration: 100 },
      { x: 1364, y: 1860, duration: 100 },
      { x: 1488, y: 1860, duration: 100 },
      { x: 1612, y: 1860, duration: 1200 },
      { x: 1736, y: 1860, duration: 100 },
      { x: 1116, y: 1860, duration: 550 },
      { x: 992, y: 1860, duration: 100 },
      { x: 868, y: 1860, duration: 100 },
      { x: 744, y: 1860, duration: 100 },
      { x: 620, y: 1860, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // ===== EXPRESSION ANIMATIONS =====

  // Thinking/contemplation (45 frames - extended version)
  Thinking: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 124, y: 93, duration: 100 },
      { x: 248, y: 93, duration: 100 },
      { x: 372, y: 93, duration: 100 },
      { x: 496, y: 93, duration: 100 },
      { x: 620, y: 93, duration: 100 },
      { x: 744, y: 93, duration: 100 },
      { x: 868, y: 93, duration: 100 },
      { x: 992, y: 93, duration: 100 },
      { x: 1116, y: 93, duration: 100 },
      { x: 1240, y: 93, duration: 100 },
      { x: 1364, y: 93, duration: 100 },
      { x: 1488, y: 93, duration: 100 },
      { x: 1612, y: 93, duration: 100 },
      { x: 1736, y: 93, duration: 100 },
      { x: 1860, y: 93, duration: 100 },
      { x: 1984, y: 93, duration: 100 },
      { x: 2108, y: 93, duration: 100 },
      { x: 2232, y: 93, duration: 100 },
      { x: 2356, y: 93, duration: 100 },
      { x: 2480, y: 93, duration: 100 },
      { x: 2604, y: 93, duration: 100 },
      { x: 2728, y: 93, duration: 100 },
      { x: 2852, y: 93, duration: 100 },
      { x: 2976, y: 93, duration: 100 },
      { x: 3100, y: 93, duration: 100 },
      { x: 3224, y: 93, duration: 100 },
      { x: 0, y: 186, duration: 100 },
      { x: 124, y: 186, duration: 100 },
      { x: 248, y: 186, duration: 100 },
      { x: 372, y: 186, duration: 100 },
      { x: 496, y: 186, duration: 100 },
      { x: 620, y: 186, duration: 100 },
      { x: 744, y: 186, duration: 100 },
      { x: 868, y: 186, duration: 100 },
      { x: 992, y: 186, duration: 100 },
      { x: 992, y: 93, duration: 100 },
      { x: 868, y: 93, duration: 100 },
      { x: 744, y: 93, duration: 100 },
      { x: 620, y: 93, duration: 100 },
      { x: 496, y: 93, duration: 100 },
      { x: 372, y: 93, duration: 100 },
      { x: 248, y: 93, duration: 100 },
      { x: 124, y: 93, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Explain/provide information (7 frames)
  Explain: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 1116, y: 186, duration: 100 },
      { x: 1240, y: 186, duration: 100 },
      { x: 1364, y: 186, duration: 900 },
      { x: 1240, y: 186, duration: 100 },
      { x: 1116, y: 186, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Congratulate/celebrate (22 frames)
  Congratulate: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 124, y: 0, duration: 10 },
      { x: 248, y: 0, duration: 10 },
      { x: 372, y: 0, duration: 10 },
      { x: 496, y: 0, duration: 10 },
      { x: 620, y: 0, duration: 10 },
      { x: 744, y: 0, duration: 10 },
      { x: 868, y: 0, duration: 10 },
      { x: 992, y: 0, duration: 10 },
      { x: 1116, y: 0, duration: 100 },
      { x: 1240, y: 0, duration: 100 },
      { x: 1364, y: 0, duration: 100 },
      { x: 1488, y: 0, duration: 1200 },
      { x: 1612, y: 0, duration: 100 },
      { x: 1736, y: 0, duration: 100 },
      { x: 1488, y: 0, duration: 1200 },
      { x: 1860, y: 0, duration: 100 },
      { x: 1984, y: 0, duration: 100 },
      { x: 2108, y: 0, duration: 100 },
      { x: 2232, y: 0, duration: 100 },
      { x: 2356, y: 0, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Wave greeting (27 frames)
  Wave: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 1116, y: 1767, duration: 100 },
      { x: 1240, y: 1767, duration: 100 },
      { x: 1364, y: 1767, duration: 100 },
      { x: 1488, y: 1767, duration: 100 },
      { x: 1612, y: 1767, duration: 100 },
      { x: 1736, y: 1767, duration: 100 },
      { x: 1860, y: 1767, duration: 100 },
      { x: 1984, y: 1767, duration: 100 },
      { x: 2108, y: 1767, duration: 100 },
      { x: 2232, y: 1767, duration: 100 },
      { x: 2356, y: 1767, duration: 100 },
      { x: 2480, y: 1767, duration: 100 },
      { x: 2604, y: 1767, duration: 100 },
      { x: 2728, y: 1767, duration: 100 },
      { x: 2852, y: 1767, duration: 100 },
      { x: 2976, y: 1767, duration: 100 },
      { x: 3100, y: 1767, duration: 100 },
      { x: 3224, y: 1767, duration: 100 },
      { x: 0, y: 1860, duration: 100 },
      { x: 124, y: 1860, duration: 100 },
      { x: 248, y: 1860, duration: 1200 },
      { x: 372, y: 1860, duration: 100 },
      { x: 248, y: 1860, duration: 1300 },
      { x: 496, y: 1860, duration: 50 },
      { x: 2976, y: 1767, duration: 50 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Get attention (24 frames)
  GetAttention: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 1240, y: 651, duration: 100 },
      { x: 1364, y: 651, duration: 100 },
      { x: 1488, y: 651, duration: 100 },
      { x: 1612, y: 651, duration: 100 },
      { x: 1736, y: 651, duration: 100 },
      { x: 1860, y: 651, duration: 100 },
      { x: 1984, y: 651, duration: 100 },
      { x: 2108, y: 651, duration: 100 },
      { x: 2232, y: 651, duration: 100 },
      { x: 2356, y: 651, duration: 150 },
      { x: 2232, y: 651, duration: 150 },
      { x: 2356, y: 651, duration: 150 },
      { x: 2232, y: 651, duration: 150 },
      { x: 2480, y: 651, duration: 150 },
      { x: 2604, y: 651, duration: 100 },
      { x: 2728, y: 651, duration: 100 },
      { x: 2852, y: 651, duration: 100 },
      { x: 2976, y: 651, duration: 100 },
      { x: 3100, y: 651, duration: 100 },
      { x: 3224, y: 651, duration: 100 },
      { x: 0, y: 744, duration: 100 },
      { x: 124, y: 744, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Alert notification (20 frames)
  Alert: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 2356, y: 1116, duration: 100 },
      { x: 2480, y: 1116, duration: 100 },
      { x: 2604, y: 1116, duration: 100 },
      { x: 2728, y: 1116, duration: 100 },
      { x: 2852, y: 1116, duration: 100 },
      { x: 2976, y: 1116, duration: 100 },
      { x: 3100, y: 1116, duration: 100 },
      { x: 3224, y: 1116, duration: 100 },
      { x: 0, y: 1209, duration: 100 },
      { x: 124, y: 1209, duration: 500 },
      { x: 248, y: 1209, duration: 100 },
      { x: 372, y: 1209, duration: 100 },
      { x: 496, y: 1209, duration: 100 },
      { x: 620, y: 1209, duration: 100 },
      { x: 744, y: 1209, duration: 100 },
      { x: 868, y: 1209, duration: 100 },
      { x: 992, y: 1209, duration: 100 },
      { x: 1116, y: 1209, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Greeting entrance (39 frames)
  Greeting: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 1612, y: 2790, duration: 100 },
      { x: 1736, y: 2790, duration: 100 },
      { x: 1860, y: 2790, duration: 100 },
      { x: 1984, y: 2790, duration: 100 },
      { x: 2108, y: 2790, duration: 100 },
      { x: 2232, y: 2790, duration: 100 },
      { x: 2356, y: 2790, duration: 100 },
      { x: 2480, y: 2790, duration: 100 },
      { x: 2604, y: 2790, duration: 100 },
      { x: 2728, y: 2790, duration: 100 },
      { x: 2852, y: 2790, duration: 100 },
      { x: 2976, y: 2790, duration: 100 },
      { x: 3100, y: 2790, duration: 100 },
      { x: 3224, y: 2790, duration: 100 },
      { x: 0, y: 2883, duration: 100 },
      { x: 124, y: 2883, duration: 100 },
      { x: 248, y: 2883, duration: 100 },
      { x: 372, y: 2883, duration: 300 },
      { x: 496, y: 2883, duration: 100 },
      { x: 372, y: 2883, duration: 450 },
      { x: 620, y: 2883, duration: 100 },
      { x: 744, y: 2883, duration: 100 },
      { x: 868, y: 2883, duration: 100 },
      { x: 992, y: 2883, duration: 100 },
      { x: 1116, y: 2883, duration: 100 },
      { x: 1240, y: 2883, duration: 100 },
      { x: 1364, y: 2883, duration: 100 },
      { x: 1488, y: 2883, duration: 100 },
      { x: 1612, y: 2883, duration: 100 },
      { x: 992, y: 1395, duration: 100 },
      { x: 1116, y: 1395, duration: 100 },
      { x: 1240, y: 1395, duration: 100 },
      { x: 1364, y: 1395, duration: 100 },
      { x: 1488, y: 1395, duration: 100 },
      { x: 1612, y: 1395, duration: 100 },
      { x: 1736, y: 1395, duration: 100 },
      { x: 1860, y: 1395, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // GoodBye exit (38 frames)
  GoodBye: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 2356, y: 2883, duration: 100 },
      { x: 2480, y: 2883, duration: 250 },
      { x: 2604, y: 2883, duration: 100 },
      { x: 2728, y: 2883, duration: 100 },
      { x: 2852, y: 2883, duration: 100 },
      { x: 2976, y: 2883, duration: 100 },
      { x: 3100, y: 2883, duration: 100 },
      { x: 3224, y: 2883, duration: 100 },
      { x: 0, y: 2976, duration: 100 },
      { x: 124, y: 2976, duration: 100 },
      { x: 248, y: 2976, duration: 100 },
      { x: 372, y: 2976, duration: 100 },
      { x: 496, y: 2976, duration: 100 },
      { x: 620, y: 2976, duration: 200 },
      { x: 744, y: 2976, duration: 200 },
      { x: 620, y: 2976, duration: 200 },
      { x: 868, y: 2976, duration: 200 },
      { x: 992, y: 2976, duration: 100 },
      { x: 1116, y: 2976, duration: 100 },
      { x: 1240, y: 2976, duration: 200 },
      { x: 1364, y: 2976, duration: 100 },
      { x: 1488, y: 2976, duration: 100 },
      { x: 1612, y: 2976, duration: 100 },
      { x: 1736, y: 2976, duration: 100 },
      { x: 1860, y: 2976, duration: 100 },
      { x: 1984, y: 2976, duration: 100 },
      { x: 2108, y: 2976, duration: 100 },
      { x: 2232, y: 2976, duration: 100 },
      { x: 2356, y: 2976, duration: 100 },
      { x: 2480, y: 2976, duration: 100 },
      { x: 2604, y: 2976, duration: 100 },
      { x: 2728, y: 2976, duration: 100 },
      { x: 2852, y: 2976, duration: 100 },
      { x: 1240, y: 1395, duration: 100 },
      { x: 1116, y: 1395, duration: 100 },
      { x: 992, y: 1395, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // ===== SPECIAL FUN ANIMATIONS =====

  // Get artsy (23 frames)
  GetArtsy: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 372, y: 2418, duration: 100 },
      { x: 496, y: 2418, duration: 100 },
      { x: 620, y: 2418, duration: 100 },
      { x: 744, y: 2418, duration: 100 },
      { x: 868, y: 2418, duration: 100 },
      { x: 992, y: 2418, duration: 100 },
      { x: 1116, y: 2418, duration: 100 },
      { x: 1240, y: 2418, duration: 100 },
      { x: 1364, y: 2418, duration: 100 },
      { x: 1488, y: 2418, duration: 100 },
      { x: 1612, y: 2418, duration: 400 },
      { x: 1736, y: 2418, duration: 100 },
      { x: 1860, y: 2418, duration: 100 },
      { x: 1612, y: 2418, duration: 100 },
      { x: 1736, y: 2418, duration: 100 },
      { x: 1860, y: 2418, duration: 100 },
      { x: 1612, y: 2418, duration: 2400 },
      { x: 744, y: 2418, duration: 100 },
      { x: 620, y: 2418, duration: 100 },
      { x: 496, y: 2418, duration: 100 },
      { x: 372, y: 2418, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Get techy (45 frames)
  GetTechy: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 124, y: 93, duration: 100 },
      { x: 248, y: 93, duration: 100 },
      { x: 372, y: 93, duration: 100 },
      { x: 496, y: 93, duration: 100 },
      { x: 620, y: 93, duration: 100 },
      { x: 744, y: 93, duration: 100 },
      { x: 868, y: 93, duration: 100 },
      { x: 992, y: 93, duration: 100 },
      { x: 1116, y: 93, duration: 100 },
      { x: 1240, y: 93, duration: 100 },
      { x: 1364, y: 93, duration: 100 },
      { x: 1488, y: 93, duration: 100 },
      { x: 1612, y: 93, duration: 100 },
      { x: 1736, y: 93, duration: 100 },
      { x: 1860, y: 93, duration: 100 },
      { x: 1984, y: 93, duration: 100 },
      { x: 2108, y: 93, duration: 100 },
      { x: 2232, y: 93, duration: 100 },
      { x: 2356, y: 93, duration: 100 },
      { x: 2480, y: 93, duration: 100 },
      { x: 2604, y: 93, duration: 100 },
      { x: 2728, y: 93, duration: 100 },
      { x: 2852, y: 93, duration: 100 },
      { x: 2976, y: 93, duration: 100 },
      { x: 3100, y: 93, duration: 100 },
      { x: 3224, y: 93, duration: 100 },
      { x: 0, y: 186, duration: 100 },
      { x: 124, y: 186, duration: 100 },
      { x: 248, y: 186, duration: 100 },
      { x: 372, y: 186, duration: 100 },
      { x: 496, y: 186, duration: 100 },
      { x: 620, y: 186, duration: 100 },
      { x: 744, y: 186, duration: 100 },
      { x: 868, y: 186, duration: 100 },
      { x: 992, y: 186, duration: 100 },
      { x: 992, y: 93, duration: 100 },
      { x: 868, y: 93, duration: 100 },
      { x: 744, y: 93, duration: 100 },
      { x: 620, y: 93, duration: 100 },
      { x: 496, y: 93, duration: 100 },
      { x: 372, y: 93, duration: 100 },
      { x: 248, y: 93, duration: 100 },
      { x: 124, y: 93, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Get wizardy (22 frames) - magical animation
  GetWizardy: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 124, y: 0, duration: 10 },
      { x: 248, y: 0, duration: 10 },
      { x: 372, y: 0, duration: 10 },
      { x: 496, y: 0, duration: 10 },
      { x: 620, y: 0, duration: 10 },
      { x: 744, y: 0, duration: 10 },
      { x: 868, y: 0, duration: 10 },
      { x: 992, y: 0, duration: 10 },
      { x: 1116, y: 0, duration: 100 },
      { x: 1240, y: 0, duration: 100 },
      { x: 1364, y: 0, duration: 100 },
      { x: 1488, y: 0, duration: 1200 },
      { x: 1612, y: 0, duration: 100 },
      { x: 1736, y: 0, duration: 100 },
      { x: 1488, y: 0, duration: 1200 },
      { x: 1860, y: 0, duration: 100 },
      { x: 1984, y: 0, duration: 100 },
      { x: 2108, y: 0, duration: 100 },
      { x: 2232, y: 0, duration: 100 },
      { x: 2356, y: 0, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Searching animation (61 frames)
  Searching: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 992, y: 2511, duration: 100 },
      { x: 1116, y: 2511, duration: 100 },
      { x: 1240, y: 2511, duration: 100 },
      { x: 1364, y: 2511, duration: 100 },
      { x: 1488, y: 2511, duration: 100 },
      { x: 1612, y: 2511, duration: 100 },
      { x: 1736, y: 2511, duration: 100 },
      { x: 1860, y: 2511, duration: 100 },
      { x: 1984, y: 2511, duration: 100 },
      { x: 2108, y: 2511, duration: 100 },
      { x: 2232, y: 2511, duration: 100 },
      { x: 2356, y: 2511, duration: 100 },
      { x: 2480, y: 2511, duration: 100 },
      { x: 2604, y: 2511, duration: 100 },
      { x: 2728, y: 2511, duration: 100 },
      { x: 2852, y: 2511, duration: 100 },
      { x: 2976, y: 2511, duration: 100 },
      { x: 3100, y: 2511, duration: 100 },
      { x: 3224, y: 2511, duration: 800 },
      { x: 0, y: 2604, duration: 100 },
      { x: 3224, y: 2511, duration: 100 },
      { x: 124, y: 2604, duration: 100 },
      { x: 248, y: 2604, duration: 100 },
      { x: 372, y: 2604, duration: 100 },
      { x: 496, y: 2604, duration: 100 },
      { x: 620, y: 2604, duration: 100 },
      { x: 744, y: 2604, duration: 1000 },
      { x: 868, y: 2604, duration: 100 },
      { x: 992, y: 2604, duration: 100 },
      { x: 1116, y: 2604, duration: 100 },
      { x: 1240, y: 2604, duration: 100 },
      { x: 1364, y: 2604, duration: 500 },
      { x: 1488, y: 2604, duration: 100 },
      { x: 1364, y: 2604, duration: 100 },
      { x: 1612, y: 2604, duration: 100 },
      { x: 1736, y: 2604, duration: 100 },
      { x: 1860, y: 2604, duration: 100 },
      { x: 1984, y: 2604, duration: 100 },
      { x: 2108, y: 2604, duration: 100 },
      { x: 2232, y: 2604, duration: 100 },
      { x: 2356, y: 2604, duration: 100 },
      { x: 2480, y: 2604, duration: 100 },
      { x: 2604, y: 2604, duration: 100 },
      { x: 2728, y: 2604, duration: 100 },
      { x: 2852, y: 2604, duration: 100 },
      { x: 2976, y: 2604, duration: 100 },
      { x: 3100, y: 2604, duration: 100 },
      { x: 3224, y: 2604, duration: 100 },
      { x: 0, y: 2697, duration: 100 },
      { x: 124, y: 2697, duration: 100 },
      { x: 0, y: 2697, duration: 100 },
      { x: 3224, y: 2604, duration: 100 },
      { x: 248, y: 2697, duration: 100 },
      { x: 372, y: 2697, duration: 100 },
      { x: 496, y: 2697, duration: 100 },
      { x: 620, y: 2697, duration: 100 },
      { x: 744, y: 2697, duration: 100 },
      { x: 868, y: 2697, duration: 100 },
      { x: 992, y: 2697, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Writing animation (simplified, 20 frames)
  Writing: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 1860, y: 1860, duration: 100 },
      { x: 1984, y: 1860, duration: 100 },
      { x: 2108, y: 1860, duration: 100 },
      { x: 2232, y: 1860, duration: 100 },
      { x: 2356, y: 1860, duration: 100 },
      { x: 2480, y: 1860, duration: 100 },
      { x: 2604, y: 1860, duration: 100 },
      { x: 2728, y: 1860, duration: 100 },
      { x: 2852, y: 1860, duration: 100 },
      { x: 2976, y: 1860, duration: 100 },
      { x: 3100, y: 1860, duration: 100 },
      { x: 3224, y: 1860, duration: 100 },
      { x: 0, y: 1953, duration: 100 },
      { x: 124, y: 1953, duration: 100 },
      { x: 248, y: 1953, duration: 100 },
      { x: 372, y: 1953, duration: 200 },
      { x: 496, y: 1953, duration: 200 },
      { x: 620, y: 1953, duration: 200 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // Processing animation (38 frames)
  Processing: {
    frames: [
      { x: 0, y: 0, duration: 100 },
      { x: 1240, y: 1023, duration: 100 },
      { x: 1364, y: 1023, duration: 100 },
      { x: 1488, y: 1023, duration: 100 },
      { x: 1612, y: 1023, duration: 100 },
      { x: 1736, y: 1023, duration: 100 },
      { x: 1860, y: 1023, duration: 100 },
      { x: 1984, y: 1023, duration: 100 },
      { x: 2108, y: 1023, duration: 100 },
      { x: 2232, y: 1023, duration: 100 },
      { x: 2356, y: 1023, duration: 100 },
      { x: 2480, y: 1023, duration: 100 },
      { x: 2604, y: 1023, duration: 100 },
      { x: 2728, y: 1023, duration: 100 },
      { x: 2852, y: 1023, duration: 100 },
      { x: 2976, y: 1023, duration: 100 },
      { x: 3100, y: 1023, duration: 100 },
      { x: 3224, y: 1023, duration: 100 },
      { x: 0, y: 1116, duration: 100 },
      { x: 124, y: 1116, duration: 100 },
      { x: 248, y: 1116, duration: 100 },
      { x: 372, y: 1116, duration: 100 },
      { x: 496, y: 1116, duration: 100 },
      { x: 620, y: 1116, duration: 100 },
      { x: 744, y: 1116, duration: 100 },
      { x: 868, y: 1116, duration: 100 },
      { x: 992, y: 1116, duration: 100 },
      { x: 1116, y: 1116, duration: 100 },
      { x: 1240, y: 1116, duration: 100 },
      { x: 1364, y: 1116, duration: 100 },
      { x: 1488, y: 1116, duration: 100 },
      { x: 1612, y: 1116, duration: 100 },
      { x: 1736, y: 1116, duration: 100 },
      { x: 1860, y: 1116, duration: 100 },
      { x: 1984, y: 1116, duration: 100 },
      { x: 2108, y: 1116, duration: 100 },
      { x: 2232, y: 1116, duration: 100 },
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: true
  },

  // ===== ENTRANCE/EXIT ANIMATIONS =====

  // Show/appear animation (5 frames)
  Show: {
    frames: [
      { x: 0, y: 0, duration: 10 },
      { x: 2728, y: 0, duration: 10 },
      { x: 2604, y: 0, duration: 10 },
      { x: 2480, y: 0, duration: 10 },
      { x: 0, y: 0, duration: 10 }
    ],
    useQueue: true
  },

  // Hide/disappear animation (5 frames)
  Hide: {
    frames: [
      { x: 0, y: 0, duration: 10 },
      { x: 2480, y: 0, duration: 10 },
      { x: 2604, y: 0, duration: 10 },
      { x: 2728, y: 0, duration: 10 },
      { x: 0, y: 0, duration: 10 }
    ],
    useQueue: true
  },

  // Rest pose (static)
  RestPose: {
    frames: [
      { x: 0, y: 0, duration: 100 }
    ],
    useQueue: false
  }
};

/**
 * Animation categories for random selection
 */
export const animationCategories = {
  idle: ['Idle', 'IdleSideToSide', 'IdleAtom', 'IdleRopePile', 'IdleHeadScratch', 'IdleFingerTap', 'IdleEyeBrowRaise'],
  look: ['LookUp', 'LookDown', 'LookLeft', 'LookRight', 'LookUpLeft', 'LookUpRight', 'LookDownLeft', 'LookDownRight'],
  gesture: ['GestureUp', 'GestureDown', 'GestureLeft', 'GestureRight'],
  express: ['Thinking', 'Explain', 'Congratulate', 'Wave', 'GetAttention', 'Alert', 'Greeting', 'GoodBye'],
  special: ['GetArtsy', 'GetTechy', 'GetWizardy', 'Searching', 'Writing', 'Processing'],
  mischief: ['IdleAtom', 'IdleRopePile', 'GetArtsy', 'GetTechy', 'GetWizardy', 'IdleHeadScratch'],
  entrance: ['Show', 'Greeting'],
  exit: ['Hide', 'GoodBye'],
  sleep: ['IdleSnooze']
};

/**
 * Get animation by name with fallback to Idle
 */
export function getAnimation(name) {
  return animations[name] || animations.Idle;
}

/**
 * Get list of all available animation names
 */
export function getAnimationNames() {
  return Object.keys(animations);
}

/**
 * Get animations by category
 */
export function getAnimationsByCategory(category) {
  return animationCategories[category] || [];
}

/**
 * Get a random animation from a category
 */
export function getRandomAnimationFromCategory(category) {
  const categoryAnims = animationCategories[category];
  if (!categoryAnims || categoryAnims.length === 0) return 'Idle';
  return categoryAnims[Math.floor(Math.random() * categoryAnims.length)];
}

/**
 * Calculate total duration of an animation
 */
export function getAnimationDuration(name) {
  const animation = getAnimation(name);
  return animation.frames.reduce((total, frame) => total + frame.duration, 0);
}

/**
 * Check if animation is loopable (for sleep state)
 */
export function isLoopAnimation(name) {
  const animation = getAnimation(name);
  return animation.isLoop === true;
}
