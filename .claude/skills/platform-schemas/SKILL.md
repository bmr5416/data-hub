---
name: platform-schemas
description: Platform field schemas for Data Hub data sources. Use when working with platform integrations, field mappings, or data warehouse configurations. Covers Meta Ads, Google Ads, TikTok Ads, GA4, Shopify.
---

# Platform Schemas

Data Hub supports 5 core marketing platforms plus custom data sources. This skill covers field definitions and mapping conventions.

## Supported Platforms

| Platform | ID | Category | API Docs |
|----------|-----|----------|----------|
| Meta Ads | `meta_ads` | advertising | [Marketing API](https://developers.facebook.com/docs/marketing-api/insights/parameters) |
| Google Ads | `google_ads` | advertising | [Metrics API](https://developers.google.com/google-ads/api/fields/v17/metrics) |
| TikTok Ads | `tiktok_ads` | advertising | [Business API](https://business-api.tiktok.com/marketing_api/docs) |
| GA4 | `ga4` | analytics | [Data API](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema) |
| Shopify | `shopify` | ecommerce | [Admin API](https://shopify.dev/docs/api/admin-graphql) |
| Custom | `custom` | custom | N/A |

## Files in This Skill

- [MAPPINGS.md](MAPPINGS.md) - Field mapping conventions and patterns

## Field Types

### Dimensions
Attributes that describe/categorize data (text, dates, IDs).

Examples: `campaign_name`, `ad_set_name`, `date`, `platform`

### Metrics
Quantifiable measurements (numbers, currency, percentages).

Examples: `impressions`, `clicks`, `spend`, `conversions`

## Platform Reference (docs/platforms/)

Detailed field documentation exists in the codebase:

| Platform | Documentation File |
|----------|-------------------|
| Meta Ads | `docs/platforms/meta-ads-fields.md` |
| Google Ads | `docs/platforms/google-ads-fields.md` |
| GA4 | `docs/platforms/ga4-fields.md` |
| TikTok Ads | `docs/platforms/tiktok-ads-fields.md` |
| Shopify | `docs/platforms/shopify-fields.md` |

## Common Fields Across Platforms

### Advertising Platforms (Meta, Google, TikTok)

| Field | Type | Description |
|-------|------|-------------|
| `date` | dimension | Reporting date |
| `campaign_name` | dimension | Campaign identifier |
| `impressions` | metric | Number of ad views |
| `clicks` | metric | Number of clicks |
| `spend` | metric | Amount spent (currency) |
| `conversions` | metric | Conversion events |
| `ctr` | metric | Click-through rate (%) |
| `cpc` | metric | Cost per click |
| `cpm` | metric | Cost per 1000 impressions |
| `roas` | metric | Return on ad spend |

### Analytics (GA4)

| Field | Type | Description |
|-------|------|-------------|
| `date` | dimension | Session date |
| `source` | dimension | Traffic source |
| `medium` | dimension | Traffic medium |
| `campaign` | dimension | Campaign name |
| `sessions` | metric | Number of sessions |
| `users` | metric | Number of users |
| `pageviews` | metric | Page views |
| `bounce_rate` | metric | Bounce rate (%) |

### E-commerce (Shopify)

| Field | Type | Description |
|-------|------|-------------|
| `order_date` | dimension | Order date |
| `product_name` | dimension | Product name |
| `orders` | metric | Number of orders |
| `revenue` | metric | Total revenue |
| `units_sold` | metric | Units sold |
| `aov` | metric | Average order value |

## Source Files

- `server/data/platforms.js` - Platform registry
- `server/data/platformMappings.js` - Field mappings
- `server/services/platformRegistry.js` - Platform metadata service
