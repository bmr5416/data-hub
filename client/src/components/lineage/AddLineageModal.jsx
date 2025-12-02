import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useModalForm } from '../../hooks/useModalForm';
import styles from './AddLineageModal.module.css';

/**
 * Modal for adding a data lineage connection
 * Uses base Modal component for consistent behavior across the app.
 */
export default function AddLineageModal({
  isOpen,
  sources,
  etlProcesses,
  kpis,
  reports,
  onSubmit,
  onClose,
}) {
  const {
    formData,
    updateFormData,
    loading: submitting,
    error,
    handleSubmit,
  } = useModalForm({
    initialData: {
      sourceId: '',
      destinationType: 'etl',
      destinationId: '',
      transformationNotes: '',
    },
    validate: (data) => {
      const errors = {};
      if (!data.sourceId) errors.sourceId = 'Please select a source';
      if (!data.destinationId) errors.destinationId = 'Please select a destination';
      return errors;
    },
    onSubmit: async (data) => {
      const result = await onSubmit(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create connection');
      }
      return result;
    },
    onSuccess: () => {
      onClose();
    },
  });

  // Get destination options based on selected type
  const getDestinationOptions = () => {
    switch (formData.destinationType) {
      case 'etl':
        return etlProcesses || [];
      case 'kpi':
        return kpis || [];
      case 'report':
        return reports || [];
      default:
        return [];
    }
  };

  const destinationOptions = getDestinationOptions();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closeOnOverlayClick={!submitting}
      closeOnEscape={!submitting}
    >
      <h3 className={styles.title}>Add Lineage Connection</h3>

      <form onSubmit={handleSubmit}>
        {error && (
          <div id="lineage-error" className={styles.error} role="alert">
            {error}
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="lineage-source" className={styles.label}>Source *</label>
          <select
            id="lineage-source"
            className={styles.select}
            value={formData.sourceId}
            onChange={(e) => updateFormData({ sourceId: e.target.value })}
            disabled={submitting}
            aria-invalid={error && !formData.sourceId ? 'true' : undefined}
            aria-describedby={error ? 'lineage-error' : undefined}
          >
            <option value="">Select a data source...</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name || source.platform}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="lineage-dest-type" className={styles.label}>Destination Type *</label>
          <select
            id="lineage-dest-type"
            className={styles.select}
            value={formData.destinationType}
            onChange={(e) =>
              updateFormData({
                destinationType: e.target.value,
                destinationId: '', // Reset destination when type changes
              })
            }
            disabled={submitting}
          >
            <option value="etl">ETL Process</option>
            <option value="kpi">KPI</option>
            <option value="report">Report</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="lineage-dest" className={styles.label}>Destination *</label>
          <select
            id="lineage-dest"
            className={styles.select}
            value={formData.destinationId}
            onChange={(e) => updateFormData({ destinationId: e.target.value })}
            disabled={submitting || destinationOptions.length === 0}
            aria-invalid={error && !formData.destinationId ? 'true' : undefined}
          >
            <option value="">
              {destinationOptions.length === 0
                ? `No ${formData.destinationType}s available`
                : `Select a ${formData.destinationType}...`}
            </option>
            {destinationOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="lineage-notes" className={styles.label}>Transformation Notes</label>
          <textarea
            id="lineage-notes"
            className={styles.textarea}
            value={formData.transformationNotes}
            onChange={(e) =>
              updateFormData({ transformationNotes: e.target.value })
            }
            placeholder="Describe how the data is transformed..."
            rows={3}
            disabled={submitting}
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Add Connection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

AddLineageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  sources: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      platform: PropTypes.string,
    })
  ).isRequired,
  etlProcesses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  kpis: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  reports: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

AddLineageModal.defaultProps = {
  etlProcesses: [],
  kpis: [],
  reports: [],
};
