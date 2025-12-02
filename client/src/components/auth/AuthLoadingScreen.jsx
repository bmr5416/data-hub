/**
 * AuthLoadingScreen Component
 *
 * Full-screen loading state during auth initialization.
 * Uses PSX hourglass animation with Win98 styling.
 */

import PSXSprite from '../common/PSXSprite';
import styles from './AuthLoadingScreen.module.css';

export default function AuthLoadingScreen() {
  return (
    <div className={styles.container}>
      <div className={styles.backdrop} />
      <div className={styles.content}>
        <PSXSprite sprite="hourglass" size="lg" animation="spin" />
        <p className={styles.text}>Loading...</p>
      </div>
    </div>
  );
}
