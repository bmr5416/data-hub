import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import PSXSprite from '../common/PSXSprite';
import Button from '../common/Button';
import styles from './DuplicatePlatformModal.module.css';

/**
 * DuplicatePlatformModal
 *
 * Warning modal shown when user selects a platform that
 * has already been added to the workspace.
 * User can proceed (add another source) or cancel.
 */
export default function DuplicatePlatformModal({ isOpen, platformName, onConfirm, onCancel }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      closeOnOverlayClick
      closeOnEscape
    >
      <div className={styles.header}>
        <PSXSprite sprite="tubeRed" size="md" />
        <h3 className={styles.title}>Platform Already Configured</h3>
      </div>

      <div className={styles.content}>
        <p className={styles.message}>
          <strong>{platformName}</strong> has already been added to this workspace.
        </p>
        <p className={styles.subMessage}>
          Adding another source will create a separate data stream from this platform.
          This is useful if you have multiple accounts or data segments.
        </p>
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Add Another Source
        </Button>
      </div>
    </Modal>
  );
}

DuplicatePlatformModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  platformName: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
