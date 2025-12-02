import { useState, useCallback } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PSXSprite from './PSXSprite';
import Button from './Button';
import AudioToggle from './AudioToggle';
import ErrorBoundary from './ErrorBoundary';
import Imp from '../imp/Imp';
import { ROUTES } from '../../constants/routes';
import styles from './Layout.module.css';

// Layout has no props - provides app shell structure
Layout.propTypes = {};

export default function Layout() {
  const location = useLocation();
  const isOnDashboard = location.pathname === ROUTES.DASHBOARD;

  const { profile, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      // AuthContext handles redirect on success
    } catch {
      // signOut gracefully handles errors internally
      setIsLoggingOut(false);
    }
  }, [signOut]);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Link to={ROUTES.DASHBOARD}>
            <img src="/favicon.gif" alt="" className={styles.logoIcon} />
            <span className={styles.logoText}>Data Hub</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <span className={styles.navLabel}>Main</span>
            <NavLink
              to={ROUTES.DASHBOARD}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
              end
            >
              <PSXSprite sprite="monitor" size="sm" className={styles.navIcon} />
              Dashboard
            </NavLink>
            <Link
              to={ROUTES.DASHBOARD}
              state={{ openAddClientModal: true }}
              className={`${styles.navLink} ${isOnDashboard ? '' : ''}`}
            >
              <PSXSprite sprite="star" size="sm" className={styles.navIcon} />
              New Client
            </Link>
          </div>

          <div className={styles.navSection}>
            <span className={styles.navLabel}>System</span>
            <NavLink
              to={ROUTES.SETTINGS}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              <PSXSprite sprite="floppy" size="sm" className={styles.navIcon} />
              Settings
            </NavLink>
          </div>
        </nav>

        {/* User Section - Sidebar Footer */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar} aria-hidden="true">
              {profile?.displayName?.[0]?.toUpperCase() ||
                profile?.email?.[0]?.toUpperCase() ||
                '?'}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName} title={profile?.displayName || ''}>
                {profile?.displayName || profile?.email?.split('@')[0] || 'User'}
              </span>
              <span className={styles.userEmail} title={profile?.email || ''}>
                {profile?.email || ''}
              </span>
            </div>
          </div>
          <div className={styles.userActions}>
            <AudioToggle className={styles.audioToggle} size="sm" />
            <Button
              variant="ghost"
              size="sm"
              className={styles.logoutButton}
              onClick={handleLogout}
              disabled={isLoggingOut}
              loading={isLoggingOut}
              aria-label="Sign out of your account"
            >
              <PSXSprite sprite="lock" size="sm" className={styles.logoutIcon} />
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>

      {/* Imp assistant - wrapped in ErrorBoundary to prevent crashes */}
      <ErrorBoundary fallback={null}>
        <Imp />
      </ErrorBoundary>
    </div>
  );
}
