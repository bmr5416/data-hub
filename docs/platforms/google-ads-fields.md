# Google Ads - Field Reference

Source: [Google Ads API Metrics (v22)](https://developers.google.com/google-ads/api/fields/v22/metrics)

## Dimensions (Segments)

| Canonical Name | Google Ads Field | Description |
|----------------|------------------|-------------|
| date | `segments.date` | Date segment |
| campaign_name | `campaign.name` | Campaign name |
| campaign_id | `campaign.id` | Campaign ID |
| campaign_type | `campaign.advertising_channel_type` | SEARCH, DISPLAY, VIDEO, etc. |
| campaign_status | `campaign.status` | ENABLED, PAUSED, REMOVED |
| ad_group_name | `ad_group.name` | Ad group name |
| ad_group_id | `ad_group.id` | Ad group ID |
| ad_name | `ad_group_ad.ad.name` | Ad name |
| ad_id | `ad_group_ad.ad.id` | Ad ID |
| device_type | `segments.device` | MOBILE, DESKTOP, TABLET |
| country | `geographic_view.country_criterion_id` | Country targeting |
| age_range | `ad_group_criterion.age_range.type` | Age range targeting |
| gender | `ad_group_criterion.gender.type` | Gender targeting |

## Metrics

| Canonical Name | Google Ads Field | Description | Transform |
|----------------|------------------|-------------|-----------|
| impressions | `metrics.impressions` | Ad impressions | None |
| clicks | `metrics.clicks` | Total clicks | None |
| ctr | `metrics.ctr` | Click-through rate | × 100 (to %) |
| spend | `metrics.cost_micros` | Cost in micros | ÷ 1,000,000 |
| cpc | `metrics.average_cpc` | Average CPC in micros | ÷ 1,000,000 |
| cpm | `metrics.average_cpm` | Average CPM in micros | ÷ 1,000,000 |
| conversions | `metrics.conversions` | Conversions | None |
| conversion_rate | `metrics.conversions_from_interactions_rate` | Conversion rate | × 100 (to %) |
| conversion_value | `metrics.conversions_value` | Conv value in micros | ÷ 1,000,000 |
| quality_score | `metrics.quality_score` | Quality score (1-10) | None |
| position | `metrics.average_position` | Average position | None |

## Data Transformations

Google Ads uses "micros" for currency values (1 USD = 1,000,000 micros):

```javascript
// Cost fields require division
const MICROS_TO_CURRENCY = 1000000;
spend: (value) => value / MICROS_TO_CURRENCY
cpc: (value) => value / MICROS_TO_CURRENCY
cpm: (value) => value / MICROS_TO_CURRENCY

// Rate fields are decimals (0.05 = 5%)
const RATIO_TO_PERCENTAGE = 100;
ctr: (value) => value * RATIO_TO_PERCENTAGE
conversion_rate: (value) => value * RATIO_TO_PERCENTAGE
```

## Additional Metrics (Reference)

| Category | Metrics |
|----------|---------|
| Video | `video_views`, `video_view_rate`, `video_quartile_p25_rate`, `video_quartile_p50_rate`, `video_quartile_p75_rate`, `video_quartile_p100_rate` |
| Search | `search_impression_share`, `search_top_impression_share`, `search_absolute_top_impression_share`, `search_click_share` |
| Display | `content_impression_share`, `gmail_forwards`, `gmail_saves` |
| Shopping | `benchmark_ctr`, `benchmark_average_max_cpc`, `orders`, `units_sold` |
| Engagement | `engagements`, `engagement_rate`, `interactions`, `interaction_rate` |
| Revenue | `revenue_micros`, `gross_profit_micros`, `average_order_value_micros` |

## Notes

- All cost metrics are in micros (divide by 1,000,000)
- CTR and conversion rates are decimals (multiply by 100 for percentage)
- Use `segments.date` for daily breakdown
- Campaign types: SEARCH, DISPLAY, SHOPPING, VIDEO, PERFORMANCE_MAX
