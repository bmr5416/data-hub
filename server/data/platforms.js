/**
 * Platform Registry - Single Source of Truth
 *
 * Defines the core supported platforms for data integration.
 * Top 5 marketing platforms + Custom option.
 */

const PLATFORM_CATEGORIES = {
  ADVERTISING: 'advertising',
  ANALYTICS: 'analytics',
  ECOMMERCE: 'ecommerce',
  CUSTOM: 'custom',
};

const platforms = [
  // Advertising Platforms
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    category: PLATFORM_CATEGORIES.ADVERTISING,
    apiDocsUrl: 'https://developers.facebook.com/docs/marketing-api/insights/parameters',
    icon: 'meta',
    description: 'Facebook and Instagram advertising platform',
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    category: PLATFORM_CATEGORIES.ADVERTISING,
    apiDocsUrl: 'https://developers.google.com/google-ads/api/fields/v17/metrics',
    icon: 'google_ads',
    description: 'Google advertising platform',
  },
  {
    id: 'tiktok_ads',
    name: 'TikTok Ads',
    category: PLATFORM_CATEGORIES.ADVERTISING,
    apiDocsUrl: 'https://business-api.tiktok.com/marketing_api/docs?id=1751443985041410',
    icon: 'tiktok',
    description: 'TikTok advertising platform',
  },

  // Analytics Platforms
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    category: PLATFORM_CATEGORIES.ANALYTICS,
    apiDocsUrl: 'https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema',
    icon: 'google_analytics',
    description: 'Google Analytics 4 web analytics',
  },

  // E-commerce Platforms
  {
    id: 'shopify',
    name: 'Shopify',
    category: PLATFORM_CATEGORIES.ECOMMERCE,
    apiDocsUrl: 'https://shopify.dev/docs/api/admin-graphql',
    icon: 'shopify',
    description: 'E-commerce platform',
  },

  // Custom Data Source
  {
    id: 'custom',
    name: 'Custom Data Source',
    category: PLATFORM_CATEGORIES.CUSTOM,
    apiDocsUrl: null,
    icon: 'custom',
    description: 'User-defined data source with flexible schema',
  },
];

/**
 * Get all platforms
 */
function getAllPlatforms() {
  return platforms;
}

/**
 * Get platform by ID
 */
function getPlatformById(platformId) {
  return platforms.find((p) => p.id === platformId);
}

/**
 * Get platforms by category
 */
function getPlatformsByCategory(category) {
  return platforms.filter((p) => p.category === category);
}

/**
 * Get all unique categories
 */
function getCategories() {
  return Object.values(PLATFORM_CATEGORIES);
}

/**
 * Get platforms grouped by category
 */
function getPlatformsGroupedByCategory() {
  return getCategories().reduce((acc, category) => {
    acc[category] = getPlatformsByCategory(category);
    return acc;
  }, {});
}

/**
 * Check if platform is custom
 */
function isCustomPlatform(platformId) {
  return platformId === 'custom';
}

/**
 * Get standard platforms (non-custom)
 */
function getStandardPlatforms() {
  return platforms.filter((p) => p.id !== 'custom');
}

export {
  platforms,
  PLATFORM_CATEGORIES,
  getAllPlatforms,
  getPlatformById,
  getPlatformsByCategory,
  getCategories,
  getPlatformsGroupedByCategory,
  isCustomPlatform,
  getStandardPlatforms,
};
