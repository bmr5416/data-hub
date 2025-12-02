import { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import { KPI_CATEGORIES, KPI_FREQUENCIES } from '../../data/formConstants';
import { capitalize } from '../../utils/string';
import styles from './EntityForm.module.css';

const ANIMATION_DURATION = 150;

export default function KPIForm({ initialData = null, onSubmit, onClose }) {
  const isEditMode = Boolean(initialData);
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || 'revenue',
    definition: initialData?.definition || '',
    targetValue: initialData?.targetValue || '',
    reportingFrequency: initialData?.reportingFrequency || 'monthly',
    owner: initialData?.owner || '',
    notes: initialData?.notes || '',
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
        <h3>{isEditMode ? 'Edit KPI' : 'Add KPI'}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label htmlFor="kpi-name">Name *</label>
            <input
              type="text"
              id="kpi-name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Monthly ROAS"
              required
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="kpi-category">Category</label>
            <select
              id="kpi-category"
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {KPI_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {capitalize(c)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label htmlFor="kpi-definition">Definition</label>
            <textarea
              id="kpi-definition"
              name="definition"
              value={formData.definition}
              onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
              placeholder="How is this KPI calculated?"
              rows={3}
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="kpi-target">Target Value</label>
            <input
              type="text"
              id="kpi-target"
              name="targetValue"
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
              placeholder="e.g., 4.0x"
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="kpi-frequency">Reporting Frequency</label>
            <select
              id="kpi-frequency"
              name="reportingFrequency"
              value={formData.reportingFrequency}
              onChange={(e) => setFormData({ ...formData, reportingFrequency: e.target.value })}
            >
              {KPI_FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {capitalize(f)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label htmlFor="kpi-owner">Owner</label>
            <input
              type="text"
              id="kpi-owner"
              name="owner"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              placeholder="e.g., Marketing Team"
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="kpi-notes">Internal Notes</label>
            <textarea
              id="kpi-notes"
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
            <Button type="submit">{isEditMode ? 'Save Changes' : 'Add KPI'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

KPIForm.propTypes = {
  initialData: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    category: PropTypes.string,
    definition: PropTypes.string,
    targetValue: PropTypes.string,
    reportingFrequency: PropTypes.string,
    owner: PropTypes.string,
    notes: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
