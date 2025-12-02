# Meta Ads (Facebook & Instagram) - Field Reference

Source: [Meta Marketing API Insights](https://developers.facebook.com/docs/marketing-api/insights)

## Dimensions (Breakdowns)

| Canonical Name | Meta Field | Description |
|----------------|------------|-------------|
| date | `date_start` | Start date of the reporting period |
| campaign_name | `campaign_name` | Name of the campaign |
| campaign_id | `campaign_id` | Unique campaign identifier |
| ad_group_name | `adset_name` | Ad set name (Meta calls ad groups "ad sets") |
| ad_group_id | `adset_id` | Ad set identifier |
| ad_name | `ad_name` | Individual ad name |
| ad_id | `ad_id` | Individual ad identifier |
| device_type | `publisher_platform` | Platform (facebook, instagram, audience_network) |
| placement | `placement` | Where ad appeared (feed, stories, reels, etc.) |
| age_range | `age` | Age bracket (18-24, 25-34, etc.) |
| gender | `gender` | Male, female, unknown |
| country | `country` | Country code |
| region | `region` | State/region |

## Metrics

| Canonical Name | Meta Field | Description |
|----------------|------------|-------------|
| impressions | `impressions` | Number of times ads were shown |
| reach | `reach` | Unique accounts that saw the ad |
| frequency | `frequency` | Average times each account saw the ad |
| clicks | `link_clicks` | Clicks on links in the ad |
| ctr | `ctr` | Click-through rate (%) |
| engagements | `actions` | Total post engagements |
| likes | `post_reactions` | Reactions on the post |
| shares | `post_shares` | Post shares |
| comments | `post_comments` | Post comments |
| video_views | `video_view` | Video views (3+ seconds) |
| spend | `spend` | Amount spent (USD) |
| cpc | `cpc` | Cost per click |
| cpm | `cpm` | Cost per 1,000 impressions |
| cpa | `cost_per_action_type` | Cost per action |
| conversions | `actions` | Conversion actions |
| conversion_rate | `conversion_rate` | Conversion rate (%) |
| purchases | `purchase` | Purchase conversions |
| add_to_carts | `add_to_cart` | Add to cart events |
| roas | `purchase_roas` | Return on ad spend |

## Data Transformations

Meta Ads data is generally returned in display-ready format:
- Currency values are in account currency (no division needed)
- Percentages are already in percentage format
- Dates are in YYYY-MM-DD format

## Notes

- Meta uses "ad sets" instead of "ad groups"
- The `actions` field contains multiple action types - filter by `action_type`
- Video metrics require video creative
- Attribution windows affect conversion reporting
