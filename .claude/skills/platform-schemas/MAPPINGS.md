# Field Mapping Conventions

## Field Definition Structure

```javascript
{
  id: 'field_name',          // Unique identifier
  name: 'Field Name',        // Display name
  type: 'dimension',         // 'dimension' or 'metric'
  dataType: 'string',        // 'string', 'number', 'currency', 'percentage', 'date'
  description: 'Description',
  category: 'performance',   // Optional grouping
  formula: null,             // Optional: calculated field formula
  apiField: 'api_field_name' // Optional: source API field name
}
```

## Data Types

| Type | Examples | Formatting |
|------|----------|------------|
| `string` | Names, IDs | As-is |
| `number` | Counts, integers | Locale-formatted |
| `currency` | Spend, revenue | $ prefix, 2 decimals |
| `percentage` | CTR, rates | % suffix, 2 decimals |
| `date` | Report dates | YYYY-MM-DD |

## Dimension vs Metric

### Dimensions (Categorical)
- Used for grouping and filtering
- Text or date values
- Examples: campaign_name, date, device_type, country

```javascript
{
  id: 'campaign_name',
  name: 'Campaign Name',
  type: 'dimension',
  dataType: 'string',
  description: 'Name of the advertising campaign',
}
```

### Metrics (Quantitative)
- Aggregatable values
- Numbers, currency, percentages
- Examples: impressions, clicks, spend, conversions

```javascript
{
  id: 'spend',
  name: 'Spend',
  type: 'metric',
  dataType: 'currency',
  description: 'Total advertising spend',
}
```

## Field Categories

Group related fields for UI organization:

| Category | Description | Examples |
|----------|-------------|----------|
| `time` | Date/time fields | date, week, month |
| `campaign` | Campaign attributes | campaign_name, campaign_id |
| `creative` | Ad creative fields | ad_name, headline, image |
| `targeting` | Audience targeting | age, gender, location |
| `performance` | Core metrics | impressions, clicks, ctr |
| `conversion` | Conversion metrics | conversions, cpa, roas |
| `engagement` | Engagement metrics | likes, shares, comments |
| `revenue` | Revenue metrics | revenue, orders, aov |

## Calculated Fields

Fields derived from other fields:

```javascript
{
  id: 'ctr',
  name: 'Click-Through Rate',
  type: 'metric',
  dataType: 'percentage',
  description: 'Clicks divided by impressions',
  formula: 'clicks / impressions * 100',
  dependencies: ['clicks', 'impressions'],
}
```

Common calculated metrics:

| Metric | Formula |
|--------|---------|
| CTR | `clicks / impressions * 100` |
| CPC | `spend / clicks` |
| CPM | `spend / impressions * 1000` |
| CPA | `spend / conversions` |
| ROAS | `revenue / spend` |
| CVR | `conversions / clicks * 100` |

## Blended Data Mapping

When combining data from multiple platforms:

```javascript
// Standard field mapping for blended warehouse
const blendedFields = [
  { sourceField: 'date', blendedField: 'date', platforms: ['all'] },
  { sourceField: 'campaign_name', blendedField: 'campaign', platforms: ['all'] },
  { sourceField: 'impressions', blendedField: 'impressions', platforms: ['meta_ads', 'google_ads', 'tiktok_ads'] },
  { sourceField: 'clicks', blendedField: 'clicks', platforms: ['meta_ads', 'google_ads', 'tiktok_ads'] },
  { sourceField: 'spend', blendedField: 'spend', platforms: ['meta_ads', 'google_ads', 'tiktok_ads'] },
];
```

## Platform-Specific Mappings

### Meta Ads → Standard
```javascript
{
  'date_start': 'date',
  'campaign_name': 'campaign_name',
  'impressions': 'impressions',
  'clicks': 'clicks',
  'spend': 'spend',
  'actions.purchase': 'conversions',
}
```

### Google Ads → Standard
```javascript
{
  'segments.date': 'date',
  'campaign.name': 'campaign_name',
  'metrics.impressions': 'impressions',
  'metrics.clicks': 'clicks',
  'metrics.cost_micros': 'spend', // Divide by 1,000,000
  'metrics.conversions': 'conversions',
}
```

### TikTok Ads → Standard
```javascript
{
  'stat_datetime': 'date',
  'campaign_name': 'campaign_name',
  'impression': 'impressions',
  'click': 'clicks',
  'spend': 'spend',
  'conversion': 'conversions',
}
```

## Custom Platform Fields

For custom data sources, allow user-defined fields:

```javascript
{
  id: 'custom',
  name: 'Custom Data Source',
  category: 'custom',
  schema: {
    dimensions: [], // User defines
    metrics: [],    // User defines
  },
  allowCustomFields: true,
}
```
