import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useWizard } from '../../hooks/useWizard';
import { useAudio } from '../../hooks/useAudio';
import Card from '../common/Card';
import WizardProgress from './WizardProgress';
import WizardNavigation from './WizardNavigation';
import styles from './Wizard.module.css';

export default function Wizard({
  steps,
  initialData,
  onComplete,
  onCancel,
  title,
  subtitle,
  className
}) {
  const wizard = useWizard({ steps, initialData, onComplete });
  const { playWizardStep, playWizardComplete } = useAudio();

  const {
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
  } = wizard;

  const handleNext = useCallback(async () => {
    if (isLastStep) {
      await submit();
      playWizardComplete();
      // Reset wizard state after successful completion
      reset();
    } else {
      playWizardStep();
      goNext();
    }
  }, [isLastStep, submit, goNext, reset, playWizardStep, playWizardComplete]);

  const handleCancel = useCallback(() => {
    // Reset wizard state when cancelling
    reset();
    if (onCancel) {
      onCancel();
    }
  }, [onCancel, reset]);

  const CurrentStepComponent = currentStep?.component;

  if (!CurrentStepComponent) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <header className={styles.header}>
        {title && <h1 className={styles.title}>{title}</h1>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </header>

      <Card padding="none" className={styles.wizardCard}>
        <WizardProgress
          steps={steps}
          currentStepIndex={currentStepIndex}
          visitedSteps={visitedSteps}
          onStepClick={goToStep}
        />

        <div className={styles.content}>
          <CurrentStepComponent
            data={data}
            onChange={updateData}
            isFirstStep={currentStepIndex === 0}
            isLastStep={isLastStep}
          />
        </div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <WizardNavigation
          onBack={goBack}
          onNext={handleNext}
          onCancel={handleCancel}
          isFirstStep={currentStepIndex === 0}
          isLastStep={isLastStep}
          isValid={canGoNext}
          isSubmitting={isSubmitting}
          nextLabel={isLastStep ? 'Complete' : 'Next'}
          canGoBack={canGoBack}
        />
      </Card>
    </div>
  );
}

Wizard.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    component: PropTypes.elementType.isRequired,
    isValid: PropTypes.func,
    canSkip: PropTypes.bool
  })).isRequired,
  initialData: PropTypes.object,
  onComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  className: PropTypes.string
};
