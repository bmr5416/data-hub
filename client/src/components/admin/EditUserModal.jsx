/**
 * EditUserModal Component
 *
 * Modal for editing existing user details.
 * Allows updating display name, admin status, active status, and client assignments.
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { adminApi, clientsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Icon from '../common/Icon';
import PSXSprite from '../common/PSXSprite';
import styles from './EditUserModal.module.css';

const ROLES = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
];

export default function EditUserModal({ user, onSuccess, onClose }) {
  const { profile: currentUser } = useAuth();
  const isEditingSelf = user.id === currentUser?.id;

  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    isAdmin: user.isAdmin || false,
    isActive: user.isActive !== false,
    clientAssignments: (user.assignedClients || []).map((a) => ({
      clientId: a.clientId,
      role: a.role,
    })),
  });
  const [availableClients, setAvailableClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch available clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const result = await clientsApi.list();
        setAvailableClients(result.clients || []);
      } catch {
        // Non-critical
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [fieldErrors]);

  const handleClientToggle = useCallback((clientId) => {
    setFormData((prev) => {
      const exists = prev.clientAssignments.find((a) => a.clientId === clientId);
      if (exists) {
        return {
          ...prev,
          clientAssignments: prev.clientAssignments.filter((a) => a.clientId !== clientId),
        };
      }
      return {
        ...prev,
        clientAssignments: [...prev.clientAssignments, { clientId, role: 'viewer' }],
      };
    });
  }, []);

  const handleClientRoleChange = useCallback((clientId, role) => {
    setFormData((prev) => ({
      ...prev,
      clientAssignments: prev.clientAssignments.map((a) =>
        a.clientId === clientId ? { ...a, role } : a
      ),
    }));
  }, []);

  const validate = useCallback(() => {
    const errors = {};

    if (formData.displayName && formData.displayName.length > 100) {
      errors.displayName = 'Display name must be under 100 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      // Update user details
      const updateData = {
        displayName: formData.displayName.trim() || null,
        isActive: formData.isActive,
      };

      // Only include isAdmin if not editing self
      if (!isEditingSelf) {
        updateData.isAdmin = formData.isAdmin;
      }

      await adminApi.updateUser(user.id, updateData);

      // Update client assignments separately
      await adminApi.updateUserClients(user.id, formData.clientAssignments);

      // Fetch updated user to return
      const result = await adminApi.getUser(user.id);
      onSuccess(result.user);
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  }, [formData, validate, user.id, isEditingSelf, onSuccess]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit User"
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.errorBanner}>
            <PSXSprite sprite="tubeRed" size="sm" />
            <span>{error}</span>
          </div>
        )}

        {/* User Info (read-only) */}
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {(user.displayName || user.email)?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userEmail}>{user.email}</span>
            <span className={styles.userId}>ID: {user.id}</span>
          </div>
        </div>

        {/* Display Name Field */}
        <div className={`${styles.field} ${fieldErrors.displayName ? styles.fieldError : ''}`}>
          <label htmlFor="edit-displayName" className={styles.label}>
            Display Name
          </label>
          <input
            type="text"
            id="edit-displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="John Doe"
            className={styles.input}
            maxLength={100}
            disabled={loading}
          />
          <span className={styles.hint}>
            {formData.displayName.length}/100 characters
          </span>
          {fieldErrors.displayName && (
            <span className={styles.errorText}>{fieldErrors.displayName}</span>
          )}
        </div>

        {/* Status Checkboxes */}
        <div className={styles.checkboxGroup}>
          {/* Admin Checkbox */}
          <div className={styles.checkboxField}>
            <label htmlFor="edit-isAdmin" className={styles.checkboxLabel}>
              <input
                type="checkbox"
                id="edit-isAdmin"
                name="isAdmin"
                checked={formData.isAdmin}
                onChange={handleChange}
                disabled={loading || isEditingSelf}
              />
              <span className={styles.checkboxText}>
                <strong>Admin privileges</strong>
                {isEditingSelf && (
                  <span className={styles.checkboxHint}>
                    You cannot change your own admin status
                  </span>
                )}
              </span>
            </label>
          </div>

          {/* Active Checkbox */}
          <div className={styles.checkboxField}>
            <label htmlFor="edit-isActive" className={styles.checkboxLabel}>
              <input
                type="checkbox"
                id="edit-isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                disabled={loading || isEditingSelf}
              />
              <span className={styles.checkboxText}>
                <strong>Active account</strong>
                <span className={styles.checkboxHint}>
                  Inactive users cannot sign in
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Client Assignments */}
        <div className={styles.clientSection}>
          <div className={styles.clientHeader}>
            <Icon name="users" size={16} />
            <h3 className={styles.clientTitle}>Client Access</h3>
          </div>
          <p className={styles.clientDescription}>
            {formData.isAdmin
              ? 'Admins have access to all clients automatically.'
              : 'Select which clients this user can access.'}
          </p>

          {!formData.isAdmin && (
            <div className={styles.clientList}>
              {loadingClients ? (
                <div className={styles.clientLoading}>Loading clients...</div>
              ) : availableClients.length === 0 ? (
                <div className={styles.noClients}>
                  <Icon name="info" size={16} />
                  <span>No clients available.</span>
                </div>
              ) : (
                availableClients.map((client) => {
                  const assignment = formData.clientAssignments.find(
                    (a) => a.clientId === client.id
                  );
                  const isSelected = !!assignment;

                  return (
                    <div
                      key={client.id}
                      className={`${styles.clientItem} ${isSelected ? styles.clientSelected : ''}`}
                    >
                      <label className={styles.clientCheckbox}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleClientToggle(client.id)}
                          disabled={loading}
                          aria-label={`Grant access to ${client.name}`}
                        />
                        <span className={styles.clientName}>{client.name}</span>
                      </label>
                      {isSelected && (
                        <select
                          value={assignment.role}
                          onChange={(e) => handleClientRoleChange(client.id, e.target.value)}
                          className={styles.roleSelect}
                          disabled={loading}
                          aria-label={`Role for ${client.name}`}
                        >
                          {ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

EditUserModal.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    avatarUrl: PropTypes.string,
    isAdmin: PropTypes.bool,
    isActive: PropTypes.bool,
    assignedClients: PropTypes.arrayOf(
      PropTypes.shape({
        clientId: PropTypes.string.isRequired,
        role: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
  onSuccess: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
