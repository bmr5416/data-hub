# Shopify - Field Reference

Source: [Shopify Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql)

## Dimensions

| Canonical Name | Shopify Field | Description |
|----------------|---------------|-------------|
| date | `created_at` | Order creation date |
| utm_source | `source_name` | Traffic source |
| utm_medium | `landing_site` | Landing page/medium |
| country | `billing_address.country` | Billing country |
| device_type | `client_details.browser_name` | Browser/device info |

### Order Dimensions

| Shopify Field | Description |
|---------------|-------------|
| `id` | Order ID |
| `name` | Order name (#1001, etc.) |
| `email` | Customer email |
| `customer.id` | Customer ID |
| `financial_status` | paid, pending, refunded |
| `fulfillment_status` | fulfilled, partial, null |
| `cancelled_at` | Cancellation timestamp |
| `closed_at` | Order closed timestamp |
| `processed_at` | Processing timestamp |
| `gateway` | Payment gateway |
| `payment_gateway_names` | All payment methods |
| `tags` | Order tags |

### Customer Dimensions

| Shopify Field | Description |
|---------------|-------------|
| `customer.first_name` | First name |
| `customer.last_name` | Last name |
| `customer.orders_count` | Total orders |
| `customer.total_spent` | Lifetime value |
| `customer.created_at` | Customer since |
| `customer.tags` | Customer tags |

### Product Dimensions

| Shopify Field | Description |
|---------------|-------------|
| `line_items[].product_id` | Product ID |
| `line_items[].title` | Product title |
| `line_items[].variant_id` | Variant ID |
| `line_items[].variant_title` | Variant title |
| `line_items[].sku` | SKU |
| `line_items[].vendor` | Vendor |

## Metrics

| Canonical Name | Shopify Field | Description |
|----------------|---------------|-------------|
| orders | `total_orders` | Order count (aggregated) |
| revenue | `total_sales` | Total revenue |
| average_order_value | `average_order_value` | AOV (calculated) |
| customers | `customer_count` | Unique customers |

### Order Metrics

| Shopify Field | Description |
|---------------|-------------|
| `total_price` | Order total |
| `subtotal_price` | Subtotal (before tax/shipping) |
| `total_tax` | Tax amount |
| `total_shipping_price_set` | Shipping cost |
| `total_discounts` | Discount amount |
| `total_line_items_price` | Line items total |
| `current_total_price` | Current total (after refunds) |

### Line Item Metrics

| Shopify Field | Description |
|---------------|-------------|
| `line_items[].quantity` | Quantity ordered |
| `line_items[].price` | Unit price |
| `line_items[].total_discount` | Item discount |
| `line_items[].tax_lines` | Item taxes |

### Refund Metrics

| Shopify Field | Description |
|---------------|-------------|
| `refunds[].total_refund` | Total refunded |
| `refunds[].refund_line_items` | Refunded items |
| `refunds[].transactions` | Refund transactions |

## Calculated Metrics

These metrics are calculated from raw data:

```javascript
// Average Order Value
average_order_value = total_revenue / order_count

// Customer Lifetime Value
clv = customer.total_spent

// Repeat Purchase Rate
repeat_rate = returning_customers / total_customers

// Refund Rate
refund_rate = refunded_orders / total_orders
```

## Data Transformations

Shopify data is generally returned in display-ready format:
- Currency values are in shop currency
- Dates are in ISO 8601 format
- Quantities are integers

## UTM/Attribution Fields

| Shopify Field | Description |
|---------------|-------------|
| `landing_site` | First landing URL |
| `referring_site` | Referrer URL |
| `source_name` | Traffic source |
| `source_identifier` | Source ID |
| `source_url` | Source URL |

## Notes

- Use `created_at` for order date (not `processed_at`)
- `total_price` includes tax and shipping
- `subtotal_price` is before tax/shipping
- Financial status: `pending`, `authorized`, `paid`, `partially_paid`, `refunded`, `voided`, `partially_refunded`
- Fulfillment status: `fulfilled`, `partial`, `restocked`, `null` (unfulfilled)
- UTM parameters captured in `note_attributes` if using standard tracking
