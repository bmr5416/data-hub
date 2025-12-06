import PropTypes from 'prop-types';
import Card from '../../common/Card';
import { capitalize } from '../../../utils/string';
import styles from '../ReportDetailModal.module.css';

/**
 * Schedule Tab for Report Detail Modal
 *
 * Displays schedule settings and timing information.
 */
export default function ScheduleTab({ report, formatFrequency }) {
  const schedule = report.scheduleConfig || {};
  const isScheduled = report.frequency !== 'on_demand' && report.isScheduled;

  return (
    <div className={styles.schedule}>
      <Card className={styles.scheduleCard}>
        <h4 className={styles.sectionTitle}>Schedule Settings</h4>
        <div className={styles.scheduleInfo}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Frequency:</span>
            <span className={styles.infoValue}>{formatFrequency(report.frequency)}</span>
          </div>
          {isScheduled && (
            <>
              {schedule.dayOfWeek && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Day:</span>
                  <span className={styles.infoValue}>
                    {capitalize(schedule.dayOfWeek)}
                  </span>
                </div>
              )}
              {schedule.dayOfMonth && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Day of Month:</span>
                  <span className={styles.infoValue}>{schedule.dayOfMonth}</span>
                </div>
              )}
              {schedule.time && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Time:</span>
                  <span className={styles.infoValue}>{schedule.time}</span>
                </div>
              )}
              {schedule.timezone && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Timezone:</span>
                  <span className={styles.infoValue}>{schedule.timezone}</span>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

ScheduleTab.propTypes = {
  report: PropTypes.shape({
    frequency: PropTypes.string,
    isScheduled: PropTypes.bool,
    scheduleConfig: PropTypes.shape({
      dayOfWeek: PropTypes.string,
      dayOfMonth: PropTypes.number,
      time: PropTypes.string,
      timezone: PropTypes.string,
    }),
  }).isRequired,
  formatFrequency: PropTypes.func.isRequired,
};
