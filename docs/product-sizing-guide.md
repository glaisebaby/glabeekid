# Product Sizing Guide

Use Medusa product variants for the shopper-facing size option such as `0-6M`, `1-2Y`, `3-4Y`, `5-6Y`, `S`, `M`, or `L`.

## Variant measurements in cm

For each variant, add metadata values with any of these keys:

- `chest_cm`
- `total_height_cm`
- `shoulder_to_shoulder_cm`
- `garment_length_cm`

Example variant metadata:

```json
{
  "chest_cm": "58",
  "total_height_cm": "72",
  "shoulder_to_shoulder_cm": "24",
  "garment_length_cm": "46"
}
```

These values are shown on the storefront product page under the `Size Guide` tab.

## Size chart image

You have two ways to show a size chart image on the storefront:

1. Upload the size chart as a normal product image in Medusa admin.
2. Add a product metadata field named `size_chart_image_url`.

You can also use `size_chart_image_urls` with multiple URLs as an array or as a comma-separated string.

Example product metadata:

```json
{
  "size_chart_image_url": "https://your-cdn.example.com/size-chart-girl-frock.jpg"
}
```

The storefront will append those size chart URLs to the product gallery automatically.
