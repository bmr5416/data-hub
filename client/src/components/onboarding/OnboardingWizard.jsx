/**
 * OnboardingWizard - First-time user onboarding flow
 *
 * Introduces new users to Data Hub features and workflow.
 * Displayed as a modal overlay for first-time visitors.
 */

import PropTypes from 'prop-types';
import Wizard from '../wizard/Wizard';
import { WelcomeStep, QuickSetupStep, CompleteStep } from './steps';
import styles from './OnboardingWizard.module.css';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome',
    component: WelcomeStep,
  },
  {
    id: 'setup',
    title: 'How It Works',
    component: QuickSetupStep,
  },
  {
    id: 'complete',
    title: 'Get Started',
    component: CompleteStep,
  },
];

export default function OnboardingWizard({ onComplete, onSkip }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <Wizard
          steps={STEPS}
          initialData={{}}
          onComplete={onComplete}
          onCancel={onSkip}
          title="Getting Started"
          subtitle="Welcome to Data Hub"
        />
      </div>
    </div>
  );
}

OnboardingWizard.propTypes = {
  onComplete: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
};
