import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useAudio } from '../../hooks/useAudio';
import styles from './Modal.module.css';

const ANIMATION_DURATION = 150;

/**
 * Animated modal component with entrance/exit transitions.
 * Uses React Portal to render outside the DOM hierarchy.
 */
export default function Modal({
  isOpen,
  onClose,
  size = 'md',
  variant,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
  className,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const prevIsOpenRef = useRef(false);
  const closeTimeoutRef = useRef(null);
  const { playModalOpen, playModalClose } = useAudio();

  // Handle open/close state with animation
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (isOpen && !wasOpen) {
      // Opening: clear any pending close animation and show modal
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setIsVisible(true);
      setIsClosing(false);
      playModalOpen();
    } else if (!isOpen && wasOpen) {
      // External close (parent set isOpen to false)
      // Trigger close animation
      setIsClosing(true);
      playModalClose();
      closeTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, ANIMATION_DURATION);
    }
  }, [isOpen, playModalOpen, playModalClose]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Handle close with exit animation (overlay click, escape key)
  const handleClose = useCallback(() => {
    if (isClosing) return;

    setIsClosing(true);
    playModalClose();
    closeTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose();
    }, ANIMATION_DURATION);
  }, [isClosing, onClose, playModalClose]);

  // Handle escape key
  useEffect(() => {
    if (!isVisible || !closeOnEscape) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, closeOnEscape, handleClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  // Handle overlay click
  const handleOverlayClick = useCallback((e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      handleClose();
    }
  }, [closeOnOverlayClick, handleClose]);

  if (!isVisible) {
    return null;
  }

  const modalClasses = [
    styles.modal,
    styles[size],
    variant && styles[variant],
    isClosing && styles.closing,
    className,
  ].filter(Boolean).join(' ');

  const overlayClasses = [
    styles.overlay,
    isClosing && styles.closing,
  ].filter(Boolean).join(' ');

  return createPortal(
    <div
      className={overlayClasses}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className={modalClasses}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full']),
  variant: PropTypes.oneOf(['wizard']),
  closeOnOverlayClick: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
};
