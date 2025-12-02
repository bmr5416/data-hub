/**
 * CompleteStep - Final step of onboarding wizard
 *
 * Congratulates user and provides next action.
 */

import PropTypes from 'prop-types';
import PSXSprite from '../../common/PSXSprite';
import styles from './CompleteStep.module.css';

export default function CompleteStep({ data: _data, onChange: _onChange }) {
  return (
    <div className={styles.container}>
      <div className={styles.celebration}>
        <PSXSprite sprite="heartGreen" size="lg" animation="pulse" />
        <h2 className={styles.title}>You&apos;re All Set!</h2>
        <p className={styles.subtitle}>
          You&apos;re ready to start managing your marketing data
        </p>
      </div>

      <div className={styles.nextSteps}>
        <h4 className={styles.nextTitle}>What&apos;s Next?</h4>

        <div className={styles.action}>
          <div className={styles.actionIcon}>
            <PSXSprite sprite="star" size="sm" />
          </div>
          <div className={styles.actionContent}>
            <strong>Create Your First Client</strong>
            <p>Click &quot;+ Add Client&quot; on the Dashboard to get started</p>
          </div>
        </div>

        <div className={styles.action}>
          <div className={styles.actionIcon}>
            <PSXSprite sprite="floppy" size="sm" />
          </div>
          <div className={styles.actionContent}>
            <strong>Add Data Sources</strong>
            <p>Connect platforms and upload your first CSV data</p>
          </div>
        </div>

        <div className={styles.action}>
          <div className={styles.actionIcon}>
            <PSXSprite sprite="coin" size="sm" />
          </div>
          <div className={styles.actionContent}>
            <strong>Build Reports</strong>
            <p>Create dashboards with KPIs and automated delivery</p>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <p>Click <strong>&quot;Get Started&quot;</strong> to begin your journey!</p>
      </div>
    </div>
  );
}

CompleteStep.propTypes = {
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
