import { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAudio } from '../../hooks/useAudio';
import styles from './Button.module.css';

function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  href,
  to,
  className = '',
  onClick,
  ...props
}) {
  const { playClick } = useAudio();
  const classNames = `${styles.button} ${styles[variant]} ${styles[size]} ${loading ? styles.loading : ''} ${className}`;

  const handleClick = useCallback((e) => {
    playClick();
    onClick?.(e);
  }, [playClick, onClick]);

  if (to) {
    return (
      <Link to={to} className={classNames} onClick={handleClick} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classNames} onClick={handleClick} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && <span className={styles.spinner} />}
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  href: PropTypes.string,
  to: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default memo(Button);
