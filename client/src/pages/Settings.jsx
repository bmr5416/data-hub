/**
 * Settings Page
 *
 * Application settings including SMTP configuration for email delivery.
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { smtpApi } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Icon from '../components/common/Icon';
import PSXSprite from '../components/common/PSXSprite';
import LoadingAnimation from '../components/common/LoadingAnimation';
import ErrorMessage from '../components/common/ErrorMessage';
import { UserManagementSection } from '../components/admin';
import { useModalForm } from '../hooks/useModalForm';
import { useMinLoadingTime } from '../hooks/useMinLoadingTime';
import styles from './Settings.module.css';
import anim from '../styles/animations.module.css';

export default function Settings() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingConfig, setEditingConfig] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const showLoading = useMinLoadingTime(loading);

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await smtpApi.list();
      setConfigs(result.configs || []);
    } catch (err) {
      setError(err.message || 'Failed to load SMTP configurations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleConfigCreated = useCallback((config) => {
    setConfigs((prev) => [...prev, config]);
    setShowAddForm(false);
  }, []);

  const handleConfigUpdated = useCallback((updatedConfig) => {
    setConfigs((prev) =>
      prev.map((c) => (c.id === updatedConfig.id ? updatedConfig : c))
    );
    setEditingConfig(null);
  }, []);

  const handleConfigDeleted = useCallback((configId) => {
    setConfigs((prev) => prev.filter((c) => c.id !== configId));
  }, []);

  if (showLoading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <ErrorMessage
          error={error}
          variant="full"
          title="Failed to Load Settings"
          onRetry={fetchConfigs}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={`${styles.header} ${anim.slideUp}`}>
        <div>
          <h1>Settings</h1>
          <p className={styles.subtitle}>Configure application settings</p>
        </div>
      </header>

      <section className={`${styles.section} ${anim.slideUpDelay1}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <PSXSprite sprite="floppy" size="md" />
            <h2>Email Configuration</h2>
          </div>
          {!showAddForm && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddForm(true)}
            >
              + Add SMTP Server
            </Button>
          )}
        </div>

        <p className={styles.sectionDescription}>
          Configure SMTP servers for sending report emails. You can have multiple
          configurations and set one as default.
        </p>

        {showAddForm && (
          <SMTPConfigForm
            onSuccess={handleConfigCreated}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {configs.length === 0 && !showAddForm ? (
          <Card>
            <div className={styles.empty}>
              <Icon name="mail" size={48} />
              <p>No SMTP servers configured</p>
              <p className={styles.emptyHint}>
                Add an SMTP server to enable email report delivery
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                Add SMTP Server
              </Button>
            </div>
          </Card>
        ) : (
          <div className={styles.configList}>
            {configs.map((config) =>
              editingConfig?.id === config.id ? (
                <SMTPConfigForm
                  key={config.id}
                  config={config}
                  onSuccess={handleConfigUpdated}
                  onCancel={() => setEditingConfig(null)}
                />
              ) : (
                <SMTPConfigCard
                  key={config.id}
                  config={config}
                  onEdit={() => setEditingConfig(config)}
                  onDelete={handleConfigDeleted}
                  onRefresh={fetchConfigs}
                />
              )
            )}
          </div>
        )}
      </section>

      {/* User Management Section (Admin Only) */}
      <div className={anim.slideUpDelay2}>
        <UserManagementSection />
      </div>
    </div>
  );
}

// SMTP Config Card Component
function SMTPConfigCard({ config, onEdit, onDelete, onRefresh }) {
  const [verifying, setVerifying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showTestInput, setShowTestInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleVerify = async () => {
    setVerifying(true);
    setStatusMessage(null);
    try {
      const result = await smtpApi.verify(config.id);
      setStatusMessage({
        type: result.success ? 'success' : 'error',
        text: result.success ? 'Connection verified!' : result.error,
      });
      if (result.success) {
        onRefresh();
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) return;
    setTesting(true);
    setStatusMessage(null);
    try {
      const result = await smtpApi.test(config.id, testEmail);
      setStatusMessage({
        type: result.success ? 'success' : 'error',
        text: result.success ? 'Test email sent!' : result.error,
      });
      if (result.success) {
        setShowTestInput(false);
        setTestEmail('');
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this SMTP configuration?')) return;
    try {
      await smtpApi.delete(config.id);
      onDelete(config.id);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <Card className={styles.configCard}>
      <div className={styles.configHeader}>
        <div className={styles.configInfo}>
          <h3 className={styles.configName}>
            {config.name}
            {config.isDefault && (
              <span className={styles.defaultBadge}>Default</span>
            )}
          </h3>
          <span className={styles.configHost}>
            {config.host}:{config.port}
          </span>
        </div>
        <div className={styles.configStatus}>
          {config.isVerified ? (
            <span className={styles.verified}>
              <Icon name="check" size={16} />
              Verified
            </span>
          ) : (
            <span className={styles.unverified}>
              <Icon name="alert" size={16} />
              Not Verified
            </span>
          )}
        </div>
      </div>

      <div className={styles.configDetails}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>From:</span>
          <span className={styles.detailValue}>
            {config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Auth:</span>
          <span className={styles.detailValue}>
            {config.authUser || 'None'}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Secure:</span>
          <span className={styles.detailValue}>
            {config.secure ? 'TLS' : 'No'}
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className={`${styles.statusMessage} ${styles[statusMessage.type]}`}>
          <Icon name={statusMessage.type === 'success' ? 'check' : 'alert'} size={16} />
          {statusMessage.text}
        </div>
      )}

      {showTestInput && (
        <div className={styles.testInput}>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter test email address"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTest}
            loading={testing}
            disabled={!testEmail}
          >
            Send
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTestInput(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      <div className={styles.configActions}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleVerify}
          loading={verifying}
        >
          Verify
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTestInput(true)}
          disabled={showTestInput}
        >
          Test
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </Card>
  );
}

SMTPConfigCard.propTypes = {
  config: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    host: PropTypes.string.isRequired,
    port: PropTypes.number,
    secure: PropTypes.bool,
    authUser: PropTypes.string,
    fromEmail: PropTypes.string.isRequired,
    fromName: PropTypes.string,
    isDefault: PropTypes.bool,
    isVerified: PropTypes.bool,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

// SMTP Config Form Component
function SMTPConfigForm({ config, onSuccess, onCancel }) {
  const isEditing = !!config;

  const {
    formData,
    loading,
    error,
    fieldErrors,
    handleChange,
    handleSubmit,
  } = useModalForm({
    initialData: {
      name: config?.name || '',
      host: config?.host || '',
      port: config?.port?.toString() || '587',
      secure: config?.secure || false,
      authUser: config?.authUser || '',
      authPass: '',
      fromEmail: config?.fromEmail || '',
      fromName: config?.fromName || '',
      isDefault: config?.isDefault || false,
    },
    validate: (data) => {
      const errors = {};
      if (!data.host?.trim()) errors.host = 'SMTP host is required';
      if (!data.fromEmail?.trim()) errors.fromEmail = 'From email is required';
      const port = parseInt(data.port, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        errors.port = 'Invalid port number';
      }
      return errors;
    },
    onSubmit: async (data) => {
      const payload = {
        name: data.name.trim() || 'SMTP Server',
        host: data.host.trim(),
        port: parseInt(data.port, 10),
        secure: data.secure,
        authUser: data.authUser.trim() || null,
        authPass: data.authPass || null,
        fromEmail: data.fromEmail.trim(),
        fromName: data.fromName.trim() || null,
        isDefault: data.isDefault,
      };

      if (isEditing) {
        const result = await smtpApi.update(config.id, payload);
        return result.config;
      } else {
        const result = await smtpApi.create(payload);
        return result.config;
      }
    },
    onSuccess,
  });

  return (
    <Card className={styles.formCard}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h3 className={styles.formTitle}>
          {isEditing ? 'Edit SMTP Configuration' : 'Add SMTP Configuration'}
        </h3>

        {error && (
          <div className={styles.formError}>
            <Icon name="alert" size={16} />
            {error}
          </div>
        )}

        <div className={styles.formGrid}>
          <div className={`${styles.field} ${fieldErrors.name ? styles.fieldError : ''}`}>
            <label htmlFor="smtp-name">Configuration Name</label>
            <input
              type="text"
              id="smtp-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Primary SMTP"
            />
          </div>

          <div className={`${styles.field} ${fieldErrors.host ? styles.fieldError : ''}`}>
            <label htmlFor="smtp-host">SMTP Host *</label>
            <input
              type="text"
              id="smtp-host"
              name="host"
              value={formData.host}
              onChange={handleChange}
              placeholder="e.g., smtp.gmail.com"
            />
            {fieldErrors.host && (
              <span className={styles.fieldErrorText}>{fieldErrors.host}</span>
            )}
          </div>

          <div className={`${styles.field} ${fieldErrors.port ? styles.fieldError : ''}`}>
            <label htmlFor="smtp-port">Port *</label>
            <input
              type="number"
              id="smtp-port"
              name="port"
              value={formData.port}
              onChange={handleChange}
              min="1"
              max="65535"
            />
            {fieldErrors.port && (
              <span className={styles.fieldErrorText}>{fieldErrors.port}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="smtp-secure">
              <input
                type="checkbox"
                id="smtp-secure"
                name="secure"
                checked={formData.secure}
                onChange={handleChange}
              />
              Use TLS/SSL
            </label>
          </div>

          <div className={styles.field}>
            <label htmlFor="smtp-authUser">Username</label>
            <input
              type="text"
              id="smtp-authUser"
              name="authUser"
              value={formData.authUser}
              onChange={handleChange}
              placeholder="SMTP username (if required)"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="smtp-authPass">Password</label>
            <input
              type="password"
              id="smtp-authPass"
              name="authPass"
              value={formData.authPass}
              onChange={handleChange}
              placeholder={isEditing ? '••••••• (unchanged)' : 'SMTP password'}
            />
          </div>

          <div className={`${styles.field} ${fieldErrors.fromEmail ? styles.fieldError : ''}`}>
            <label htmlFor="smtp-fromEmail">From Email *</label>
            <input
              type="email"
              id="smtp-fromEmail"
              name="fromEmail"
              value={formData.fromEmail}
              onChange={handleChange}
              placeholder="e.g., reports@example.com"
            />
            {fieldErrors.fromEmail && (
              <span className={styles.fieldErrorText}>{fieldErrors.fromEmail}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="smtp-fromName">From Name</label>
            <input
              type="text"
              id="smtp-fromName"
              name="fromName"
              value={formData.fromName}
              onChange={handleChange}
              placeholder="e.g., Data Hub Reports"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="smtp-isDefault">
              <input
                type="checkbox"
                id="smtp-isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
              />
              Set as default configuration
            </label>
          </div>
        </div>

        <div className={styles.formActions}>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Configuration'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

SMTPConfigForm.propTypes = {
  config: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
