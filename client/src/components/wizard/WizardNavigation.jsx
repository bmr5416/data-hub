import PropTypes from 'prop-types';
import Button from '../common/Button';
import styles from './WizardNavigation.module.css';

export default function WizardNavigation({
  onBack,
  onNext,
  onCancel,
  isFirstStep,
  isLastStep,
  isValid,
  isSubmitting,
  nextLabel = 'Next',
  backLabel = 'Back',
  cancelLabel = 'Cancel',
  canGoBack = true
}) {
  return (
    <div className={styles.navigation}>
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </Button>
      <div className={styles.actions}>
        {!isFirstStep && (
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            disabled={isSubmitting || !canGoBack}
          >
            ← {backLabel}
          </Button>
        )}
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? 'Processing...' : isLastStep ? nextLabel : `${nextLabel} →`}
        </Button>
      </div>
    </div>
  );
}

WizardNavigation.propTypes = {
  onBack: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  isFirstStep: PropTypes.bool.isRequired,
  isLastStep: PropTypes.bool.isRequired,
  isValid: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  nextLabel: PropTypes.string,
  backLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  canGoBack: PropTypes.bool
};
