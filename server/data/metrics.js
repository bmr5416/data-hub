/**
 * Canonical Metric Definitions
 *
 * Defines standard metrics used across all platforms.
 * These canonical names are mapped to platform-specific field names
 * in platformMappings.js.
 */

const METRIC_CATEGORIES = {
  REACH: 'reach',
  ENGAGEMENT: 'engagement',
  CONVERSION: 'conversion',
  COST: 'cost',
  REVENUE: 'revenue',
  WEB_ANALYTICS: 'web_analytics',
  PERFORMANCE: 'performance',
};

const DATA_TYPES = {
  INTEGER: 'integer',
  FLOAT: 'float',
  PERCENTAGE: 'percentage',
  CURRENCY: 'currency',
  DURATION: 'duration',
};

const AGGREGATION_TYPES = {
  SUM: 'sum',
  AVERAGE: 'average',
  MIN: 'min',
  MAX: 'max',
  COUNT: 'count',
  WEIGHTED_AVERAGE: 'weighted_average',
};

const metrics = {
  // Reach Metrics
  impressions: {
    id: 'impressions',
    name: 'Impressions',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.REACH,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of times ads were displayed',
  },
  reach: {
    id: 'reach',
    name: 'Reach',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.REACH,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of unique users who saw the ad',
  },
  frequency: {
    id: 'frequency',
    name: 'Frequency',
    dataType: DATA_TYPES.FLOAT,
    category: METRIC_CATEGORIES.REACH,
    aggregation: AGGREGATION_TYPES.AVERAGE,
    description: 'Average number of times each person saw the ad',
  },

  // Engagement Metrics
  clicks: {
    id: 'clicks',
    name: 'Clicks',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.ENGAGEMENT,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Total number of clicks',
  },
  ctr: {
    id: 'ctr',
    name: 'Click-Through Rate',
    dataType: DATA_TYPES.PERCENTAGE,
    category: METRIC_CATEGORIES.ENGAGEMENT,
    aggregation: AGGREGATION_TYPES.WEIGHTED_AVERAGE,
    description: 'Percentage of impressions that resulted in clicks',
  },
  engagements: {
    id: 'engagements',
    name: 'Engagements',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.ENGAGEMENT,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Total engagement actions (likes, shares, comments, etc.)',
  },
  engagement_rate: {
    id: 'engagement_rate',
    name: 'Engagement Rate',
    dataType: DATA_TYPES.PERCENTAGE,
    category: METRIC_CATEGORIES.ENGAGEMENT,
    aggregation: AGGREGATION_TYPES.WEIGHTED_AVERAGE,
    description: 'Percentage of impressions that resulted in engagement',
  },
  likes: {
    id: 'likes',
    name: 'Likes',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.ENGAGEMENT,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of likes or reactions',
  },
  shares: {
    id: 'shares',
    name: 'Shares',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.ENGAGEMENT,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of shares or retweets',
  },
  comments: {
    id: 'comments',
    name: 'Comments',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.ENGAGEMENT,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of comments',
  },
  video_views: {
    id: 'video_views',
    name: 'Video Views',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.ENGAGEMENT,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of video views',
  },
  video_completion_rate: {
    id: 'video_completion_rate',
    name: 'Video Completion Rate',
    dataType: DATA_TYPES.PERCENTAGE,
    category: METRIC_CATEGORIES.ENGAGEMENT,
    aggregation: AGGREGATION_TYPES.WEIGHTED_AVERAGE,
    description: 'Percentage of videos watched to completion',
  },
  average_watch_time: {
    id: 'average_watch_time',
    name: 'Average Watch Time',
    dataType: DATA_TYPES.DURATION,
    category: METRIC_CATEGORIES.ENGAGEMENT,
    aggregation: AGGREGATION_TYPES.AVERAGE,
    description: 'Average time users watched video content',
  },

  // Conversion Metrics
  conversions: {
    id: 'conversions',
    name: 'Conversions',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.CONVERSION,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Total number of conversions',
  },
  conversion_rate: {
    id: 'conversion_rate',
    name: 'Conversion Rate',
    dataType: DATA_TYPES.PERCENTAGE,
    category: METRIC_CATEGORIES.CONVERSION,
    aggregation: AGGREGATION_TYPES.WEIGHTED_AVERAGE,
    description: 'Percentage of clicks that resulted in conversions',
  },
  leads: {
    id: 'leads',
    name: 'Leads',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.CONVERSION,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of leads generated',
  },
  purchases: {
    id: 'purchases',
    name: 'Purchases',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.CONVERSION,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of completed purchases',
  },
  add_to_carts: {
    id: 'add_to_carts',
    name: 'Add to Carts',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.CONVERSION,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of add to cart events',
  },
  checkouts_initiated: {
    id: 'checkouts_initiated',
    name: 'Checkouts Initiated',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.CONVERSION,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of checkout processes started',
  },
  form_submissions: {
    id: 'form_submissions',
    name: 'Form Submissions',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.CONVERSION,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of form submissions',
  },
  signups: {
    id: 'signups',
    name: 'Sign-ups',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.CONVERSION,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of account registrations',
  },

  // Cost Metrics
  spend: {
    id: 'spend',
    name: 'Spend',
    dataType: DATA_TYPES.CURRENCY,
    category: METRIC_CATEGORIES.COST,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Total advertising spend',
  },
  cpc: {
    id: 'cpc',
    name: 'Cost Per Click',
    dataType: DATA_TYPES.CURRENCY,
    category: METRIC_CATEGORIES.COST,
    aggregation: AGGREGATION_TYPES.WEIGHTED_AVERAGE,
    description: 'Average cost per click',
  },
  cpm: {
    id: 'cpm',
    name: 'Cost Per Thousand Impressions',
    dataType: DATA_TYPES.CURRENCY,
    category: METRIC_CATEGORIES.COST,
    aggregation: AGGREGATION_TYPES.WEIGHTED_AVERAGE,
    description: 'Cost per 1,000 impressions',
  },
  cpa: {
    id: 'cpa',
    name: 'Cost Per Acquisition',
    dataType: DATA_TYPES.CURRENCY,
    category: METRIC_CATEGORIES.COST,
    aggregation: AGGREGATION_TYPES.WEIGHTED_AVERAGE,
    description: 'Average cost per conversion',
  },
  cpl: {
    id: 'cpl',
    name: 'Cost Per Lead',
    dataType: DATA_TYPES.CURRENCY,
    category: METRIC_CATEGORIES.COST,
    aggregation: AGGREGATION_TYPES.WEIGHTED_AVERAGE,
    description: 'Average cost per lead',
  },
  cpv: {
    id: 'cpv',
    name: 'Cost Per View',
    dataType: DATA_TYPES.CURRENCY,
    category: METRIC_CATEGORIES.COST,
    aggregation: AGGREGATION_TYPES.WEIGHTED_AVERAGE,
    description: 'Average cost per video view',
  },

  // Revenue Metrics
  revenue: {
    id: 'revenue',
    name: 'Revenue',
    dataType: DATA_TYPES.CURRENCY,
    category: METRIC_CATEGORIES.REVENUE,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Total revenue generated',
  },
  roas: {
    id: 'roas',
    name: 'Return on Ad Spend',
    dataType: DATA_TYPES.FLOAT,
    category: METRIC_CATEGORIES.REVENUE,
    aggregation: AGGREGATION_TYPES.WEIGHTED_AVERAGE,
    description: 'Revenue divided by ad spend',
  },
  average_order_value: {
    id: 'average_order_value',
    name: 'Average Order Value',
    dataType: DATA_TYPES.CURRENCY,
    category: METRIC_CATEGORIES.REVENUE,
    aggregation: AGGREGATION_TYPES.AVERAGE,
    description: 'Average value per order',
  },
  lifetime_value: {
    id: 'lifetime_value',
    name: 'Customer Lifetime Value',
    dataType: DATA_TYPES.CURRENCY,
    category: METRIC_CATEGORIES.REVENUE,
    aggregation: AGGREGATION_TYPES.AVERAGE,
    description: 'Predicted lifetime value of a customer',
  },
  profit: {
    id: 'profit',
    name: 'Profit',
    dataType: DATA_TYPES.CURRENCY,
    category: METRIC_CATEGORIES.REVENUE,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Revenue minus costs',
  },
  roi: {
    id: 'roi',
    name: 'Return on Investment',
    dataType: DATA_TYPES.PERCENTAGE,
    category: METRIC_CATEGORIES.REVENUE,
    aggregation: AGGREGATION_TYPES.WEIGHTED_AVERAGE,
    description: 'Profit divided by investment',
  },

  // Web Analytics Metrics
  sessions: {
    id: 'sessions',
    name: 'Sessions',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.WEB_ANALYTICS,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of user sessions',
  },
  users: {
    id: 'users',
    name: 'Users',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.WEB_ANALYTICS,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of unique users',
  },
  new_users: {
    id: 'new_users',
    name: 'New Users',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.WEB_ANALYTICS,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Number of first-time users',
  },
  pageviews: {
    id: 'pageviews',
    name: 'Pageviews',
    dataType: DATA_TYPES.INTEGER,
    category: METRIC_CATEGORIES.WEB_ANALYTICS,
    aggregation: AGGREGATION_TYPES.SUM,
    description: 'Total number of pages viewed',
  },
  pages_per_session: {
    id: 'pages_per_session',
    name: 'Pages Per Session',
    dataType: DATA_TYPES.FLOAT,
    category: METRIC_CATEGORIES.WEB_ANALYTICS,
    aggregation: AGGREGATION_TYPES.AVERAGE,
    description: 'Average pages viewed per session',
  },
  bounce_rate: {
    id: 'bounce_rate',
    name: 'Bounce Rate',
    dataType: DATA_TYPES.PERCENTAGE,
    category: METRIC_CATEGORIES.WEB_ANALYTICS,
    aggregation: AGGREGATION_TYPES.WEIGHTED_AVERAGE,
    description: 'Percentage of single-page sessions',
  },
  average_session_duration: {
    id: 'average_session_duration',
    name: 'Average Session Duration',
    dataType: DATA_TYPES.DURATION,
    category: METRIC_CATEGORIES.WEB_ANALYTICS,
    aggregation: AGGREGATION_TYPES.AVERAGE,
    description: 'Average time per session',
  },
  exit_rate: {
    id: 'exit_rate',
    name: 'Exit Rate',
    dataType: DATA_TYPES.PERCENTAGE,
    category: METRIC_CATEGORIES.WEB_ANALYTICS,
    aggregation: AGGREGATION_TYPES.WEIGHTED_AVERAGE,
    description: 'Percentage of exits from a page',
  },

  // Performance Metrics
  quality_score: {
    id: 'quality_score',
    name: 'Quality Score',
    dataType: DATA_TYPES.FLOAT,
    category: METRIC_CATEGORIES.PERFORMANCE,
    aggregation: AGGREGATION_TYPES.AVERAGE,
    description: 'Platform quality score (1-10)',
  },
  relevance_score: {
    id: 'relevance_score',
    name: 'Relevance Score',
    dataType: DATA_TYPES.FLOAT,
    category: METRIC_CATEGORIES.PERFORMANCE,
    aggregation: AGGREGATION_TYPES.AVERAGE,
    description: 'Ad relevance score',
  },
  position: {
    id: 'position',
    name: 'Average Position',
    dataType: DATA_TYPES.FLOAT,
    category: METRIC_CATEGORIES.PERFORMANCE,
    aggregation: AGGREGATION_TYPES.AVERAGE,
    description: 'Average ad position on search results',
  },
};

/**
 * Get all metrics
 */
function getAllMetrics() {
  return Object.values(metrics);
}

/**
 * Get metric by ID
 */
function getMetricById(metricId) {
  return metrics[metricId];
}

/**
 * Get metrics by category
 */
function getMetricsByCategory(category) {
  return getAllMetrics().filter((m) => m.category === category);
}

/**
 * Get all metric categories
 */
function getMetricCategories() {
  return Object.values(METRIC_CATEGORIES);
}

/**
 * Get metrics grouped by category
 */
function getMetricsGroupedByCategory() {
  return getMetricCategories().reduce((acc, category) => {
    acc[category] = getMetricsByCategory(category);
    return acc;
  }, {});
}

export {
  metrics,
  METRIC_CATEGORIES,
  DATA_TYPES,
  AGGREGATION_TYPES,
  getAllMetrics,
  getMetricById,
  getMetricsByCategory,
  getMetricCategories,
  getMetricsGroupedByCategory,
};
