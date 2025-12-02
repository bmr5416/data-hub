# Google Analytics 4 - Field Reference

Source: [GA4 Data API Schema](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)

## Dimensions

| Canonical Name | GA4 Field | Description |
|----------------|-----------|-------------|
| date | `date` | Date in YYYYMMDD format |
| campaign_name | `sessionCampaignName` | Campaign name from UTM |
| source | `sessionSource` | Traffic source |
| medium | `sessionMedium` | Traffic medium |
| device_type | `deviceCategory` | desktop, mobile, tablet |
| device_platform | `platform` | web, iOS, Android |
| browser | `browser` | Browser name |
| country | `country` | Country name |
| city | `city` | City name |
| age_range | `userAgeBracket` | Age bracket |
| gender | `userGender` | male, female |
| new_vs_returning | `newVsReturning` | new, returning |
| landing_page | `landingPage` | First page viewed |

### Additional Dimensions

| GA4 Field | Description |
|-----------|-------------|
| `sessionDefaultChannelGroup` | Channel grouping (Organic, Paid, Direct, etc.) |
| `sessionSourceMedium` | Combined source/medium |
| `pageTitle` | Page title |
| `pagePath` | Page path |
| `eventName` | Event name |
| `hostName` | Website hostname |

## Metrics

| Canonical Name | GA4 Field | Description | Transform |
|----------------|-----------|-------------|-----------|
| sessions | `sessions` | Total sessions | None |
| users | `activeUsers` | Active users | None |
| new_users | `newUsers` | New users | None |
| pageviews | `screenPageViews` | Page/screen views | None |
| pages_per_session | `screenPageViewsPerSession` | Pages per session | None |
| bounce_rate | `bounceRate` | Bounce rate | × 100 (to %) |
| average_session_duration | `averageSessionDuration` | Avg session length (sec) | None |
| conversions | `conversions` | Total conversions | None |
| revenue | `totalRevenue` | Total revenue | None |
| engagements | `engagements` | Engaged sessions | None |
| engagement_rate | `engagementRate` | Engagement rate | × 100 (to %) |
| purchases | `ecommercePurchases` | E-commerce purchases | None |

### Additional Metrics

| GA4 Field | Description |
|-----------|-------------|
| `engagedSessions` | Sessions with engagement |
| `userEngagementDuration` | Total engagement time |
| `eventCount` | Total events |
| `eventsPerSession` | Average events per session |
| `itemRevenue` | Revenue from items |
| `addToCarts` | Add to cart events |
| `checkouts` | Checkout events |
| `transactions` | Completed transactions |
| `totalUsers` | Distinct users with events |
| `sessionsPerUser` | Average sessions per user |
| `keyEvents` | Count of key events |
| `cartToViewRate` | Cart additions / product views |
| `purchaseToViewRate` | Purchases / product views |

## Data Transformations

```javascript
// Rate fields are decimals (0.65 = 65%)
const RATIO_TO_PERCENTAGE = 100;
bounce_rate: (value) => value * RATIO_TO_PERCENTAGE
engagement_rate: (value) => value * RATIO_TO_PERCENTAGE
```

## E-commerce Dimensions & Metrics

| Field | Type | Description |
|-------|------|-------------|
| `itemName` | dimension | Product name |
| `itemId` | dimension | Product ID |
| `itemCategory` | dimension | Product category |
| `itemBrand` | dimension | Product brand |
| `itemListName` | dimension | Product list name |
| `itemsViewed` | metric | Items viewed |
| `itemsAddedToCart` | metric | Items added to cart |
| `itemsPurchased` | metric | Items purchased |

## Notes

- GA4 uses event-based model (not session-based like UA)
- `date` dimension returns YYYYMMDD format - convert to YYYY-MM-DD
- Bounce rate is inverse of engagement rate
- Revenue requires e-commerce tracking setup
- Session-scoped dimensions prefixed with `session`
- User-scoped dimensions prefixed with `user`
