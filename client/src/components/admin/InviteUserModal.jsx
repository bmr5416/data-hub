/**
 * InviteUserModal Component
 *
 * Modal for inviting new users to Data Hub.
 * Allows setting email, display name, admin status, and client assignments.
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { adminApi, clientsApi } from '../../services/api';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Icon from '../common/Icon';
import PSXSprite from '../common/PSXSprite';
import styles from './InviteUserModal.module.css';

const ROLES = [
  { value: 'viewer', label: 'Viewer', description: 'Can view data' },
  { value: 'editor', label: 'Editor', description: 'Can edit data' },
  { value: 'admin', label: 'Admin', description: 'Full client access' },
];

export default function InviteUserModal({ onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    isAdmin: false,
    clientAssignments: [],
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
        // Non-critical - user can still be invited without client assignments
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
    // Clear field error when user types
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

    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

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
      const result = await adminApi.inviteUser({
        email: formData.email.trim().toLowerCase(),
        displayName: formData.displayName.trim() || null,
        isAdmin: formData.isAdmin,
        assignedClients: formData.clientAssignments,
      });

      onSuccess(result.user);
    } catch (err) {
      setError(err.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  }, [formData, validate, onSuccess]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Invite User"
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.errorBanner}>
            <PSXSprite sprite="tubeRed" size="sm" />
            <span>{error}</span>
          </div>
        )}

        {/* Email Field */}
        <div className={`${styles.field} ${fieldErrors.email ? styles.fieldError : ''}`}>
          <label htmlFor="invite-email" className={styles.label}>
            Email Address *
          </label>
          <input
            type="email"
            id="invite-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="user@example.com"
            className={styles.input}
            maxLength={254}
            autoFocus
            disabled={loading}
          />
          {fieldErrors.email && (
            <span className={styles.errorText}>{fieldErrors.email}</span>
          )}
        </div>

        {/* Display Name Field */}
        <div className={`${styles.field} ${fieldErrors.displayName ? styles.fieldError : ''}`}>
          <label htmlFor="invite-displayName" className={styles.label}>
            Display Name
          </label>
          <input
            type="text"
            id="invite-displayName"
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

        {/* Admin Checkbox */}
        <div className={styles.checkboxField}>
          <label htmlFor="invite-isAdmin" className={styles.checkboxLabel}>
            <input
              type="checkbox"
              id="invite-isAdmin"
              name="isAdmin"
              checked={formData.isAdmin}
              onChange={handleChange}
              disabled={loading}
            />
            <span className={styles.checkboxText}>
              <strong>Admin privileges</strong>
              <span className={styles.checkboxHint}>
                Can manage users and access all clients
              </span>
            </span>
          </label>
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
                  <span>No clients available. Create a client first.</span>
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
            {loading ? 'Sending Invite...' : 'Send Invite'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

InviteUserModal.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
