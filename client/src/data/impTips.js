/**
 * Context-aware tips for Imp (the Data Hub assistant)
 * Tips are matched based on: page, tab, condition
 *
 * Tip structure:
 * - id: unique identifier
 * - page: 'dashboard' | 'clientDetail' | 'newClient' | 'any'
 * - tab: optional tab ID (sources, etl, kpis, reports)
 * - condition: optional condition check
 * - priority: 1-10 (higher = more likely to show)
 * - message: the tip text
 * - animation: Clippy animation to play
 */

// Mysterious prefix phrases (30% chance to prepend)
const MYSTERIOUS_PREFIXES = [
  "A whisper from the shadows reveals...",
  "The data spirits speak...",
  "From the depths of the pipeline...",
  "An ancient insight stirs...",
  "The metrics murmur secrets...",
  "Through the fog of ETL...",
  "The warehouse echoes with wisdom...",
  "A prophecy from the void...",
];

// Probability of adding mysterious flavor (0.0 to 1.0)
const FLAVOR_PROBABILITY = 0.3;

export const impTips = [
  // ===== DASHBOARD TIPS =====
  {
    id: 'dash-welcome',
    page: 'dashboard',
    condition: 'empty_clients',
    priority: 10,
    message: "Greetings, data explorer! Your quest begins here. Click 'Add Client' to document your first data hub!",
    animation: 'Wave'
  },
  {
    id: 'dash-progress',
    page: 'dashboard',
    condition: 'has_clients',
    priority: 5,
    message: "Your data realm expands! Each client documented brings clarity to your reporting kingdom.",
    animation: 'Congratulate'
  },
  {
    id: 'dash-tip-stats',
    page: 'dashboard',
    priority: 4,
    message: "Pro tip: The stats show your total sources and ETL processes across all clients!",
    animation: 'Explain'
  },
  {
    id: 'dash-sources',
    page: 'dashboard',
    priority: 4,
    message: "Data sources are the foundation of your clients' reporting. Document them all for complete visibility!",
    animation: 'Thinking'
  },

  // ===== NEW CLIENT TIPS =====
  {
    id: 'new-client-intro',
    page: 'newClient',
    priority: 8,
    message: "Every data hub starts with a client! Enter their details to begin documenting their data ecosystem.",
    animation: 'Wave'
  },
  {
    id: 'new-client-industry',
    page: 'newClient',
    priority: 6,
    message: "The industry field helps categorize clients. E-commerce, SaaS, Healthcare - each has unique data needs!",
    animation: 'Explain'
  },

  // ===== CLIENT DETAIL - SOURCES TAB =====
  {
    id: 'client-no-sources',
    page: 'clientDetail',
    tab: 'sources',
    condition: 'empty_tab',
    priority: 10,
    message: "This client needs data sources! Add their platforms - GA4, Meta Ads, Shopify, and more await!",
    animation: 'GetAttention'
  },
  {
    id: 'client-sources-tip',
    page: 'clientDetail',
    tab: 'sources',
    priority: 6,
    message: "Document connection methods and refresh rates. Future you will thank present you when debugging!",
    animation: 'Thinking'
  },
  {
    id: 'client-sources-status',
    page: 'clientDetail',
    tab: 'sources',
    priority: 5,
    message: "Keep source statuses up to date! Connected, pending, error - each tells an important story.",
    animation: 'Explain'
  },

  // ===== CLIENT DETAIL - ETL TAB =====
  {
    id: 'client-no-etl',
    page: 'clientDetail',
    tab: 'etl',
    condition: 'empty_tab',
    priority: 10,
    message: "No data pipelines yet! Document the ETL processes that move and transform this client's data.",
    animation: 'GetAttention'
  },
  {
    id: 'client-etl-tip',
    page: 'clientDetail',
    tab: 'etl',
    priority: 6,
    message: "Good ETL documentation includes: source, destination, transformations, and schedule. Be thorough!",
    animation: 'Explain'
  },
  {
    id: 'client-etl-orchestrator',
    page: 'clientDetail',
    tab: 'etl',
    priority: 5,
    message: "Airflow, dbt, Fivetran, or custom scripts - knowing the orchestrator helps when things break!",
    animation: 'Thinking'
  },

  // ===== CLIENT DETAIL - KPIs TAB =====
  {
    id: 'client-no-kpis',
    page: 'clientDetail',
    tab: 'kpis',
    condition: 'empty_tab',
    priority: 10,
    message: "No KPIs tracked! Add the metrics that matter most to this client - ROAS, CAC, LTV, and beyond!",
    animation: 'GetAttention'
  },
  {
    id: 'client-kpi-tip',
    page: 'clientDetail',
    tab: 'kpis',
    priority: 6,
    message: "A well-defined KPI includes: calculation method, data sources, and target values. Be precise!",
    animation: 'Explain'
  },
  {
    id: 'client-kpi-categories',
    page: 'clientDetail',
    tab: 'kpis',
    priority: 5,
    message: "Organize KPIs by category: acquisition, conversion, retention, revenue. Structure brings clarity!",
    animation: 'Thinking'
  },

  // ===== CLIENT DETAIL - REPORTS TAB =====
  {
    id: 'client-no-reports',
    page: 'clientDetail',
    tab: 'reports',
    condition: 'empty_tab',
    priority: 10,
    message: "No reports documented! Add dashboards and scheduled reports to complete the picture.",
    animation: 'GetAttention'
  },
  {
    id: 'client-report-tip',
    page: 'clientDetail',
    tab: 'reports',
    priority: 6,
    message: "Include report URLs for quick access. Link to Looker, Tableau, or spreadsheet dashboards!",
    animation: 'Explain'
  },
  {
    id: 'client-report-recipients',
    page: 'clientDetail',
    tab: 'reports',
    priority: 5,
    message: "Document report recipients! Knowing who gets what report prevents confusion.",
    animation: 'Thinking'
  },

  // ===== CLIENT DETAIL - GENERAL =====
  {
    id: 'client-complete',
    page: 'clientDetail',
    condition: 'well_documented',
    priority: 8,
    message: "Impressive documentation! This client's data ecosystem is thoroughly mapped. Quest complete!",
    animation: 'Congratulate'
  },

  // ===== GENERAL TIPS (any page) =====
  {
    id: 'general-fun-mode',
    page: 'any',
    priority: 3,
    message: "Did you know? I only appear in Fun Mode. Toggle me off in settings if you need focus!",
    animation: 'Wave'
  },
  {
    id: 'general-documentation',
    page: 'any',
    priority: 4,
    message: "Good documentation is a gift to your future self. Take notes now, save hours later!",
    animation: 'Explain'
  },
  {
    id: 'general-data-lineage',
    page: 'any',
    priority: 4,
    message: "Understanding data lineage helps debug issues fast. Know where your data comes from!",
    animation: 'Thinking'
  },
  {
    id: 'general-platform-variety',
    page: 'any',
    priority: 3,
    message: "GA4, Meta Ads, Shopify, Klaviyo, Snowflake... the modern data stack is vast. Document it all!",
    animation: 'Wave'
  }
];

/**
 * Get tips filtered by context
 */
export function getTipsForContext({ page, tab, condition: _condition }) {
  return impTips.filter(tip => {
    // Page match (required unless 'any')
    if (tip.page !== 'any' && tip.page !== page) return false;

    // Tab match (optional)
    if (tip.tab && tip.tab !== tab) return false;

    // Condition match (optional - handled by caller)
    // Conditions are evaluated in the hook based on actual data

    return true;
  });
}

/**
 * Add mysterious flavor to a tip message (30% chance)
 * @param {string} message - Original tip message
 * @returns {string} - Message with optional mysterious prefix
 */
export function addMysteriousFlavor(message) {
  if (Math.random() > FLAVOR_PROBABILITY) {
    return message;
  }

  const prefix = MYSTERIOUS_PREFIXES[Math.floor(Math.random() * MYSTERIOUS_PREFIXES.length)];
  return `${prefix} ${message}`;
}

/**
 * Get a random tip from filtered list, prioritizing unseen tips
 * Applies mysterious flavor to the selected tip
 */
export function selectTip(tips, seenTipIds = []) {
  if (tips.length === 0) return null;

  // Separate unseen and seen tips
  const unseenTips = tips.filter(t => !seenTipIds.includes(t.id));
  const tipsToChooseFrom = unseenTips.length > 0 ? unseenTips : tips;

  // Sort by priority (higher first)
  tipsToChooseFrom.sort((a, b) => (b.priority || 5) - (a.priority || 5));

  // Pick randomly from top 3 (or fewer)
  const topTips = tipsToChooseFrom.slice(0, Math.min(3, tipsToChooseFrom.length));
  const selectedTip = topTips[Math.floor(Math.random() * topTips.length)];

  if (!selectedTip) return null;

  // Apply mysterious flavor to the message
  return {
    ...selectedTip,
    message: addMysteriousFlavor(selectedTip.message),
  };
}
