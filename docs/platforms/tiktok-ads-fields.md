# TikTok Ads - Field Reference

Source: [TikTok Marketing API](https://business-api.tiktok.com/marketing_api/docs)

## Dimensions

| Canonical Name | TikTok Field | Description |
|----------------|--------------|-------------|
| date | `stat_time_day` | Reporting date |
| campaign_name | `campaign_name` | Campaign name |
| campaign_id | `campaign_id` | Campaign ID |
| ad_group_name | `adgroup_name` | Ad group name |
| ad_group_id | `adgroup_id` | Ad group ID |
| ad_name | `ad_name` | Ad name |
| ad_id | `ad_id` | Ad ID |
| age_range | `age` | Age bracket |
| gender | `gender` | Gender |
| country | `country_code` | Country code |
| placement | `placement` | TikTok, Pangle, etc. |

### Additional Dimensions

| TikTok Field | Description |
|--------------|-------------|
| `advertiser_id` | Advertiser account ID |
| `campaign_type` | Campaign objective type |
| `adgroup_status` | Ad group status |
| `ad_status` | Ad status |
| `platform` | iOS, Android |
| `ac` | Audience network |

## Metrics

| Canonical Name | TikTok Field | Description |
|----------------|--------------|-------------|
| impressions | `impressions` | Total impressions |
| clicks | `clicks` | Total clicks |
| ctr | `ctr` | Click-through rate (%) |
| spend | `spend` | Total spend |
| cpc | `cpc` | Cost per click |
| cpm | `cpm` | Cost per 1,000 impressions |
| conversions | `conversion` | Total conversions |
| conversion_rate | `conversion_rate` | Conversion rate (%) |
| video_views | `video_views` | Video views |
| video_completion_rate | `video_watched_6s_rate` | 6-second video view rate |

### Video Metrics

| TikTok Field | Description |
|--------------|-------------|
| `video_play_actions` | Video plays |
| `video_watched_2s` | 2-second views |
| `video_watched_6s` | 6-second views |
| `video_views_p25` | 25% completion views |
| `video_views_p50` | 50% completion views |
| `video_views_p75` | 75% completion views |
| `video_views_p100` | 100% completion views |
| `average_video_play` | Average play duration |
| `average_video_play_per_user` | Average play per user |

### Engagement Metrics

| TikTok Field | Description |
|--------------|-------------|
| `likes` | Total likes |
| `comments` | Total comments |
| `shares` | Total shares |
| `follows` | New followers |
| `profile_visits` | Profile visits |
| `profile_visits_rate` | Profile visit rate |
| `engaged_users` | Unique engaged users |
| `engagement_rate` | Engagement rate |

### Conversion Metrics

| TikTok Field | Description |
|--------------|-------------|
| `complete_payment` | Completed purchases |
| `complete_payment_rate` | Purchase rate |
| `total_complete_payment_rate` | Total purchase rate |
| `value_per_complete_payment` | Value per purchase |
| `add_to_cart` | Add to cart events |
| `add_to_cart_rate` | Add to cart rate |
| `checkout` | Checkout events |
| `checkout_rate` | Checkout rate |
| `registration` | Registrations |
| `app_install` | App installs |

### Cost Metrics

| TikTok Field | Description |
|--------------|-------------|
| `cost_per_conversion` | Cost per conversion |
| `cost_per_result` | Cost per result |
| `cost_per_1000_reached` | Cost per 1,000 reach |
| `real_time_cost_per_conversion` | Real-time CPA |
| `real_time_cost_per_result` | Real-time CPR |

## Data Transformations

TikTok Ads data is generally returned in display-ready format:
- Currency values are in account currency
- Percentages are already in percentage format
- No micro conversion needed

## Notes

- TikTok uses `adgroup` (no underscore) in field names
- Video metrics require video creative
- Some metrics only available for specific objectives
- Real-time metrics update more frequently than standard metrics
- Attribution window affects conversion reporting
