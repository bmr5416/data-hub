import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/common/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ClientDetail from './pages/ClientDetail';
import NewClient from './pages/NewClient';
import Settings from './pages/Settings';
import { OnboardingWizard } from './components/onboarding';
import { LoginPage, AuthLoadingScreen } from './components/auth';
import { useOnboarding } from './hooks/useOnboarding';
import { ROUTES } from './constants/routes';

/**
 * AppContent - Main app content with route-based auth handling
 *
 * Route Structure:
 * - /           → LandingPage (public)
 * - /login      → LoginPage (public, redirects to /dashboard if authenticated)
 * - /dashboard  → Layout + Dashboard (protected)
 * - /dashboard/clients/:id → ClientDetail (protected)
 * - /dashboard/settings → Settings (protected)
 */
function AppContent() {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const {
    showOnboarding,
    isLoading: isOnboardingLoading,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding();

  // Auth loading state - show loading screen
  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <>
      {/* Onboarding wizard (only shows when authenticated) */}
      {isAuthenticated && !isOnboardingLoading && showOnboarding && (
        <OnboardingWizard
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}

      <Routes>
        {/* Public routes */}
        <Route path={ROUTES.LANDING} element={<LandingPage />} />
        <Route
          path={ROUTES.LOGIN}
          element={
            isAuthenticated ? (
              <Navigate to={ROUTES.DASHBOARD} replace />
            ) : (
              <LoginPage />
            )
          }
        />

        {/* Protected routes */}
        {isAuthenticated ? (
          <Route path={ROUTES.DASHBOARD} element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="clients/new" element={<NewClient />} />
            <Route path="clients/:clientId" element={<ClientDetail />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        ) : (
          <Route
            path="/dashboard/*"
            element={<Navigate to={ROUTES.LOGIN} replace />}
          />
        )}

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
