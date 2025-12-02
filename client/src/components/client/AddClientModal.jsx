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
 * AddClientModal
 *
 * Modal for creating a new client.
 * Uses base Modal component for consistent behavior across the app.
 */
export default function AddClientModal({ isOpen, onSuccess, onCancel }) {
  const {
    formData,
    loading,
    error,
    fieldErrors,
    handleChange,
    handleSubmit,
  } = useModalForm({
    initialData: {
      name: '',
      email: '',
      industry: 'Other',
      notes: '',
    },
    validate: validateForm,
    onSubmit: async (data) => {
      const result = await clientsApi.create({
        name: data.name.trim(),
        email: data.email.trim(),
        industry: data.industry,
        notes: data.notes.trim(),
      });
      return result.client;
    },
    onSuccess: (client) => {
      onSuccess(client);
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
        <h3 className={styles.title}>Add New Client</h3>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.error}>
            <PSXSprite sprite="tubeRed" size="xs" />
            <span>{error}</span>
          </div>
        )}

        <div className={`${styles.field} ${fieldErrors.name ? styles.fieldError : ''}`}>
          <label htmlFor="client-name">Client Name *</label>
          <input
            type="text"
            id="client-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Acme Corporation"
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            autoFocus
          />
          {fieldErrors.name && (
            <span id="name-error" className={styles.fieldErrorText}>{fieldErrors.name}</span>
          )}
        </div>

        <div className={`${styles.field} ${fieldErrors.email ? styles.fieldError : ''}`}>
          <label htmlFor="client-email">Contact Email *</label>
          <input
            type="email"
            id="client-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g., contact@acme.com"
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
          {fieldErrors.email && (
            <span id="email-error" className={styles.fieldErrorText}>{fieldErrors.email}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="client-industry">Industry</label>
          <select
            id="client-industry"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div className={`${styles.field} ${fieldErrors.notes ? styles.fieldError : ''}`}>
          <label htmlFor="client-notes">Notes</label>
          <div className={styles.textareaWrapper}>
            <textarea
              id="client-notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about this client..."
              rows={3}
              maxLength={1000}
              aria-invalid={!!fieldErrors.notes}
              aria-describedby={fieldErrors.notes ? 'notes-error' : undefined}
            />
            <span className={`${styles.charCount} ${formData.notes.length > 900 ? styles.charCountWarning : ''}`}>
              {formData.notes.length}/1000
            </span>
          </div>
          {fieldErrors.notes && (
            <span id="notes-error" className={styles.fieldErrorText}>{fieldErrors.notes}</span>
          )}
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {loading ? 'Creating...' : 'Create Client'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

AddClientModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
