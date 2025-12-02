/**
 * Audio Sound Definitions for Data Hub
 *
 * Windows 95-style sound effects for UI interactions
 * Source: Juhani Junkala "Essential Retro Video Game Sound Effects Collection" (CC0 License)
 * https://opengameart.org/content/512-sound-effects-8-bit-style
 *
 * Sound Categories:
 * - UI: Button clicks, toggles, tab selections
 * - Modal: Dialog open/close sounds
 * - Transition: Page navigation sounds
 * - Feedback: Success, error, warning notifications
 * - Wizard: Step progression and completion
 * - Data: Upload and data operation sounds
 * - Notification: System alerts
 * - Imp: Assistant character sounds
 */

// ===== SOUND PATHS =====
export const SOUND_BASE_PATH = '/assets/sounds';

export const SOUND_PATHS = {
  ui: `${SOUND_BASE_PATH}/ui`,
  modal: `${SOUND_BASE_PATH}/modal`,
  transition: `${SOUND_BASE_PATH}/transition`,
  feedback: `${SOUND_BASE_PATH}/feedback`,
  wizard: `${SOUND_BASE_PATH}/wizard`,
  data: `${SOUND_BASE_PATH}/data`,
  notification: `${SOUND_BASE_PATH}/notification`,
  imp: `${SOUND_BASE_PATH}/imp`,
};

// ===== VOLUME LEVELS =====
// These map to CSS custom properties for consistency
export const VOLUMES = {
  muted: 0,
  low: 0.15,
  mediumLow: 0.3,
  medium: 0.5,
  mediumHigh: 0.6,
  high: 0.7,
  max: 1.0,
};

// Category default volumes
export const CATEGORY_VOLUMES = {
  ui: VOLUMES.mediumLow,
  modal: VOLUMES.medium,
  transition: VOLUMES.mediumLow,
  feedback: VOLUMES.medium,
  wizard: VOLUMES.medium,
  data: VOLUMES.medium,
  notification: VOLUMES.high,
  imp: VOLUMES.medium,
};

// ===== TIMING =====
export const DEBOUNCE_MS = {
  ui: 50,      // Fast debounce for rapid clicks
  feedback: 200, // Longer debounce for feedback sounds
};

// ===== SOUND DEFINITIONS =====
/**
 * Sound definition structure:
 * - category: Sound category for organization
 * - file: Filename (without extension)
 * - volume: Default volume (0-1)
 * - priority: Higher priority sounds interrupt lower (1-10)
 * - debounce: Milliseconds to debounce repeated plays
 * - preload: Whether to preload on app init
 */
export const sounds = {
  // ===== UI SOUNDS =====
  'ui.click': {
    category: 'ui',
    file: 'click',
    volume: VOLUMES.mediumLow,
    priority: 1,
    debounce: DEBOUNCE_MS.ui,
    preload: true,
    description: 'Button click - crisp, satisfying',
  },

  'ui.toggle': {
    category: 'ui',
    file: 'toggle',
    volume: VOLUMES.mediumLow,
    priority: 1,
    debounce: DEBOUNCE_MS.ui,
    preload: true,
    description: 'Switch/checkbox toggle',
  },

  'ui.tab': {
    category: 'ui',
    file: 'tab',
    volume: VOLUMES.low,
    priority: 1,
    debounce: DEBOUNCE_MS.ui,
    preload: true,
    description: 'Tab selection blip',
  },

  // ===== MODAL SOUNDS =====
  'modal.open': {
    category: 'modal',
    file: 'open',
    volume: VOLUMES.medium,
    priority: 5,
    debounce: 0,
    preload: true,
    description: 'Modal appears - Windows ding chord',
  },

  'modal.close': {
    category: 'modal',
    file: 'close',
    volume: VOLUMES.mediumLow,
    priority: 3,
    debounce: 0,
    preload: true,
    description: 'Modal dismissed - soft descending tone',
  },

  // ===== TRANSITION SOUNDS =====
  'transition.page': {
    category: 'transition',
    file: 'page',
    volume: VOLUMES.low,
    priority: 2,
    debounce: 100,
    preload: false,
    description: 'Page navigation swoosh',
  },

  // ===== FEEDBACK SOUNDS =====
  'feedback.success': {
    category: 'feedback',
    file: 'success',
    volume: VOLUMES.medium,
    priority: 7,
    debounce: DEBOUNCE_MS.feedback,
    preload: true,
    description: 'Success - triumphant ascending arpeggio',
  },

  'feedback.error': {
    category: 'feedback',
    file: 'error',
    volume: VOLUMES.medium,
    priority: 8,
    debounce: DEBOUNCE_MS.feedback,
    preload: true,
    description: 'Error - Windows chord error sound',
  },

  'feedback.warning': {
    category: 'feedback',
    file: 'warning',
    volume: VOLUMES.medium,
    priority: 6,
    debounce: DEBOUNCE_MS.feedback,
    preload: true,
    description: 'Warning - attention exclamation tone',
  },

  // ===== WIZARD SOUNDS =====
  'wizard.step': {
    category: 'wizard',
    file: 'step',
    volume: VOLUMES.medium,
    priority: 4,
    debounce: 0,
    preload: true,
    description: 'Step complete - progress chime',
  },

  'wizard.complete': {
    category: 'wizard',
    file: 'complete',
    volume: VOLUMES.mediumHigh,
    priority: 9,
    debounce: 0,
    preload: true,
    description: 'Wizard finished - celebration fanfare',
  },

  // ===== DATA SOUNDS =====
  'data.upload': {
    category: 'data',
    file: 'upload',
    volume: VOLUMES.medium,
    priority: 5,
    debounce: 0,
    preload: false,
    description: 'Upload complete - success tone',
  },

  // ===== NOTIFICATION SOUNDS =====
  'notification.alert': {
    category: 'notification',
    file: 'alert',
    volume: VOLUMES.high,
    priority: 10,
    debounce: 0,
    preload: true,
    description: 'System alert - Windows notify',
  },

  // ===== IMP SOUNDS =====
  'imp.interact': {
    category: 'imp',
    file: 'interact',
    volume: VOLUMES.medium,
    priority: 3,
    debounce: 100,
    preload: false,
    description: 'Imp clicked/speaks - character chirp',
  },

  'imp.appear': {
    category: 'imp',
    file: 'appear',
    volume: VOLUMES.mediumLow,
    priority: 2,
    debounce: 0,
    preload: false,
    description: 'Imp shows up - magical shimmer',
  },

  'imp.dismiss': {
    category: 'imp',
    file: 'dismiss',
    volume: VOLUMES.mediumLow,
    priority: 2,
    debounce: 0,
    preload: false,
    description: 'Imp minimizes - pop/poof',
  },
};

// ===== CATEGORY MAPPINGS =====
export const CATEGORIES = {
  ui: ['ui.click', 'ui.toggle', 'ui.tab'],
  modal: ['modal.open', 'modal.close'],
  transition: ['transition.page'],
  feedback: ['feedback.success', 'feedback.error', 'feedback.warning'],
  wizard: ['wizard.step', 'wizard.complete'],
  data: ['data.upload'],
  notification: ['notification.alert'],
  imp: ['imp.interact', 'imp.appear', 'imp.dismiss'],
};

// ===== HELPER FUNCTIONS =====

/**
 * Get a sound definition by ID
 * @param {string} soundId - Sound identifier (e.g., 'ui.click')
 * @returns {Object|null} Sound definition or null if not found
 */
export const getSound = (soundId) => {
  return sounds[soundId] || null;
};

/**
 * Get the full file path for a sound
 * @param {string} soundId - Sound identifier
 * @returns {string|null} Full path to sound file or null
 */
export const getSoundPath = (soundId) => {
  const sound = sounds[soundId];
  if (!sound) return null;
  return `${SOUND_PATHS[sound.category]}/${sound.file}.mp3`;
};

/**
 * Get all sounds in a category
 * @param {string} category - Category name (e.g., 'ui', 'modal')
 * @returns {Array} Array of sound definitions
 */
export const getSoundsByCategory = (category) => {
  const soundIds = CATEGORIES[category] || [];
  return soundIds.map((id) => ({ id, ...sounds[id] }));
};

/**
 * Get all sounds that should be preloaded
 * @returns {Array} Array of sound definitions with preload: true
 */
export const getPreloadSounds = () => {
  return Object.entries(sounds)
    .filter(([, sound]) => sound.preload)
    .map(([id, sound]) => ({ id, ...sound }));
};

/**
 * Get volume for a category
 * @param {string} category - Category name
 * @returns {number} Volume level (0-1)
 */
export const getCategoryVolume = (category) => {
  return CATEGORY_VOLUMES[category] || VOLUMES.medium;
};

/**
 * Check if a sound should be debounced
 * @param {string} soundId - Sound identifier
 * @param {number} lastPlayTime - Timestamp of last play
 * @returns {boolean} True if sound should be played
 */
export const shouldPlaySound = (soundId, lastPlayTime) => {
  const sound = sounds[soundId];
  if (!sound) return false;
  if (!sound.debounce) return true;
  return Date.now() - lastPlayTime >= sound.debounce;
};
