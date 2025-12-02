import { useState, useEffect } from 'react';

/**
 * Hook that ensures a minimum loading time before showing content.
 * Enforces minimum time so users can read quest-style messages.
 *
 * @param {boolean} isLoading - The actual loading state from data fetching
 * @param {number} minTime - Minimum time in ms to show loading (default: 3500)
 * @returns {boolean} - Whether to show loading state
 */
export function useMinLoadingTime(isLoading, minTime = 3500) {
  const [showLoading, setShowLoading] = useState(true);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    // If still loading, keep showing loading
    if (isLoading) {
      setShowLoading(true);
      return;
    }

    // Data loaded - check if minimum time has passed
    const elapsed = Date.now() - startTime;
    const remaining = minTime - elapsed;

    if (remaining <= 0) {
      // Minimum time already passed, hide loading
      setShowLoading(false);
    } else {
      // Wait for remaining time before hiding loading
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [isLoading, minTime, startTime]);

  return showLoading;
}
