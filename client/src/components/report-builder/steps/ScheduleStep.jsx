import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAudio } from '../../../hooks/useAudio';
import Card from '../../common/Card';
import Icon from '../../common/Icon';
import Button from '../../common/Button';
import styles from './ScheduleStep.module.css';

/**
 * Schedule Step
 *
 * Step 3 of the Report Builder wizard.
 * Configures delivery frequency, format, and recipients.
 */
export default function ScheduleStep({ data, onChange }) {
  const { schedule = {} } = data;
  const {
    frequency = 'on_demand',
    dayOfWeek = 'monday',
    dayOfMonth = 1,
    time = '09:00',
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
    deliveryFormat = 'view_only',
    recipients = [],
  } = schedule;

  const [newRecipient, setNewRecipient] = useState('');
  const [recipientError, setRecipientError] = useState('');
  const { playClick } = useAudio();

  const updateSchedule = useCallback(
    (updates) => {
      onChange({
        schedule: {
          ...schedule,
          ...updates,
        },
      });
    },
    [schedule, onChange]
  );

  const handleAddRecipient = useCallback(() => {
    playClick();
    const email = newRecipient.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setRecipientError('Please enter a valid email address');
      return;
    }

    // Check for duplicates
    if (recipients.includes(email)) {
      setRecipientError('This email is already added');
      return;
    }

    updateSchedule({ recipients: [...recipients, email] });
    setNewRecipient('');
    setRecipientError('');
  }, [playClick, newRecipient, recipients, updateSchedule]);

  const handleRemoveRecipient = useCallback(
    (email) => {
      playClick();
      updateSchedule({
        recipients: recipients.filter((r) => r !== email),
      });
    },
    [playClick, recipients, updateSchedule]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddRecipient();
      }
    },
    [handleAddRecipient]
  );

  const frequencyOptions = [
    { value: 'on_demand', label: 'On Demand', description: 'Generate reports manually' },
    { value: 'daily', label: 'Daily', description: 'Send every day' },
    { value: 'weekly', label: 'Weekly', description: 'Send once a week' },
    { value: 'monthly', label: 'Monthly', description: 'Send once a month' },
  ];

  const dayOfWeekOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  const formatOptions = [
    { value: 'view_only', label: 'View Only', description: 'Link to view in Data Hub' },
    { value: 'csv', label: 'CSV', description: 'Spreadsheet attachment' },
    { value: 'pdf', label: 'PDF', description: 'Visual report attachment' },
  ];

  const isScheduled = frequency !== 'on_demand';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Schedule & Delivery</h3>
        <p className={styles.description}>
          Configure how and when your report should be delivered.
        </p>
      </div>

      {/* Frequency Selection */}
      <Card className={styles.section}>
        <h4 id="frequency-heading" className={styles.sectionTitle}>Frequency</h4>
        <div className={styles.frequencyGrid} role="group" aria-labelledby="frequency-heading">
          {frequencyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.frequencyOption} ${frequency === option.value ? styles.selected : ''}`}
              onClick={() => updateSchedule({ frequency: option.value })}
              aria-pressed={frequency === option.value}
              aria-describedby={`freq-desc-${option.value}`}
            >
              <span className={styles.frequencyLabel}>{option.label}</span>
              <span id={`freq-desc-${option.value}`} className={styles.frequencyDesc}>{option.description}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Schedule Details (only if scheduled) */}
      {isScheduled && (
        <Card className={styles.section}>
          <h4 id="schedule-details-heading" className={styles.sectionTitle}>Schedule Details</h4>

          <div className={styles.scheduleFields} role="group" aria-labelledby="schedule-details-heading">
            {/* Day of Week (weekly) */}
            {frequency === 'weekly' && (
              <div className={styles.field}>
                <label htmlFor="day-of-week" className={styles.label}>Day of Week</label>
                <select
                  id="day-of-week"
                  className={styles.select}
                  value={dayOfWeek}
                  onChange={(e) => updateSchedule({ dayOfWeek: e.target.value })}
                >
                  {dayOfWeekOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Day of Month (monthly) */}
            {frequency === 'monthly' && (
              <div className={styles.field}>
                <label htmlFor="day-of-month" className={styles.label}>Day of Month</label>
                <select
                  id="day-of-month"
                  className={styles.select}
                  value={dayOfMonth}
                  onChange={(e) => updateSchedule({ dayOfMonth: parseInt(e.target.value, 10) })}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Time */}
            <div className={styles.field}>
              <label htmlFor="schedule-time" className={styles.label}>Time</label>
              <input
                id="schedule-time"
                type="time"
                className={styles.input}
                value={time}
                onChange={(e) => updateSchedule({ time: e.target.value })}
              />
            </div>

            {/* Timezone */}
            <div className={styles.field}>
              <label htmlFor="schedule-timezone" className={styles.label}>Timezone</label>
              <input
                id="schedule-timezone"
                type="text"
                className={styles.input}
                value={timezone}
                readOnly
                aria-describedby="timezone-hint"
              />
              <span id="timezone-hint" className={styles.visuallyHidden}>
                Auto-detected from your browser
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Delivery Format */}
      <Card className={styles.section}>
        <h4 id="format-heading" className={styles.sectionTitle}>Delivery Format</h4>
        <div className={styles.formatGrid} role="group" aria-labelledby="format-heading">
          {formatOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.formatOption} ${deliveryFormat === option.value ? styles.selected : ''}`}
              onClick={() => updateSchedule({ deliveryFormat: option.value })}
              aria-pressed={deliveryFormat === option.value}
              aria-describedby={`format-desc-${option.value}`}
            >
              <Icon
                name={
                  option.value === 'view_only'
                    ? 'eye'
                    : option.value === 'csv'
                      ? 'document'
                      : 'document'
                }
                size={20}
                aria-hidden="true"
              />
              <span className={styles.formatLabel}>{option.label}</span>
              <span id={`format-desc-${option.value}`} className={styles.formatDesc}>{option.description}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Recipients (only if scheduled) */}
      {isScheduled && (
        <Card className={styles.section}>
          <h4 id="recipients-heading" className={styles.sectionTitle}>Recipients</h4>
          <p id="recipients-hint" className={styles.hint}>
            Add email addresses to receive scheduled reports.
          </p>

          <div className={styles.recipientInput}>
            <label htmlFor="new-recipient" className={styles.visuallyHidden}>
              Email address
            </label>
            <input
              id="new-recipient"
              type="email"
              className={styles.input}
              placeholder="email@example.com"
              value={newRecipient}
              onChange={(e) => {
                setNewRecipient(e.target.value);
                setRecipientError('');
              }}
              onKeyDown={handleKeyDown}
              aria-describedby={recipientError ? 'recipient-error recipients-hint' : 'recipients-hint'}
              aria-invalid={recipientError ? 'true' : undefined}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddRecipient}
              disabled={!newRecipient.trim()}
              aria-label="Add recipient"
            >
              Add
            </Button>
          </div>

          {recipientError && (
            <p id="recipient-error" className={styles.error} role="alert">
              {recipientError}
            </p>
          )}

          {recipients.length > 0 && (
            <ul className={styles.recipientList} aria-label="Added recipients">
              {recipients.map((email) => (
                <li key={email} className={styles.recipient}>
                  <Icon name="mail" size={14} aria-hidden="true" />
                  <span className={styles.recipientEmail}>{email}</span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemoveRecipient(email)}
                    aria-label={`Remove ${email}`}
                  >
                    <Icon name="x" size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {recipients.length === 0 && (
            <p className={styles.noRecipients} role="status">
              No recipients added yet. Add at least one to enable scheduled delivery.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

ScheduleStep.propTypes = {
  data: PropTypes.shape({
    schedule: PropTypes.shape({
      frequency: PropTypes.string,
      dayOfWeek: PropTypes.string,
      dayOfMonth: PropTypes.number,
      time: PropTypes.string,
      timezone: PropTypes.string,
      deliveryFormat: PropTypes.string,
      recipients: PropTypes.arrayOf(PropTypes.string),
    }),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
