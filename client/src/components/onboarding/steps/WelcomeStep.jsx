/**
 * WelcomeStep - First step of onboarding wizard
 *
 * Introduces the user to Data Hub and its core features.
 */

import PropTypes from 'prop-types';
import PSXSprite from '../../common/PSXSprite';
import styles from './WelcomeStep.module.css';

export default function WelcomeStep({ data: _data, onChange: _onChange }) {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <PSXSprite sprite="star" size="lg" animation="pulse" />
        <h2 className={styles.title}>Welcome to Data Hub</h2>
        <p className={styles.tagline}>Bring clarity to chaos</p>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <PSXSprite sprite="floppy" size="md" />
          <div className={styles.featureContent}>
            <h4>Data Warehouse</h4>
            <p>Store and organize data from multiple marketing platforms</p>
          </div>
        </div>

        <div className={styles.feature}>
          <PSXSprite sprite="monitor" size="md" />
          <div className={styles.featureContent}>
            <h4>Unified Dashboard</h4>
            <p>Track KPIs and visualize performance across all channels</p>
          </div>
        </div>

        <div className={styles.feature}>
          <PSXSprite sprite="coin" size="md" />
          <div className={styles.featureContent}>
            <h4>Automated Reports</h4>
            <p>Schedule and deliver reports automatically via email</p>
          </div>
        </div>
      </div>

      <div className={styles.cta}>
        <p>Ready to get started? Let&apos;s set up your first client.</p>
      </div>
    </div>
  );
}

WelcomeStep.propTypes = {
  data: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
