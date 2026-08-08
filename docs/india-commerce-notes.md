# India Commerce Notes

These requirements are now assumed for Glabeekid:

- selling market: India only for the initial launch
- currency: INR
- default storefront region: India (`in`)
- shipping partner target: India Post
- returns workflow: inspect, refund, then either restock or move to Not Fit to Sale

## Implementation Direction

### Region and pricing

- active local region is India
- local store default currency is INR
- local storefront money formatting uses Indian currency conventions
- local product pricing has INR rows cloned from the demo EUR seed so the storefront can run in rupees immediately

### Shipping

- start with a placeholder shipping option for local development
- add India Post integration after confirming:
  - service type selection
  - rate calculation method
  - pickup or booking flow
  - tracking sync requirements
  - COD availability

### Checkout assumptions to validate

- prepaid only or prepaid + cash on delivery
- PAN/HSN/GST needs for invoicing
- delivery zones by pincode
- return and exchange workflow inside India

### Operations pages

- returns desk: `/in/ops/returns`
- not fit to sale list: `/in/ops/not-fit-to-sale`

## Suggested next build tasks

1. Create the India region and INR pricing model in Medusa.
2. Replace demo catalog data with Indian kids fashion collections.
3. Add pincode-aware shipping rules.
4. Build an India Post adapter or custom fulfillment module.
