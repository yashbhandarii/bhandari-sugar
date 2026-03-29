# Backend Services Documentation

## PDF Service (`pdf.service.js`)

### Data Contracts & Logic

#### Delivery Sheet Item Quantity Resolution
In `generateDeliverySheetPDF`, the processing of `sheet.items` for quantity display follows these rules:
- `getDeliverySheetById` in `delivery.service.js` populates `item.quantities` as a map derived from the database (e.g., `{ [catId]: bags }`).
- Currently, Category ID `1` is assumed to be **Medium** and Category ID `2` is assumed to be **Super Small**.
- The PDF generator prioritizes these IDs but falls back to `item.medium_bags` or `item.super_small_bags` if the manual legacy properties are present.

#### Customer Consolidation
- The system currently assumes a "No duplicate customer per sheet" requirement.
- Each item in `sheet.items` corresponds to a single row in the delivery table.
