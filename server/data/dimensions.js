/**
 * Canonical Dimension Definitions
 *
 * Defines standard dimensions used across all platforms.
 * These canonical names are mapped to platform-specific field names
 * in platformMappings.js.
 */

const DIMENSION_CATEGORIES = {
  TIME: 'time',
  CAMPAIGN: 'campaign',
  DEVICE: 'device',
  GEOGRAPHY: 'geography',
  AUDIENCE: 'audience',
  CONTENT: 'content',
  CUSTOM: 'custom',
};

const DATA_TYPES = {
  STRING: 'string',
  DATE: 'date',
  INTEGER: 'integer',
  FLOAT: 'float',
  BOOLEAN: 'boolean',
};

const dimensions = {
  // Time Dimensions
  date: {
    id: 'date',
    name: 'Date',
    dataType: DATA_TYPES.DATE,
    category: DIMENSION_CATEGORIES.TIME,
    description: 'The calendar date (YYYY-MM-DD)',
  },
  week: {
    id: 'week',
    name: 'Week',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.TIME,
    description: 'Week of the year (ISO 8601)',
  },
  month: {
    id: 'month',
    name: 'Month',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.TIME,
    description: 'Month (YYYY-MM)',
  },
  quarter: {
    id: 'quarter',
    name: 'Quarter',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.TIME,
    description: 'Quarter (YYYY-Q#)',
  },
  year: {
    id: 'year',
    name: 'Year',
    dataType: DATA_TYPES.INTEGER,
    category: DIMENSION_CATEGORIES.TIME,
    description: 'Calendar year',
  },
  day_of_week: {
    id: 'day_of_week',
    name: 'Day of Week',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.TIME,
    description: 'Day of the week (Monday, Tuesday, etc.)',
  },
  hour: {
    id: 'hour',
    name: 'Hour',
    dataType: DATA_TYPES.INTEGER,
    category: DIMENSION_CATEGORIES.TIME,
    description: 'Hour of day (0-23)',
  },

  // Campaign Dimensions
  campaign_name: {
    id: 'campaign_name',
    name: 'Campaign Name',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CAMPAIGN,
    description: 'Name of the marketing campaign',
  },
  campaign_id: {
    id: 'campaign_id',
    name: 'Campaign ID',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CAMPAIGN,
    description: 'Unique identifier for the campaign',
  },
  campaign_type: {
    id: 'campaign_type',
    name: 'Campaign Type',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CAMPAIGN,
    description: 'Type or objective of campaign',
  },
  campaign_status: {
    id: 'campaign_status',
    name: 'Campaign Status',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CAMPAIGN,
    description: 'Status of campaign (active, paused, etc.)',
  },
  ad_group_name: {
    id: 'ad_group_name',
    name: 'Ad Group Name',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CAMPAIGN,
    description: 'Name of the ad group or ad set',
  },
  ad_group_id: {
    id: 'ad_group_id',
    name: 'Ad Group ID',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CAMPAIGN,
    description: 'Unique identifier for the ad group',
  },
  ad_name: {
    id: 'ad_name',
    name: 'Ad Name',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CAMPAIGN,
    description: 'Name of the individual ad',
  },
  ad_id: {
    id: 'ad_id',
    name: 'Ad ID',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CAMPAIGN,
    description: 'Unique identifier for the ad',
  },

  // Device Dimensions
  device_type: {
    id: 'device_type',
    name: 'Device Type',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.DEVICE,
    description: 'Type of device (desktop, mobile, tablet)',
  },
  device_platform: {
    id: 'device_platform',
    name: 'Device Platform',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.DEVICE,
    description: 'Operating system platform (iOS, Android, Windows, etc.)',
  },
  device_os: {
    id: 'device_os',
    name: 'Device OS Version',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.DEVICE,
    description: 'Operating system version',
  },
  browser: {
    id: 'browser',
    name: 'Browser',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.DEVICE,
    description: 'Web browser name',
  },
  browser_version: {
    id: 'browser_version',
    name: 'Browser Version',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.DEVICE,
    description: 'Web browser version',
  },

  // Geography Dimensions
  country: {
    id: 'country',
    name: 'Country',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.GEOGRAPHY,
    description: 'Country name or code',
  },
  country_code: {
    id: 'country_code',
    name: 'Country Code',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.GEOGRAPHY,
    description: 'ISO 3166-1 alpha-2 country code',
  },
  region: {
    id: 'region',
    name: 'Region',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.GEOGRAPHY,
    description: 'State, province, or region',
  },
  city: {
    id: 'city',
    name: 'City',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.GEOGRAPHY,
    description: 'City name',
  },
  dma: {
    id: 'dma',
    name: 'DMA',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.GEOGRAPHY,
    description: 'Designated Market Area',
  },

  // Audience Dimensions
  age_range: {
    id: 'age_range',
    name: 'Age Range',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.AUDIENCE,
    description: 'Age range bracket (18-24, 25-34, etc.)',
  },
  gender: {
    id: 'gender',
    name: 'Gender',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.AUDIENCE,
    description: 'Gender demographic',
  },
  audience_segment: {
    id: 'audience_segment',
    name: 'Audience Segment',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.AUDIENCE,
    description: 'Custom audience or segment name',
  },
  audience_type: {
    id: 'audience_type',
    name: 'Audience Type',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.AUDIENCE,
    description: 'Type of audience (remarketing, lookalike, etc.)',
  },
  new_vs_returning: {
    id: 'new_vs_returning',
    name: 'New vs Returning',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.AUDIENCE,
    description: 'New visitor or returning visitor',
  },

  // Content Dimensions
  placement: {
    id: 'placement',
    name: 'Placement',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CONTENT,
    description: 'Ad placement location (feed, stories, etc.)',
  },
  creative_type: {
    id: 'creative_type',
    name: 'Creative Type',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CONTENT,
    description: 'Type of creative (image, video, carousel, etc.)',
  },
  ad_format: {
    id: 'ad_format',
    name: 'Ad Format',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CONTENT,
    description: 'Format of the ad unit',
  },
  publisher: {
    id: 'publisher',
    name: 'Publisher',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CONTENT,
    description: 'Publisher or network name',
  },
  channel: {
    id: 'channel',
    name: 'Channel',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CONTENT,
    description: 'Marketing channel (paid search, social, display, etc.)',
  },
  source: {
    id: 'source',
    name: 'Source',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CONTENT,
    description: 'Traffic source',
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CONTENT,
    description: 'Marketing medium',
  },
  utm_source: {
    id: 'utm_source',
    name: 'UTM Source',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CONTENT,
    description: 'UTM source parameter',
  },
  utm_medium: {
    id: 'utm_medium',
    name: 'UTM Medium',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CONTENT,
    description: 'UTM medium parameter',
  },
  utm_campaign: {
    id: 'utm_campaign',
    name: 'UTM Campaign',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CONTENT,
    description: 'UTM campaign parameter',
  },
  landing_page: {
    id: 'landing_page',
    name: 'Landing Page',
    dataType: DATA_TYPES.STRING,
    category: DIMENSION_CATEGORIES.CONTENT,
    description: 'Landing page URL or path',
  },
};

/**
 * Get all dimensions
 */
function getAllDimensions() {
  return Object.values(dimensions);
}

/**
 * Get dimension by ID
 */
function getDimensionById(dimensionId) {
  return dimensions[dimensionId];
}

/**
 * Get dimensions by category
 */
function getDimensionsByCategory(category) {
  return getAllDimensions().filter((d) => d.category === category);
}

/**
 * Get all dimension categories
 */
function getDimensionCategories() {
  return Object.values(DIMENSION_CATEGORIES);
}

/**
 * Get dimensions grouped by category
 */
function getDimensionsGroupedByCategory() {
  return getDimensionCategories().reduce((acc, category) => {
    acc[category] = getDimensionsByCategory(category);
    return acc;
  }, {});
}

export {
  dimensions,
  DIMENSION_CATEGORIES,
  DATA_TYPES,
  getAllDimensions,
  getDimensionById,
  getDimensionsByCategory,
  getDimensionCategories,
  getDimensionsGroupedByCategory,
};
