import { Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

/**
 * NewClient page - redirects to Dashboard
 *
 * The "Add Client" flow now uses a modal in the Dashboard.
 * This page exists for backwards compatibility with direct URL access.
 */
export default function NewClient() {
  return <Navigate to={ROUTES.DASHBOARD} state={{ openAddClientModal: true }} replace />;
}
