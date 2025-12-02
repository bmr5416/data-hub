/**
 * ErrorMessage - User-friendly error display component
 *
 * Provides contextual error messages with retry actions
 * and styled according to Win98 dungeon theme.
 */

import PropTypes from 'prop-types';
import Button from './Button';
import Icon from './Icon';
import styles from './ErrorMessage.module.css';

// Map error types to user-friendly messages
const ERROR_MESSAGES = {
  network: {
    title: 'Connection Lost',
    message: 'Unable to connect to the server. Please check your internet connection.',
    icon: 'alert',
  },
  notFound: {
    title: 'Not Found',
    message: 'The requested resource could not be found.',
    icon: 'alert',
  },
  unauthorized: {
    title: 'Access Denied',
    message: 'You do not have permission to access this resource.',
    icon: 'lock',
  },
  serverError: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    icon: 'alert',
  },
  validation: {
    title: 'Invalid Data',
    message: 'Please check your input and try again.',
    icon: 'alert',
  },
  timeout: {
    title: 'Request Timeout',
    message: 'The request took too long. Please try again.',
    icon: 'alert',
  },
  default: {
    title: 'Error',
    message: 'An unexpected error occurred.',
    icon: 'alert',
  },
};

/**
 * Determine error type from error object or status
 */
function getErrorType(error, status) {
  if (status === 0 || error?.message?.includes('Network')) return 'network';
  if (status === 404) return 'notFound';
  if (status === 401 || status === 403) return 'unauthorized';
  if (status >= 500) return 'serverError';
  if (status === 400 || error?.message?.includes('Invalid')) return 'validation';
  if (error?.message?.includes('timeout')) return 'timeout';
  return 'default';
}

/**
 * @param {Object} props
 * @param {string|Error} props.error - Error message or Error object
 * @param {number} props.status - HTTP status code (optional)
 * @param {string} props.title - Custom title override
 * @param {string} props.message - Custom message override
 * @param {Function} props.onRetry - Retry callback (shows retry button if provided)
 * @param {string} props.variant - 'inline' | 'card' | 'full'
 * @param {string} props.className - Additional CSS class
 */
export default function ErrorMessage({
  error,
  status,
  title,
  message,
  onRetry,
  variant = 'card',
  className = '',
}) {
  const errorType = getErrorType(error, status);
  const errorConfig = ERROR_MESSAGES[errorType];

  const displayTitle = title || errorConfig.title;
  const displayMessage =
    message ||
    (typeof error === 'string' ? error : error?.message) ||
    errorConfig.message;

  const containerClass = [
    styles.container,
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass} role="alert">
      <div className={styles.iconWrapper}>
        <Icon name={errorConfig.icon} size={variant === 'full' ? 32 : 24} />
      </div>
      <div className={styles.content}>
        <h4 className={styles.title}>{displayTitle}</h4>
        <p className={styles.message}>{displayMessage}</p>
        {onRetry && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className={styles.retryButton}
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

ErrorMessage.propTypes = {
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Error)]),
  status: PropTypes.number,
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
  variant: PropTypes.oneOf(['inline', 'card', 'full']),
  className: PropTypes.string,
};
