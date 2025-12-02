import { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import { ETL_ORCHESTRATORS, ETL_STATUSES } from '../../data/formConstants';
import { capitalize } from '../../utils/string';
import styles from './EntityForm.module.css';

const ANIMATION_DURATION = 150;

export default function ETLForm({ onSubmit, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    transformDescription: '',
    schedule: '',
    orchestrator: 'manual',
    status: 'active',
    notes: '',
  });
  const closingTimeoutRef = useRef(null);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    closingTimeoutRef.current = setTimeout(() => {
      onClose();
    }, ANIMATION_DURATION);
  }, [isClosing, onClose]);

  useEffect(() => {
    return () => {
      if (closingTimeoutRef.current) clearTimeout(closingTimeoutRef.current);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const overlayClasses = [styles.formOverlay, isClosing && styles.closing].filter(Boolean).join(' ');
  const modalClasses = [styles.formModal, isClosing && styles.closing].filter(Boolean).join(' ');

  return (
    <div className={overlayClasses} onClick={handleClose}>
      <div className={modalClasses} onClick={(e) => e.stopPropagation()}>
        <h3>Add ETL Process</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label htmlFor="etl-name">Name *</label>
            <input
              type="text"
              id="etl-name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Daily Meta CAPI Sync"
              required
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="etl-destination">Destination</label>
            <input
              type="text"
              id="etl-destination"
              name="destination"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g., Snowflake warehouse"
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="etl-orchestrator">Orchestrator</label>
            <select
              id="etl-orchestrator"
              name="orchestrator"
              value={formData.orchestrator}
              onChange={(e) => setFormData({ ...formData, orchestrator: e.target.value })}
            >
              {ETL_ORCHESTRATORS.map((o) => (
                <option key={o} value={o}>
                  {capitalize(o)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label htmlFor="etl-schedule">Schedule</label>
            <input
              type="text"
              id="etl-schedule"
              name="schedule"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              placeholder="e.g., Daily at 6 AM"
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="etl-status">Status</label>
            <select
              id="etl-status"
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {ETL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {capitalize(s)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label htmlFor="etl-transform">Transformation Description</label>
            <textarea
              id="etl-transform"
              name="transformDescription"
              value={formData.transformDescription}
              onChange={(e) => setFormData({ ...formData, transformDescription: e.target.value })}
              placeholder="Describe the data transformations..."
              rows={3}
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="etl-notes">Internal Notes</label>
            <textarea
              id="etl-notes"
              name="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add internal documentation or context..."
              rows={2}
            />
          </div>
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Add ETL Process</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

ETLForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
