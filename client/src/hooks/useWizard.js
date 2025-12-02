import { useState, useCallback } from 'react';

export function useWizard({ steps, initialData, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState(initialData || {});
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const currentStep = steps[currentStepIndex];
  const canGoBack = currentStepIndex > 0;
  const canGoNext = currentStep?.isValid ? currentStep.isValid(data) : true;
  const isLastStep = currentStepIndex === steps.length - 1;

  const goNext = useCallback(() => {
    if (canGoNext && !isLastStep) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setVisitedSteps(prev => new Set([...prev, nextIndex]));
    }
  }, [canGoNext, isLastStep, currentStepIndex]);

  const goBack = useCallback(() => {
    if (canGoBack) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [canGoBack, currentStepIndex]);

  const goToStep = useCallback((index) => {
    if (visitedSteps.has(index) && index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  }, [visitedSteps, steps.length]);

  const updateData = useCallback((updates) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setData(initialData || {});
    setVisitedSteps(new Set([0]));
    setIsSubmitting(false);
    setError(null);
  }, [initialData]);

  const submit = useCallback(async () => {
    if (!isLastStep) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onComplete(data);
    } catch (err) {
      setError(err.message || 'An error occurred during submission');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [isLastStep, onComplete, data]);

  return {
    currentStepIndex,
    currentStep,
    data,
    visitedSteps,
    isSubmitting,
    error,
    canGoBack,
    canGoNext,
    isLastStep,
    goToStep,
    goBack,
    goNext,
    updateData,
    reset,
    submit
  };
}
