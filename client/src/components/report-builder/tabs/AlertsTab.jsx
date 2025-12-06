import PropTypes from 'prop-types';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import PSXSprite from '../../common/PSXSprite';
import StatusBadge from '../../common/StatusBadge';
import styles from '../ReportDetailModal.module.css';

/**
 * Alerts Tab for Report Detail Modal
 *
 * Displays alert list, creation form, and alert management.
 */
export default function AlertsTab({
  alerts,
  alertsLoading,
  showAlertForm,
  alertFormData,
  onToggleAlertForm,
  onAlertFormChange,
  onCreateAlert,
  onToggleAlert,
  onDeleteAlert,
}) {
  return (
    <div className={styles.alerts}>
      <div className={styles.alertsHeader}>
        <h4 className={styles.sectionTitle}>Report Alerts</h4>
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggleAlertForm}
        >
          <Icon name={showAlertForm ? 'x' : 'plus'} size={14} />
          {showAlertForm ? 'Cancel' : 'Add Alert'}
        </Button>
      </div>

      {/* Alert Creation Form */}
      {showAlertForm && (
        <Card className={styles.alertForm}>
          <div className={styles.formField}>
            <label htmlFor="alert-type">Alert Type</label>
            <select
              id="alert-type"
              value={alertFormData.type}
              onChange={(e) => onAlertFormChange({ ...alertFormData, type: e.target.value })}
            >
              <option value="metric_threshold">Metric Threshold</option>
              <option value="trend_detection">Trend Detection</option>
              <option value="data_freshness">Data Freshness</option>
            </select>
          </div>

          {/* Metric Threshold Fields */}
          {alertFormData.type === 'metric_threshold' && (
            <>
              <div className={styles.formField}>
                <label htmlFor="alert-metric">Metric</label>
                <input
                  type="text"
                  id="alert-metric"
                  placeholder="e.g., spend, roas, impressions"
                  value={alertFormData.metric}
                  onChange={(e) => onAlertFormChange({ ...alertFormData, metric: e.target.value })}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label htmlFor="alert-condition">Condition</label>
                  <select
                    id="alert-condition"
                    value={alertFormData.condition}
                    onChange={(e) => onAlertFormChange({ ...alertFormData, condition: e.target.value })}
                  >
                    <option value="gt">Greater than</option>
                    <option value="lt">Less than</option>
                    <option value="eq">Equal to</option>
                    <option value="gte">Greater or equal</option>
                    <option value="lte">Less or equal</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label htmlFor="alert-threshold">Threshold</label>
                  <input
                    type="number"
                    id="alert-threshold"
                    placeholder="e.g., 1000"
                    value={alertFormData.threshold}
                    onChange={(e) => onAlertFormChange({ ...alertFormData, threshold: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {/* Trend Detection Fields */}
          {alertFormData.type === 'trend_detection' && (
            <>
              <div className={styles.formField}>
                <label htmlFor="alert-trend-metric">Metric</label>
                <input
                  type="text"
                  id="alert-trend-metric"
                  placeholder="e.g., roas, cpa"
                  value={alertFormData.metric}
                  onChange={(e) => onAlertFormChange({ ...alertFormData, metric: e.target.value })}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label htmlFor="alert-change-percent">Change %</label>
                  <input
                    type="number"
                    id="alert-change-percent"
                    placeholder="e.g., 20"
                    value={alertFormData.changePercent}
                    onChange={(e) => onAlertFormChange({ ...alertFormData, changePercent: e.target.value })}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="alert-period">Period</label>
                  <select
                    id="alert-period"
                    value={alertFormData.period}
                    onChange={(e) => onAlertFormChange({ ...alertFormData, period: e.target.value })}
                  >
                    <option value="wow">Week over Week</option>
                    <option value="mom">Month over Month</option>
                    <option value="dod">Day over Day</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Data Freshness Fields */}
          {alertFormData.type === 'data_freshness' && (
            <>
              <div className={styles.formField}>
                <label htmlFor="alert-max-hours">Max Hours Stale</label>
                <input
                  type="number"
                  id="alert-max-hours"
                  placeholder="e.g., 24"
                  value={alertFormData.maxHoursStale}
                  onChange={(e) => onAlertFormChange({ ...alertFormData, maxHoursStale: e.target.value })}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="alert-platform">Platform (optional)</label>
                <input
                  type="text"
                  id="alert-platform"
                  placeholder="e.g., meta_ads"
                  value={alertFormData.platformId}
                  onChange={(e) => onAlertFormChange({ ...alertFormData, platformId: e.target.value })}
                />
              </div>
            </>
          )}

          <div className={styles.formActions}>
            <Button variant="primary" onClick={onCreateAlert}>
              Create Alert
            </Button>
          </div>
        </Card>
      )}

      {/* Alerts List */}
      {alertsLoading ? (
        <div className={styles.emptyState}>
          <PSXSprite sprite="hourglass" size="md" animation="spin" />
          <p>Loading alerts...</p>
        </div>
      ) : alerts.length > 0 ? (
        <div className={styles.alertsList}>
          {alerts.map((alert) => (
            <Card key={alert.id} className={styles.alertItem}>
              <div className={styles.alertInfo}>
                <div className={styles.alertHeader}>
                  <span className={styles.alertType}>
                    {alert.type === 'metric_threshold' && 'Metric Threshold'}
                    {alert.type === 'trend_detection' && 'Trend Detection'}
                    {alert.type === 'data_freshness' && 'Data Freshness'}
                  </span>
                  <StatusBadge
                    status={alert.isActive ? 'active' : 'inactive'}
                    size="sm"
                  />
                </div>
                <div className={styles.alertConfig}>
                  {alert.type === 'metric_threshold' && (
                    <span>
                      {alert.config?.metric}{' '}
                      {alert.config?.condition === 'gt' && '>'}
                      {alert.config?.condition === 'lt' && '<'}
                      {alert.config?.condition === 'eq' && '='}
                      {alert.config?.condition === 'gte' && '≥'}
                      {alert.config?.condition === 'lte' && '≤'}{' '}
                      {alert.config?.threshold}
                    </span>
                  )}
                  {alert.type === 'trend_detection' && (
                    <span>
                      {alert.config?.metric} changes &gt; {alert.config?.changePercent}%{' '}
                      ({alert.config?.period?.toUpperCase()})
                    </span>
                  )}
                  {alert.type === 'data_freshness' && (
                    <span>
                      Stale after {alert.config?.maxHoursStale} hours
                      {alert.config?.platformId && ` (${alert.config.platformId})`}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.alertActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleAlert(alert.id, alert.isActive)}
                >
                  {alert.isActive ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteAlert(alert.id)}
                >
                  <Icon name="trash" size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <PSXSprite sprite="tubeRed" size="lg" />
          <p>No alerts configured</p>
          <p className={styles.emptyHint}>
            Create alerts to get notified when metrics exceed thresholds
          </p>
        </div>
      )}
    </div>
  );
}

AlertsTab.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.string,
      isActive: PropTypes.bool,
      config: PropTypes.shape({
        metric: PropTypes.string,
        condition: PropTypes.string,
        threshold: PropTypes.number,
        changePercent: PropTypes.number,
        period: PropTypes.string,
        maxHoursStale: PropTypes.number,
        platformId: PropTypes.string,
      }),
    })
  ).isRequired,
  alertsLoading: PropTypes.bool,
  showAlertForm: PropTypes.bool.isRequired,
  alertFormData: PropTypes.shape({
    type: PropTypes.string,
    metric: PropTypes.string,
    condition: PropTypes.string,
    threshold: PropTypes.string,
    changePercent: PropTypes.string,
    period: PropTypes.string,
    maxHoursStale: PropTypes.string,
    platformId: PropTypes.string,
    isActive: PropTypes.bool,
  }).isRequired,
  onToggleAlertForm: PropTypes.func.isRequired,
  onAlertFormChange: PropTypes.func.isRequired,
  onCreateAlert: PropTypes.func.isRequired,
  onToggleAlert: PropTypes.func.isRequired,
  onDeleteAlert: PropTypes.func.isRequired,
};
