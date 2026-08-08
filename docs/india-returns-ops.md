# India Returns Operations

Glabeekid now has a lightweight local operations workflow for returns and damaged items.

## Internal pages

- Returns desk: `/in/ops/returns`
- Not Fit to Sale: `/in/ops/not-fit-to-sale`

## Launch workflow

1. Customer requests a return.
2. Open the returns desk and create a return case from the sold item.
3. When the parcel arrives, click `Mark received`.
4. If the refund is approved, click `Mark refunded`.
5. Inspect the garment:
   - If the garment is clean and resellable, click `Restock inventory`.
   - If the garment is damaged or unsuitable, click `Move to Not Fit to Sale`.

## Notes

- This workflow is local to the project and intended for launch operations.
- Refund status is tracked operationally here for the current manual setup.
- Restocking updates the linked inventory levels in PostgreSQL.
