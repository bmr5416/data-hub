/**
 * LoginPage Component
 *
 * Win98-styled login page with email/password authentication.
 * Uses Supabase Auth via AuthContext.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PSXSprite from '../common/PSXSprite';
import Button from '../common/Button';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { signIn, error, clearError, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validation
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }
    if (!password) {
      setLocalError('Password is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
    } catch (err) {
      // Error is handled by AuthContext
      setLocalError(err.message || 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, signIn, clearError]);

  const displayError = localError || error;

  if (isLoading) {
    return null; // AuthLoadingScreen handles this case
  }

  return (
    <div className={styles.container}>
      <div className={styles.backdrop} />

      <div className={styles.loginCard}>
        {/* Header */}
        <div className={styles.header}>
          <PSXSprite sprite="lock" size="lg" className={styles.lockIcon} />
          <h1 className={styles.title}>Data Hub</h1>
          <p className={styles.subtitle}>Sign in to continue</p>
        </div>

        {/* Error Message */}
        {displayError && (
          <div className={styles.errorBanner} id="login-error" role="alert">
            <PSXSprite sprite="tubeRed" size="sm" />
            <span className={styles.errorText}>{displayError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              autoComplete="email"
              autoFocus
              disabled={isSubmitting}
              maxLength={254}
              aria-describedby={displayError ? 'login-error' : undefined}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isSubmitting}
              maxLength={128}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <PSXSprite sprite="hourglass" size="sm" animation="spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Invite-only access. Contact admin for an account.
          </p>
        </div>
      </div>
    </div>
  );
}
