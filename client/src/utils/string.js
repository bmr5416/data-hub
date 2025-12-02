/**
 * String utility functions
 */

/**
 * Capitalize the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} The capitalized string
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert snake_case or kebab-case to Title Case
 * @param {string} str - The string to convert
 * @returns {string} The title cased string
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str
    .split(/[_-]/)
    .map(word => capitalize(word))
    .join(' ');
}
