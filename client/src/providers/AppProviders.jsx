import PropTypes from 'prop-types';
import { AuthProvider } from '../contexts/AuthContext';
import { AudioProvider } from '../contexts/AudioContext';
import { ImpProvider } from '../contexts/ImpContext';

/**
 * Compound provider wrapper that combines all app-level contexts.
 * Reduces provider nesting in App.jsx for cleaner code.
 *
 * Provider order (outer to inner):
 * 1. AuthProvider - Authentication state (required for all authenticated features)
 * 2. AudioProvider - Global audio state (works in both auth states)
 * 3. ImpProvider - Imp assistant (works in both auth states, may use audio)
 *
 * Note: Theme and Fun Mode are always enabled (dark + fun mode).
 * The data attributes are set in main.jsx.
 */
export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <AudioProvider>
        <ImpProvider>
          {children}
        </ImpProvider>
      </AudioProvider>
    </AuthProvider>
  );
}

AppProviders.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProviders;
