import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import {
  SOURCE_TYPES,
  CONNECTION_METHODS,
  REFRESH_FREQUENCIES,
  SOURCE_STATUSES,
} from '../../data/formConstants';
import { capitalize } from '../../utils/string';
import styles from './EntityForm.module.css';

export default function SourceForm({ platforms, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    platform: platforms[0]?.id || 'custom',
    sourceType: 'other',
    connectionMethod: 'api',
    refreshFrequency: 'daily',
    status: 'pending',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className={styles.formOverlay} onClick={onClose}>
      <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>
        <h3>Add Data Source</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., GA4 - Website"
              required
            />
          </div>
          <div className={styles.formField}>
            <label>Platform</label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
            >
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label>Source Type</label>
            <select
              value={formData.sourceType}
              onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {capitalize(t)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label>Connection Method</label>
            <select
              value={formData.connectionMethod}
              onChange={(e) => setFormData({ ...formData, connectionMethod: e.target.value })}
            >
              {CONNECTION_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label>Refresh Frequency</label>
            <select
              value={formData.refreshFrequency}
              onChange={(e) => setFormData({ ...formData, refreshFrequency: e.target.value })}
            >
              {REFRESH_FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {capitalize(f)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {SOURCE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {capitalize(s)}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Source</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

SourceForm.propTypes = {
  platforms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
