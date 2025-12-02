/**
 * QuickSetupStep - Second step of onboarding wizard
 *
 * Quick overview of the main workflow and key concepts.
 */

import PropTypes from 'prop-types';
import Icon from '../../common/Icon';
import styles from './QuickSetupStep.module.css';

export default function QuickSetupStep({ data: _data, onChange: _onChange }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>How Data Hub Works</h3>
        <p className={styles.description}>
          Follow this simple workflow to manage your marketing data
        </p>
      </div>

      <div className={styles.workflow}>
        <div className={styles.step}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepContent}>
            <h4>Create a Client</h4>
            <p>Add your client or company to start organizing their data</p>
          </div>
        </div>

        <div className={styles.arrow}>
          <Icon name="chevron-down" size={24} />
        </div>

        <div className={styles.step}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepContent}>
            <h4>Add Data Sources</h4>
            <p>Connect platforms like Meta Ads, Google Ads, GA4, and more</p>
          </div>
        </div>

        <div className={styles.arrow}>
          <Icon name="chevron-down" size={24} />
        </div>

        <div className={styles.step}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepContent}>
            <h4>Upload Data</h4>
            <p>Import CSV exports from your connected platforms</p>
          </div>
        </div>

        <div className={styles.arrow}>
          <Icon name="chevron-down" size={24} />
        </div>

        <div className={styles.step}>
          <div className={styles.stepNumber}>4</div>
          <div className={styles.stepContent}>
            <h4>Create Reports</h4>
            <p>Build dashboards and schedule automated email delivery</p>
          </div>
        </div>
      </div>

      <div className={styles.tip}>
        <Icon name="info" size={20} />
        <p>
          <strong>Tip:</strong> Start by creating your first client on the Dashboard,
          then use the &quot;Add Data Source&quot; wizard to connect a platform.
        </p>
      </div>
    </div>
  );
}

QuickSetupStep.propTypes = {
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
