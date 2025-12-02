/**
 * useImpTip - Hook for selecting context-aware tips for Data Hub
 *
 * Determines the current context based on:
 * - Current route/page
 * - Route params (clientId)
 * - Active tab (for client detail page)
 *
 * Then selects an appropriate tip from impTips.js
 */

import { useCallback, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useImp } from '../contexts/ImpContext';
import { getTipsForContext, selectTip, impTips } from '../data/impTips';
import { ROUTES } from '../constants/routes';

/**
 * Determine the current page type from pathname
 */
function getPageType(pathname) {
  if (pathname === ROUTES.LANDING) return 'landing';
  if (pathname === ROUTES.LOGIN) return 'login';
  if (pathname === ROUTES.DASHBOARD) return 'dashboard';
  if (pathname === `${ROUTES.DASHBOARD}/clients/new`) return 'newClient';
  if (pathname.match(/^\/dashboard\/clients\/[^/]+$/)) return 'clientDetail';
  if (pathname === ROUTES.SETTINGS) return 'settings';
  return 'any';
}

export function useImpTip(contextData = {}) {
  const location = useLocation();
  const params = useParams();
  const { seenTipIds } = useImp();

  // Determine current page type
  const pageType = useMemo(() => {
    return getPageType(location.pathname);
  }, [location.pathname]);

  /**
   * Build context object for tip filtering
   */
  const context = useMemo(() => ({
    page: pageType,
    clientId: params.clientId || null,
    // Additional context from caller (e.g., active tab, condition)
    ...contextData,
  }), [pageType, params.clientId, contextData]);

  /**
   * Get the next tip based on current context
   */
  const getNextTip = useCallback(() => {
    // Get tips matching current context
    const matchingTips = getTipsForContext(context);

    // Select one tip, prioritizing unseen tips
    return selectTip(matchingTips, seenTipIds);
  }, [context, seenTipIds]);

  /**
   * Get a specific tip by ID (for testing/debugging)
   */
  const getTipById = useCallback((tipId) => {
    return impTips.find(t => t.id === tipId) || null;
  }, []);

  return {
    getNextTip,
    getTipById,
    context,
    pageType,
  };
}

export default useImpTip;
