import PropTypes from 'prop-types';
import Card from '../../common/Card';
import PSXSprite from '../../common/PSXSprite';
import styles from '../ReportDetailModal.module.css';

/**
 * Overview Tab for Report Detail Modal
 *
 * Displays report summary stats and info cards.
 */
export default function OverviewTab({ report, visualizationsCount, formatFrequency, formatDelivery }) {
  const isScheduled = report.frequency !== 'on_demand' && report.isScheduled;

  return (
    <div className={styles.overview}>
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <PSXSprite sprite="star" size="sm" />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{visualizationsCount}</span>
            <span className={styles.statLabel}>Visualizations</span>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <PSXSprite sprite="hourglass" size="sm" />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{formatFrequency(report.frequency)}</span>
            <span className={styles.statLabel}>Frequency</span>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <PSXSprite sprite="floppy" size="sm" />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{formatDelivery(report.deliveryFormat)}</span>
            <span className={styles.statLabel}>Format</span>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <PSXSprite sprite="coin" size="sm" />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{report.recipients?.length || 0}</span>
            <span className={styles.statLabel}>Recipients</span>
          </div>
        </Card>
      </div>

      {report.lastSentAt && (
        <Card className={styles.infoCard}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Last Sent:</span>
            <span className={styles.infoValue}>
              {new Date(report.lastSentAt).toLocaleString()}
            </span>
          </div>
        </Card>
      )}

      {report.nextRunAt && isScheduled && (
        <Card className={styles.infoCard}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Next Scheduled:</span>
            <span className={styles.infoValue}>
              {new Date(report.nextRunAt).toLocaleString()}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}

OverviewTab.propTypes = {
  report: PropTypes.shape({
    frequency: PropTypes.string,
    deliveryFormat: PropTypes.string,
    isScheduled: PropTypes.bool,
    recipients: PropTypes.arrayOf(PropTypes.string),
    lastSentAt: PropTypes.string,
    nextRunAt: PropTypes.string,
  }).isRequired,
  visualizationsCount: PropTypes.number.isRequired,
  formatFrequency: PropTypes.func.isRequired,
  formatDelivery: PropTypes.func.isRequired,
};
