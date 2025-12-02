/**
 * Platform Mappings - THE CORE MAPPING KEY
 *
 * Maps canonical dimension/metric names to platform-specific field names.
 * This is the single source of truth for cross-platform field harmonization.
 *
 * Supports Top 5 platforms + Custom data sources.
 *
 * Structure:
 * {
 *   platform_id: {
 *     dimensions: { canonical_id: 'platform_field_name' },
 *     metrics: { canonical_id: 'platform_field_name' },
 *     transformations: { canonical_id: (value) => transformed_value }
 *   }
 * }
 */

// Constants for transformations
const MICROS_TO_CURRENCY = 1000000;
const RATIO_TO_PERCENTAGE = 100;

const platformMappings = {
  // Meta Ads (Facebook & Instagram)
  meta_ads: {
    dimensions: {
      date: 'date_start',
      campaign_name: 'campaign_name',
      campaign_id: 'campaign_id',
      ad_group_name: 'adset_name',
      ad_group_id: 'adset_id',
      ad_name: 'ad_name',
      ad_id: 'ad_id',
      device_type: 'publisher_platform',
      placement: 'placement',
      age_range: 'age',
      gender: 'gender',
      country: 'country',
      region: 'region',
    },
    metrics: {
      impressions: 'impressions',
      reach: 'reach',
      frequency: 'frequency',
      clicks: 'link_clicks',
      ctr: 'ctr',
      engagements: 'actions',
      likes: 'post_reactions',
      shares: 'post_shares',
      comments: 'post_comments',
      video_views: 'video_view',
      spend: 'spend',
      cpc: 'cpc',
      cpm: 'cpm',
      cpa: 'cost_per_action_type',
      conversions: 'actions',
      conversion_rate: 'conversion_rate',
      purchases: 'purchase',
      add_to_carts: 'add_to_cart',
      roas: 'purchase_roas',
    },
    transformations: {
      // Meta Ads doesn't require transformations for most fields
    },
  },

  // Google Ads
  google_ads: {
    dimensions: {
      date: 'segments.date',
      campaign_name: 'campaign.name',
      campaign_id: 'campaign.id',
      campaign_type: 'campaign.advertising_channel_type',
      campaign_status: 'campaign.status',
      ad_group_name: 'ad_group.name',
      ad_group_id: 'ad_group.id',
      ad_name: 'ad_group_ad.ad.name',
      ad_id: 'ad_group_ad.ad.id',
      device_type: 'segments.device',
      country: 'geographic_view.country_criterion_id',
      age_range: 'ad_group_criterion.age_range.type',
      gender: 'ad_group_criterion.gender.type',
    },
    metrics: {
      impressions: 'metrics.impressions',
      clicks: 'metrics.clicks',
      ctr: 'metrics.ctr',
      spend: 'metrics.cost_micros',
      cpc: 'metrics.average_cpc',
      cpm: 'metrics.average_cpm',
      conversions: 'metrics.conversions',
      conversion_rate: 'metrics.conversions_from_interactions_rate',
      conversion_value: 'metrics.conversions_value',
      quality_score: 'metrics.quality_score',
      position: 'metrics.average_position',
    },
    transformations: {
      // Google Ads costs are in micros (divide by 1,000,000)
      spend: (value) => value / MICROS_TO_CURRENCY,
      cpc: (value) => value / MICROS_TO_CURRENCY,
      cpm: (value) => value / MICROS_TO_CURRENCY,
      conversion_value: (value) => value / MICROS_TO_CURRENCY,
      // CTR and conversion rate are already percentages (multiply by 100 for display)
      ctr: (value) => value * RATIO_TO_PERCENTAGE,
      conversion_rate: (value) => value * RATIO_TO_PERCENTAGE,
    },
  },

  // Google Analytics 4
  ga4: {
    dimensions: {
      date: 'date',
      campaign_name: 'sessionCampaignName',
      source: 'sessionSource',
      medium: 'sessionMedium',
      device_type: 'deviceCategory',
      device_platform: 'platform',
      browser: 'browser',
      country: 'country',
      city: 'city',
      age_range: 'userAgeBracket',
      gender: 'userGender',
      new_vs_returning: 'newVsReturning',
      landing_page: 'landingPage',
    },
    metrics: {
      sessions: 'sessions',
      users: 'activeUsers',
      new_users: 'newUsers',
      pageviews: 'screenPageViews',
      pages_per_session: 'screenPageViewsPerSession',
      bounce_rate: 'bounceRate',
      average_session_duration: 'averageSessionDuration',
      conversions: 'conversions',
      revenue: 'totalRevenue',
      engagements: 'engagements',
      engagement_rate: 'engagementRate',
      purchases: 'ecommercePurchases',
    },
    transformations: {
      // GA4 bounce rate is a ratio (multiply by 100 for percentage)
      bounce_rate: (value) => value * RATIO_TO_PERCENTAGE,
      engagement_rate: (value) => value * RATIO_TO_PERCENTAGE,
    },
  },

  // TikTok Ads
  tiktok_ads: {
    dimensions: {
      date: 'stat_time_day',
      campaign_name: 'campaign_name',
      campaign_id: 'campaign_id',
      ad_group_name: 'adgroup_name',
      ad_group_id: 'adgroup_id',
      ad_name: 'ad_name',
      ad_id: 'ad_id',
      age_range: 'age',
      gender: 'gender',
      country: 'country_code',
      placement: 'placement',
    },
    metrics: {
      impressions: 'impressions',
      clicks: 'clicks',
      ctr: 'ctr',
      spend: 'spend',
      cpc: 'cpc',
      cpm: 'cpm',
      conversions: 'conversion',
      conversion_rate: 'conversion_rate',
      video_views: 'video_views',
      video_completion_rate: 'video_watched_6s_rate',
    },
    transformations: {},
  },

  // Shopify
  shopify: {
    dimensions: {
      date: 'created_at',
      utm_source: 'source_name',
      utm_medium: 'landing_site',
      country: 'billing_address.country',
      device_type: 'client_details.browser_name',
    },
    metrics: {
      orders: 'total_orders',
      revenue: 'total_sales',
      average_order_value: 'average_order_value',
      customers: 'customer_count',
    },
    transformations: {},
  },
};

/**
 * Get mapping for a specific platform
 */
function getPlatformMapping(platformId) {
  return platformMappings[platformId];
}

/**
 * Get dimension mapping for a platform
 */
function getDimensionMapping(platformId, canonicalDimensionId) {
  const mapping = platformMappings[platformId];
  return mapping?.dimensions?.[canonicalDimensionId];
}

/**
 * Get metric mapping for a platform
 */
function getMetricMapping(platformId, canonicalMetricId) {
  const mapping = platformMappings[platformId];
  return mapping?.metrics?.[canonicalMetricId];
}

/**
 * Get transformation function for a metric
 */
function getTransformation(platformId, canonicalMetricId) {
  const mapping = platformMappings[platformId];
  return mapping?.transformations?.[canonicalMetricId];
}

/**
 * Apply transformation to a value if transformation exists
 */
function applyTransformation(platformId, canonicalMetricId, value) {
  const transformation = getTransformation(platformId, canonicalMetricId);
  if (transformation && value !== null && value !== undefined) {
    return transformation(value);
  }
  return value;
}

/**
 * Get all platforms that support a canonical dimension
 */
function getPlatformsSupportingDimension(canonicalDimensionId) {
  return Object.keys(platformMappings).filter((platformId) => {
    return platformMappings[platformId].dimensions?.[canonicalDimensionId];
  });
}

/**
 * Get all platforms that support a canonical metric
 */
function getPlatformsSupportingMetric(canonicalMetricId) {
  return Object.keys(platformMappings).filter((platformId) => {
    return platformMappings[platformId].metrics?.[canonicalMetricId];
  });
}

/**
 * Reverse mapping: platform field name -> canonical ID
 */
function getCanonicalDimensionId(platformId, platformFieldName) {
  const mapping = platformMappings[platformId]?.dimensions;
  if (!mapping) return null;

  return Object.keys(mapping).find((canonicalId) => mapping[canonicalId] === platformFieldName);
}

/**
 * Reverse mapping: platform field name -> canonical ID
 */
function getCanonicalMetricId(platformId, platformFieldName) {
  const mapping = platformMappings[platformId]?.metrics;
  if (!mapping) return null;

  return Object.keys(mapping).find((canonicalId) => mapping[canonicalId] === platformFieldName);
}

/**
 * Get all available platforms with mappings
 */
function getAvailablePlatforms() {
  return Object.keys(platformMappings);
}

/**
 * Check if a platform has mappings defined
 */
function hasPlatformMapping(platformId) {
  return platformId in platformMappings;
}

export {
  platformMappings,
  getPlatformMapping,
  getDimensionMapping,
  getMetricMapping,
  getTransformation,
  applyTransformation,
  getPlatformsSupportingDimension,
  getPlatformsSupportingMetric,
  getCanonicalDimensionId,
  getCanonicalMetricId,
  getAvailablePlatforms,
  hasPlatformMapping,
  MICROS_TO_CURRENCY,
  RATIO_TO_PERCENTAGE,
};
