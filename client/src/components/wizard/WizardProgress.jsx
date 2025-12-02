import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { useAudio } from '../../hooks/useAudio';
import styles from './WizardProgress.module.css';

export default function WizardProgress({
  steps,
  currentStepIndex,
  visitedSteps,
  onStepClick
}) {
  const { playClick } = useAudio();

  const handleStepClick = useCallback((index, isClickable) => {
    if (isClickable) {
      playClick();
      onStepClick(index);
    }
  }, [playClick, onStepClick]);

  return (
    <div className={styles.progress}>
      <div className={styles.steps}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isVisited = visitedSteps.has(index);
          const isClickable = isVisited && index !== currentStepIndex;

          return (
            <div
              key={step.id}
              className={`${styles.stepItem} ${
                isCurrent ? styles.current : ''
              } ${isCompleted ? styles.completed : ''} ${
                isClickable ? styles.clickable : ''
              }`}
            >
              <button
                className={styles.stepCircle}
                onClick={() => handleStepClick(index, isClickable)}
                disabled={!isClickable}
                aria-label={`${step.title}${isCurrent ? ' (current)' : ''}${isCompleted ? ' (completed)' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className={styles.stepNumber}>
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8L6 11L13 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
              </button>
              <div className={styles.stepLabel}>
                {step.title}
              </div>
              {index < steps.length - 1 && (
                <div className={`${styles.stepLine} ${isCompleted ? styles.lineCompleted : ''}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

WizardProgress.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  })).isRequired,
  currentStepIndex: PropTypes.number.isRequired,
  visitedSteps: PropTypes.instanceOf(Set).isRequired,
  onStepClick: PropTypes.func.isRequired
};
