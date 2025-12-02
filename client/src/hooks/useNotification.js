/**
 * useNotification - Hook for showing notifications via Imp (Clippy)
 *
 * Provides convenient methods for showing different types of notifications.
 * Uses the Imp assistant to display messages with appropriate animations.
 *
 * @example
 * const { showError, showSuccess } = useNotification();
 *
 * // Show error notification
 * showError('Failed to save changes');
 *
 * // Show success notification
 * showSuccess('Client created successfully');
 */

import { useCallback } from 'react';
import { useImp } from '../contexts/ImpContext';

// Animation and header config per notification type
const TYPE_CONFIG = {
  error: { animation: 'Alert', header: 'ALERT!' },
  success: { animation: 'Congratulate', header: 'SUCCESS!' },
  warning: { animation: 'GetAttention', header: 'WARNING!' },
  info: { animation: 'Explain', header: 'INFO' },
};

export function useNotification() {
  const { showTip, isMinimized, showImp } = useImp();

  const notify = useCallback(
    (type, message, options = {}) => {
      const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

      // Wake Imp if minimized (ensures visibility)
      if (isMinimized) {
        showImp();
      }

      // Show notification via Imp
      showTip({
        id: `${type}-${Date.now()}`,
        message,
        animation: options.animation || config.animation,
        type, // Pass type for header styling in ImpBalloon
        ...options,
      });
    },
    [showTip, isMinimized, showImp]
  );

  const showError = useCallback(
    (message, options = {}) => notify('error', message, options),
    [notify]
  );

  const showSuccess = useCallback(
    (message, options = {}) => notify('success', message, options),
    [notify]
  );

  const showWarning = useCallback(
    (message, options = {}) => notify('warning', message, options),
    [notify]
  );

  const showInfo = useCallback(
    (message, options = {}) => notify('info', message, options),
    [notify]
  );

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
}

export default useNotification;
