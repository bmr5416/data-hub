import PropTypes from 'prop-types';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import styles from '../ReportDetailModal.module.css';

/**
 * Delivery Tab for Report Detail Modal
 *
 * Handles test email sending and displays recipients list.
 */
export default function DeliveryTab({
  report,
  testEmail,
  onTestEmailChange,
  onSendTest,
  onSendNow,
  sendingTest,
  sendResult,
}) {
  const isScheduled = report.frequency !== 'on_demand' && report.isScheduled;

  return (
    <div className={styles.delivery}>
      <Card className={styles.deliveryCard}>
        <h4 className={styles.sectionTitle}>Send Report</h4>

        <div className={styles.sendSection}>
          <div className={styles.testEmailRow}>
            <input
              type="email"
              className={styles.emailInput}
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => onTestEmailChange(e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={onSendTest}
              disabled={sendingTest || !testEmail.trim()}
            >
              {sendingTest ? 'Sending...' : 'Send Test'}
            </Button>
          </div>

          {onSendNow && isScheduled && (
            <Button variant="primary" onClick={onSendNow}>
              <Icon name="mail" size={14} />
              Send Now to All Recipients
            </Button>
          )}

          {sendResult && (
            <div
              className={`${styles.sendResult} ${sendResult.success ? styles.success : styles.error}`}
            >
              {sendResult.message}
            </div>
          )}
        </div>
      </Card>

      {report.recipients?.length > 0 && (
        <Card className={styles.recipientsCard}>
          <h4 className={styles.sectionTitle}>Recipients</h4>
          <div className={styles.recipientsList}>
            {report.recipients.map((email) => (
              <div key={email} className={styles.recipient}>
                <Icon name="mail" size={14} />
                <span>{email}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

DeliveryTab.propTypes = {
  report: PropTypes.shape({
    frequency: PropTypes.string,
    isScheduled: PropTypes.bool,
    recipients: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  testEmail: PropTypes.string.isRequired,
  onTestEmailChange: PropTypes.func.isRequired,
  onSendTest: PropTypes.func.isRequired,
  onSendNow: PropTypes.func,
  sendingTest: PropTypes.bool,
  sendResult: PropTypes.shape({
    success: PropTypes.bool,
    message: PropTypes.string,
  }),
};
