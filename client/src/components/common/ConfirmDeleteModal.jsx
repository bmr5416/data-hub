/**
 * ConfirmDeleteModal - Reusable delete confirmation modal
 *
 * Provides a consistent Win98-themed confirmation dialog for delete operations.
 */

import PropTypes from 'prop-types';
import Modal from './Modal';
import Button from './Button';
import Icon from './Icon';
import styles from './ConfirmDeleteModal.module.css';

export default function ConfirmDeleteModal({
  isOpen,
  entityType,
  entityName,
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm">
      <div className={styles.container}>
        <div className={styles.iconWrapper}>
          <Icon name="alert" size={48} />
        </div>

        <h2 className={styles.title}>Delete {entityType}?</h2>

        <p className={styles.message}>
          Are you sure you want to delete{' '}
          <strong className={styles.entityName}>{entityName}</strong>?
          This action cannot be undone.
        </p>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}

ConfirmDeleteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  entityType: PropTypes.string.isRequired,
  entityName: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
