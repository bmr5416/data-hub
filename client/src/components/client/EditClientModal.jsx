import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { clientsApi } from '../../services/api';
import Modal from '../common/Modal';
import Button from '../common/Button';
import PSXSprite from '../common/PSXSprite';
import { useModalForm } from '../../hooks/useModalForm';
import styles from './AddClientModal.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INDUSTRIES = [
  'E-commerce',
  'SaaS',
  'Healthcare',
  'Finance',
  'Education',
  'Media',
  'Travel',
  'Retail',
  'Technology',
  'Other',
];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'onboarding', label: 'Onboarding' },
];

function validateForm(data) {
  const errors = {};

  const name = data.name.trim();
  if (!name) {
    errors.name = 'Client name is required';
  } else if (name.length < 2) {
    errors.name = 'Client name must be at least 2 characters';
  } else if (name.length > 100) {
    errors.name = 'Client name must be less than 100 characters';
  }

  const email = data.email.trim();
  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (data.notes && data.notes.length > 1000) {
    errors.notes = 'Notes must be less than 1000 characters';
  }

  return errors;
}

/**
 * EditClientModal
 *
 * Modal for editing an existing client.
 * Uses base Modal component for consistent behavior across the app.
 */
export default function EditClientModal({ isOpen, client, onSuccess, onCancel }) {
  // Memoize initial data to prevent form reset on re-renders
  const initialData = useMemo(() => ({
    name: client?.name || '',
    email: client?.email || '',
    industry: client?.industry || 'Other',
    status: client?.status || 'active',
    notes: client?.notes || '',
  }), [client?.name, client?.email, client?.industry, client?.status, client?.notes]);

  const {
    formData,
    loading,
    error,
    fieldErrors,
    handleChange,
    handleSubmit,
  } = useModalForm({
    initialData,
    validate: validateForm,
    onSubmit: async (data) => {
      const result = await clientsApi.update(client.id, {
        name: data.name.trim(),
        email: data.email.trim(),
        industry: data.industry,
        status: data.status,
        notes: data.notes.trim(),
      });
      return result.client;
    },
    onSuccess: (updatedClient) => {
      onSuccess(updatedClient);
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="md"
      closeOnOverlayClick
      closeOnEscape
    >
      <div className={styles.header}>
        <PSXSprite sprite="star" size="md" />
        <h3 className={styles.title}>Edit Client</h3>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.error}>
            <PSXSprite sprite="tubeRed" size="xs" />
            <span>{error}</span>
          </div>
        )}

        <div className={`${styles.field} ${fieldErrors.name ? styles.fieldError : ''}`}>
          <label htmlFor="edit-client-name">Client Name *</label>
          <input
            type="text"
            id="edit-client-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Acme Corporation"
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'edit-name-error' : undefined}
            autoFocus
          />
          {fieldErrors.name && (
            <span id="edit-name-error" className={styles.fieldErrorText}>{fieldErrors.name}</span>
          )}
        </div>

        <div className={`${styles.field} ${fieldErrors.email ? styles.fieldError : ''}`}>
          <label htmlFor="edit-client-email">Contact Email *</label>
          <input
            type="email"
            id="edit-client-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g., contact@acme.com"
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'edit-email-error' : undefined}
          />
          {fieldErrors.email && (
            <span id="edit-email-error" className={styles.fieldErrorText}>{fieldErrors.email}</span>
          )}
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="edit-client-industry">Industry</label>
            <select
              id="edit-client-industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-client-status">Status</label>
            <select
              id="edit-client-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={`${styles.field} ${fieldErrors.notes ? styles.fieldError : ''}`}>
          <label htmlFor="edit-client-notes">Notes</label>
          <div className={styles.textareaWrapper}>
            <textarea
              id="edit-client-notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about this client..."
              rows={3}
              maxLength={1000}
              aria-invalid={!!fieldErrors.notes}
              aria-describedby={fieldErrors.notes ? 'edit-notes-error' : undefined}
            />
            <span className={`${styles.charCount} ${formData.notes.length > 900 ? styles.charCountWarning : ''}`}>
              {formData.notes.length}/1000
            </span>
          </div>
          {fieldErrors.notes && (
            <span id="edit-notes-error" className={styles.fieldErrorText}>{fieldErrors.notes}</span>
          )}
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

EditClientModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  client: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    industry: PropTypes.string,
    status: PropTypes.string,
    notes: PropTypes.string,
  }),
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
