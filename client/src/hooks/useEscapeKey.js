import { useEffect, useCallback } from 'react';

/**
 * useEscapeKey - Handles escape key with priority-based state dismissal
 *
 * Handles nested modal states where escape should dismiss the innermost
 * state first before closing the modal. Uses capture phase to intercept
 * events before they reach the base Modal.
 *
 * @param {Object} options
 * @param {boolean} options.enabled - Whether the hook is active (typically modal isOpen)
 * @param {Array<[boolean, Function]>} options.handlers - Priority-ordered array of [condition, handler] pairs
 * @param {Function} [options.fallback] - Optional fallback handler when no conditions match
 * @param {boolean} [options.capture=true] - Whether to use capture phase (for intercepting before Modal)
 *
 * @example
 * // In a modal with nested states:
 * useEscapeKey({
 *   enabled: isOpen,
 *   handlers: [
 *     [confirmDelete, () => setConfirmDelete(false)],
 *     [isEditing, () => setIsEditing(false)],
 *     [showPreview, () => { setShowPreview(false); setSelectedItem(null); }],
 *   ],
 *   // No fallback - let base Modal handle final close
 * });
 *
 * @example
 * // In a component managing its own close:
 * useEscapeKey({
 *   enabled: isOpen,
 *   handlers: [
 *     [confirmDelete, () => setConfirmDelete(false)],
 *   ],
 *   fallback: handleClose,
 *   capture: false,
 * });
 */
export function useEscapeKey({
  enabled = true,
  handlers = [],
  fallback = null,
  capture = true,
}) {
  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Escape') return;

    // Check handlers in priority order (first match wins)
    for (const [condition, handler] of handlers) {
      if (condition) {
        e.stopPropagation();
        handler();
        return;
      }
    }

    // If no conditions matched and we have a fallback, call it
    if (fallback) {
      fallback();
    }
    // Otherwise, let the event bubble to Modal's handler
  }, [handlers, fallback]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown, capture);
    return () => window.removeEventListener('keydown', handleKeyDown, capture);
  }, [enabled, handleKeyDown, capture]);
}

export default useEscapeKey;
