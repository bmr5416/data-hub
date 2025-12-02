/**
 * useOnboarding - Hook for managing onboarding state
 *
 * Tracks whether user has completed onboarding and provides
 * methods to control the onboarding wizard visibility.
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'datahub_onboarding_complete';
const ONBOARDING_VERSION = '1'; // Increment to show onboarding to returning users after major updates

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check onboarding status on mount
  useEffect(() => {
    const storedValue = localStorage.getItem(STORAGE_KEY);

    // Show onboarding if:
    // 1. Never completed onboarding
    // 2. Completed older version (major update)
    if (!storedValue || storedValue !== ONBOARDING_VERSION) {
      setShowOnboarding(true);
    }

    setIsLoading(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, ONBOARDING_VERSION);
    setShowOnboarding(false);
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, ONBOARDING_VERSION);
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShowOnboarding(true);
  }, []);

  return {
    showOnboarding,
    isLoading,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}

export default useOnboarding;
