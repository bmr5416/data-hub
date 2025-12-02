import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * useTabNavigation - Tab state with lazy-loading support
 *
 * Handles the common pattern of tab navigation with optional
 * callbacks for lazy loading data when tabs are opened.
 *
 * @param {Object} options
 * @param {Array} options.tabs - Array of tab definitions: { id, label, icon? }
 * @param {string} [options.defaultTab] - Initial tab ID (defaults to first tab)
 * @param {Object} [options.onTabChange] - Map of tab IDs to callbacks
 *   Called when tab is first opened or when reload is triggered
 * @param {boolean} [options.reloadOnSwitch=false] - Whether to reload data each time tab is switched
 *
 * @returns {Object} Tab state and controls
 *
 * @example
 * const {
 *   activeTab,
 *   setActiveTab,
 *   tabs,
 *   isTabLoaded,
 *   reloadTab,
 * } = useTabNavigation({
 *   tabs: [
 *     { id: 'overview', label: 'Overview', icon: 'eye' },
 *     { id: 'alerts', label: 'Alerts', icon: 'bell' },
 *   ],
 *   defaultTab: 'overview',
 *   onTabChange: {
 *     alerts: fetchAlerts, // Called when alerts tab is first opened
 *   },
 * });
 *
 * @example
 * // With reload on switch
 * const { activeTab, setActiveTab, tabs } = useTabNavigation({
 *   tabs: [
 *     { id: 'live', label: 'Live Data' },
 *     { id: 'history', label: 'History' },
 *   ],
 *   onTabChange: {
 *     live: fetchLiveData,
 *     history: fetchHistory,
 *   },
 *   reloadOnSwitch: true, // Refetch data every time tab is switched
 * });
 */
export function useTabNavigation({
  tabs = [],
  defaultTab = null,
  onTabChange = {},
  reloadOnSwitch = false,
}) {
  // Use first tab as default if not specified
  const initialTab = defaultTab || tabs[0]?.id || null;
  const [activeTab, setActiveTabState] = useState(initialTab);

  // Track which tabs have been loaded (for lazy loading)
  const loadedTabsRef = useRef(new Set());

  // Track if initial tab has been processed
  const initializedRef = useRef(false);

  // Handle tab change with optional callback
  const setActiveTab = useCallback((tabId) => {
    setActiveTabState(tabId);

    // Check if we should call the tab's callback
    const shouldLoad = reloadOnSwitch || !loadedTabsRef.current.has(tabId);

    if (shouldLoad && onTabChange[tabId]) {
      onTabChange[tabId]();
      loadedTabsRef.current.add(tabId);
    }
  }, [onTabChange, reloadOnSwitch]);

  // Initialize first tab callback on mount
  useEffect(() => {
    if (!initializedRef.current && initialTab && onTabChange[initialTab]) {
      onTabChange[initialTab]();
      loadedTabsRef.current.add(initialTab);
      initializedRef.current = true;
    }
  }, [initialTab, onTabChange]);

  // Check if a tab has been loaded
  const isTabLoaded = useCallback((tabId) => {
    return loadedTabsRef.current.has(tabId);
  }, []);

  // Force reload a specific tab's data
  const reloadTab = useCallback((tabId = activeTab) => {
    if (onTabChange[tabId]) {
      onTabChange[tabId]();
      loadedTabsRef.current.add(tabId);
    }
  }, [activeTab, onTabChange]);

  // Reset loaded tabs (useful when data dependencies change)
  const resetLoadedTabs = useCallback(() => {
    loadedTabsRef.current.clear();
    // Reload current tab
    if (activeTab && onTabChange[activeTab]) {
      onTabChange[activeTab]();
      loadedTabsRef.current.add(activeTab);
    }
  }, [activeTab, onTabChange]);

  // Get tab definition by ID
  const getTab = useCallback((tabId) => {
    return tabs.find((t) => t.id === tabId);
  }, [tabs]);

  // Check if a tab is active
  const isActiveTab = useCallback((tabId) => {
    return activeTab === tabId;
  }, [activeTab]);

  return {
    // State
    activeTab,
    tabs,

    // Actions
    setActiveTab,
    isTabLoaded,
    reloadTab,
    resetLoadedTabs,

    // Helpers
    getTab,
    isActiveTab,
  };
}

export default useTabNavigation;
