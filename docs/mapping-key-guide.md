# Data Mapping Key Guide

This guide explains how the Data Hub harmonizes data across different marketing platforms into a unified, blendable format.

## Overview

Each marketing platform uses different field names for similar concepts. For example:
- Meta Ads calls clicks "link_clicks"
- Google Ads calls them "metrics.clicks"
- TikTok Ads calls them "clicks"

The **Mapping Key** translates these platform-specific field names to **canonical** (standardized) names, enabling cross-platform data blending.

## How It Works

### 1. Platform Mappings

Located in `server/data/platformMappings.js`, the mapping key defines:

```javascript
platformMappings = {
  meta_ads: {
    dimensions: {
      date: 'date_start',        // Canonical → Platform field
      campaign_name: 'campaign_name',
      clicks: 'link_clicks',
    },
    metrics: {
      impressions: 'impressions',
      spend: 'spend',
    },
    transformations: {
      // Optional value transformations
    }
  },
  google_ads: {
    metrics: {
      spend: 'metrics.cost_micros',  // Different field name
    },
    transformations: {
      spend: (value) => value / 1000000,  // Convert micros to dollars
    }
  }
}
```

### 2. Canonical Fields

Canonical names are the standardized field names used in blended data:

| Category | Canonical Names |
|----------|-----------------|
| **Dates** | `date` |
| **Campaign** | `campaign_name`, `campaign_id`, `ad_group_name`, `ad_group_id`, `ad_name`, `ad_id` |
| **Targeting** | `device_type`, `country`, `region`, `age_range`, `gender`, `placement` |
| **Performance** | `impressions`, `clicks`, `ctr`, `spend`, `cpc`, `cpm` |
| **Conversions** | `conversions`, `conversion_rate`, `purchases`, `revenue`, `roas` |
| **Engagement** | `engagements`, `video_views`, `likes`, `shares`, `comments` |

### 3. Transformations

Some platforms return values in different formats:

| Transform | Platforms | Example |
|-----------|-----------|---------|
| Micros → Currency | Google Ads | `1500000` → `$1.50` |
| Ratio → Percentage | Google Ads, GA4 | `0.05` → `5%` |

## Supported Platforms

| Platform | ID | Category |
|----------|-----|----------|
| Meta Ads | `meta_ads` | Advertising |
| Google Ads | `google_ads` | Advertising |
| Google Analytics 4 | `ga4` | Analytics |
| TikTok Ads | `tiktok_ads` | Advertising |
| Shopify | `shopify` | E-commerce |
| Custom | `custom` | User-defined |

## Blended Data Structure

When data from multiple sources is blended, the output uses canonical field names:

```
| date       | source_platform | campaign_name | impressions | clicks | spend  |
|------------|-----------------|---------------|-------------|--------|--------|
| 2024-01-15 | meta_ads        | Winter Sale   | 50,000      | 1,200  | 450.00 |
| 2024-01-15 | google_ads      | Winter Sale   | 35,000      | 890    | 320.00 |
| 2024-01-15 | tiktok_ads      | Winter Sale   | 75,000      | 2,100  | 380.00 |
```

## Using Custom Data Sources

For custom data sources, users define their own field mappings during the Source Wizard:

1. Name your data source
2. Define dimensions (date, campaign, etc.)
3. Define metrics (impressions, clicks, etc.)
4. Map your column names to canonical names
5. Specify any transformations needed

## API Functions

The mapping service provides these functions:

```javascript
// Get mapping for a platform
getPlatformMapping('meta_ads')

// Get specific field mapping
getDimensionMapping('google_ads', 'campaign_name')  // → 'campaign.name'
getMetricMapping('google_ads', 'spend')             // → 'metrics.cost_micros'

// Apply transformations
applyTransformation('google_ads', 'spend', 1500000) // → 1.5

// Find platforms supporting a field
getPlatformsSupportingMetric('clicks')  // → ['meta_ads', 'google_ads', 'tiktok_ads']
```

## Adding New Platforms

To add a new platform mapping:

1. Add platform definition to `server/data/platforms.js`
2. Add mappings to `server/data/platformMappings.js`
3. Create documentation in `docs/platforms/[platform]-fields.md`

```javascript
// Example: Adding LinkedIn Ads
linkedin_ads: {
  dimensions: {
    date: 'dateRange.start.day',
    campaign_name: 'campaign',
  },
  metrics: {
    impressions: 'impressions',
    clicks: 'clicks',
    spend: 'costInLocalCurrency',
  },
  transformations: {}
}
```

## Best Practices

1. **Always use canonical names** in blended data for consistency
2. **Apply transformations** before blending to normalize values
3. **Include source_platform** column to track data origin
4. **Validate data types** match expected canonical types
5. **Document custom mappings** for future reference
