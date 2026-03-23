# Consignor & Consignee Management Guide

## Overview
The Fleet Management System now supports tracking **Consignors** (shippers/senders) and **Consignees** (receivers/recipients) for all shipments and loads.

## What are Consignors and Consignees?

- **Consignor (Shipper)**: The party sending/originating the shipment
- **Consignee (Receiver)**: The party receiving the shipment

## Features Added

### 1. Database Schema Changes
Two new fields have been added to the `Load` table:
- `consignorId` - Foreign key reference to Customer table
- `consigneeId` - Foreign key reference to Customer table

### 2. UI Enhancements
The Loads & Shipment Tracking page now includes:
- Consignor dropdown in the "Create Load" form
- Consignee dropdown in the "Create Load" form
- Consignor and Consignee columns in the loads table
- Search capability by consignor/consignee names

### 3. Data Display
When viewing the Loads list, you can now see:
- Who sent the shipment (Consignor)
- Who receives the shipment (Consignee)
- Full customer names instead of just IDs

## How to Use

### Creating a Load with Consignor/Consignee

1. **Navigate to Loads & Shipment Tracking**
2. **Click "Create Load"** button
3. **Fill in the form fields:**
   - **Trip** (Optional) - Link to an existing trip
   - **Consignor** - Select from your customers/vendors (who is sending)
   - **Consignee** - Select from your customers/vendors (who is receiving)
   - **Material** - Type of goods being shipped
   - **Weight** - Quantity/weight of materials
   - **From** - Origin location
   - **To** - Destination location
   - **Status** - Current shipment status
   - **POD Status** - Proof of Delivery status

4. **Click "Create Load"** to save

### Finding Loads by Party

The search functionality now finds loads by:
- Load ID
- Trip ID
- Material type
- Origin/Destination locations
- **Consignor name** ← NEW
- **Consignee name** ← NEW

Type a consignor or consignee name in the search box to quickly find their shipments!

### Viewing Consignor/Consignee Information

See the two new columns in the loads table:
| Column | Shows |
|--------|-------|
| **Consignor** | Name of the company/party sending the goods |
| **Consignee** | Name of the company/party receiving the goods |

## Setup Instructions (For Existing Databases)

If you already have loads in your system, run this migration:

### Option 1: Using Supabase SQL Editor
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `load_consignor_consignee_migration.sql`
5. Execute the query

### Option 2: Manual Setup
Run these SQL commands:
```sql
ALTER TABLE "Load" 
ADD COLUMN IF NOT EXISTS "consignorId" TEXT REFERENCES "Customer"(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "consigneeId" TEXT REFERENCES "Customer"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_load_consignorId ON "Load"("consignorId");
CREATE INDEX IF NOT EXISTS idx_load_consigneeId ON "Load"("consigneeId");
```

## Benefits

✓ **Better Tracking** - Know exactly who is sending and receiving each shipment  
✓ **Improved Reporting** - Generate reports by consignor or consignee  
✓ **Customer Relationship** - Link shipments directly to customers/vendors  
✓ **Compliance** - Maintain proper documentation of goods movement  
✓ **Search & Filter** - Quickly find all shipments for a specific party  

## Customer Setup

Before creating loads with consignors/consignees, you should:

1. **Go to Customers section**
2. **Add all your shippers** (consignors)
3. **Add all your receivers** (consignees)
4. Assign appropriate `type` to each (optional):
   - Type: "Consignor" for shippers
   - Type: "Consignee" for receivers  
   - Type: "Customer" for standard customers

*Note: The same customer can be both a consignor and consignee in different shipments.*

## Technical Details

### Database Relations
```
Load → Customer (Consignor)
Load → Customer (Consignee)
```

### API Service
The `loadService` now handles all consignor/consignee operations:
```typescript
loadService.create({
  tripId: string,
  consignorId: string,    // ← NEW
  consigneeId: string,    // ← NEW
  material: string,
  weight: string,
  from: string,
  to: string,
  status: string,
  pod: string
})
```

## Files Modified

| File | Changes |
|------|---------|
| `SUPABASE_SCHEMA.sql` | Added consignorId, consigneeId columns to Load table |
| `src/components/loads/LoadsList.tsx` | Added consignor/consignee dropdowns and table columns |
| `src/services/supabase.ts` | Updated loadService with new fields |
| `load_consignor_consignee_migration.sql` | Migration file for existing databases |

## Troubleshooting

### Consignor/Consignee dropdowns are empty
- ✓ Make sure you've created customers in the Customers section first
- ✓ Refresh the page to reload the customer list
- ✓ Check that customers are not marked as "Inactive"

### Can't select the same customer as both consignor and consignee
- This is allowed! The system doesn't prevent this. If needed for your use case, you can create separate customer records

### Missing columns after applying migration
- ✓ Clear your browser cache (Ctrl+F5 or Cmd+Shift+R)
- ✓ Wait a moment and refresh - the data might be loading
- ✓ Check the migration was successfully applied in Supabase SQL Editor

## Future Enhancements

Potential improvements for consignor/consignee management:
- Edit/update consignor/consignee on existing loads
- Consignor/consignee communication templates
- Automated notifications to consignor/consignee
- Enhanced reporting with party analysis
- KPI tracking by top consignors/consignees
