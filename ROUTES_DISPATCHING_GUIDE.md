# Routes & Dispatching Module - Complete Guide

## Overview
The Routes & Dispatching module is now fully functional and properly integrated with the Trip management system. This guide covers all features and functionality.

## Features Implemented

### 1. **Route Management**
- ✅ Create predefined routes with origin, destination, distance, and average time
- ✅ Edit existing routes
- ✅ Delete routes (with protection for routes assigned to active trips)
- ✅ Track total trips per route
- ✅ Set route frequency (High/Medium/Low)
- ✅ Search routes by name or location

### 2. **Trip-Route Connection**
- ✅ Link trips to predefined routes via dropdown selection
- ✅ Auto-populate distance when route is selected
- ✅ Automatic trip counting for each route
- ✅ Backward compatibility with custom text-based routes

### 3. **Dispatching Metrics**
- ✅ Total Routes count
- ✅ High Frequency routes count
- ✅ Total Trips across all routes
- ✅ **Active Dispatches** - Real-time count of running trips

## How to Use

### Creating a Route

1. **Navigate** to Routes & Dispatching section
2. **Click** "Add Route" button
3. **Fill in the form:**
   - **Route Name** (Optional) - e.g., "Mumbai-Pune Express"
   - **From** * - Origin city (Required)
   - **To** * - Destination city (Required)
   - **Distance** - e.g., "150 km"
   - **Avg Time** - e.g., "3 hours"
   - **Frequency** - High/Medium/Low
4. **Click** "Add Route"

The route name is auto-generated as "From to To" if not provided.

### Editing a Route

1. Find the route in the table
2. Click the **blue Edit icon** (pencil)
3. Update the fields you want to change
4. Click **"Update Route"**

### Deleting a Route

1. Find the route in the table
2. Click the **red Delete icon** (trash)
3. Confirm the deletion

**Note:** Routes assigned to active trips may have restrictions.

### Using Routes in Trip Creation

1. **Navigate** to Trips section
2. **Click** "Create Trip"
3. **Select Route** from dropdown:
   - Routes show as: `Name (From → To) - Distance`
   - Distance auto-fills when route is selected
   - You can still manually edit distance if needed
4. Complete other trip details
5. **Create Trip**

**Result:** The route's trip counter automatically increments!

### Viewing Dispatching Metrics

The dashboard shows 4 key metrics:

| Metric | Description |
|--------|-------------|
| **Total Routes** | Number of predefined routes |
| **High Frequency** | Count of high-traffic routes |
| **Total Trips** | Sum of all trips across routes |
| **Active Dispatches** | Currently running trips (status = 'Running') |

## Database Schema

### Route Table
```sql
CREATE TABLE "Route" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  distance TEXT,
  "avgTime" TEXT,
  "totalTrips" INTEGER DEFAULT 0,
  frequency TEXT DEFAULT 'Medium',
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);
```

### Trip Table (Updated)
```sql
CREATE TABLE "Trip" (
  id TEXT PRIMARY KEY,
  "vehicleId" TEXT REFERENCES "Vehicle",
  "driverId" TEXT REFERENCES "Driver",
  "customerId" TEXT REFERENCES "Customer",
  "routeId" TEXT REFERENCES "Route",  -- NEW!
  route TEXT,                         -- Kept for compatibility
  distance TEXT,
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  status TEXT,
  revenue FLOAT,
  expense FLOAT,
  profit FLOAT,
  ...
);
```

## Migration Instructions

### For Existing Databases

Run this SQL in Supabase SQL Editor:

```sql
-- Add routeId column to Trip table
ALTER TABLE "Trip" 
ADD COLUMN IF NOT EXISTS "routeId" TEXT REFERENCES "Route"(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_trip_routeId ON "Trip"("routeId");
```

### For New Installations

The updated schema is in `SUPABASE_SCHEMA.sql` - just run it and you're ready!

## API Services

### routeService

```typescript
// Create a route
await routeService.create({
  name: 'Mumbai-Pune Express',
  from: 'Mumbai',
  to: 'Pune',
  distance: '148 km',
  avgTime: '3 hours',
  frequency: 'High',
  totalTrips: 0
});

// Get all routes
const routes = await routeService.getAll();

// Update a route
await routeService.update(routeId, {
  distance: '150 km',
  avgTime: '2.5 hours'
});

// Delete a route
await routeService.delete(routeId);

// Increment trip count (automatic on trip creation)
await routeService.incrementTripCount(routeId);
```

### tripService (Updated)

```typescript
// Create trip with route
await tripService.create({
  vehicleId: 'vehicle-id',
  driverId: 'driver-id',
  customerId: 'customer-id',
  routeId: 'route-id',          // Links to Route table
  route: 'Mumbai → Pune',       // Display text
  distance: '148 km',            // Auto-filled from route
  startDate: '2026-02-10',
  status: 'Running',
  revenue: 15000,
  expense: 0,
  profit: 15000
});
```

## Benefits

### For Fleet Managers
✓ **Standardize routes** - No more inconsistent route names  
✓ **Track performance** - See which routes are most used  
✓ **Quick trip creation** - Select predefined routes instead of typing  
✓ **Better analytics** - Analyze by route frequency and usage  
✓ **Real-time monitoring** - See active dispatches instantly  

### For Data Accuracy
✓ **Consistent data entry** - Dropdown prevents typos  
✓ **Automatic metrics** - Trip counters update automatically  
✓ **Historical tracking** - See route usage over time  
✓ **Relationship integrity** - Database enforces valid connections  

## Search & Filtering

### Route Search
Search by:
- Route name
- Origin city (From)
- Destination city (To)

### Trip Filtering (in Trips section)
Filter by:
- Status (All/Planned/Running/Completed/Cancelled)
- Date range
- Vehicle
- Customer
- Route (via search)

## Best Practices

### Route Naming
- **Good:** "Mumbai-Pune Express", "NH48 Route", "Coastal Highway"
- **Auto-generated:** "Mumbai to Pune" (when name not provided)

### Route Organization
- Set **High Frequency** for daily/regular routes
- Set **Medium Frequency** for weekly routes
- Set **Low Frequency** for occasional routes

### Distance Format
- Use consistent units: "150 km" or "150km"
- Include decimal for precision: "148.5 km"

### Average Time Format
- Use readable format: "3 hours", "2.5 hours", "45 minutes"

## Troubleshooting

### "Cannot delete route"
**Cause:** Route is assigned to trips  
**Solution:** 
1. Check which trips use this route
2. Either wait for trips to complete
3. Or reassign those trips to another route

### "Route not appearing in trip dropdown"
**Cause:** Routes not loaded  
**Solution:**
1. Refresh the page
2. Check Routes & Dispatching page - routes should be listed
3. If empty, create routes first

### "Distance not auto-filling"
**Cause:** Route doesn't have distance set  
**Solution:**
1. Edit the route
2. Add distance value
3. Try creating trip again

### "Active Dispatches shows 0 but trips are running"
**Cause:** Trip status might not be 'Running'  
**Solution:**
1. Check trip status in Trips section
2. Make sure status is exactly "Running" (case-sensitive)
3. Refresh Routes & Dispatching page

## Technical Details

### Files Modified

| File | Changes |
|------|---------|
| `src/services/supabase.ts` | Added routeService with CRUD operations |
| `src/components/routes/RoutesList.tsx` | Added edit/delete, active dispatch tracking |
| `src/components/trips/TripsList.tsx` | Added route dropdown, auto-distance fill |
| `SUPABASE_SCHEMA.sql` | Added routeId to Trip table |
| `trip_route_connection_migration.sql` | Migration for existing databases |

### Performance Optimizations
- ✅ Indexed routeId field for fast lookups
- ✅ Parallel data loading (routes + vehicles + drivers + customers)
- ✅ Efficient route trip counting
- ✅ Real-time active dispatch calculation

### Data Integrity
- ✅ Foreign key constraints (Trip → Route)
- ✅ ON DELETE SET NULL (route deletion doesn't break trips)
- ✅ Validation on required fields (from, to)
- ✅ Automatic timestamp management

## Future Enhancements

Potential improvements for Routes & Dispatching:

1. **Route Analytics Dashboard**
   - Most profitable routes
   - Average revenue per route
   - Route efficiency metrics

2. **Route Optimization**
   - Suggest optimal routes based on distance
   - Traffic pattern analysis
   - Fuel efficiency tracking

3. **Multi-stop Routes**
   - Support for routes with waypoints
   - Delivery sequence optimization

4. **Route Templates**
   - Save common trip configurations
   - Quick trip creation from templates

5. **Real-time Route Tracking**
   - GPS integration
   - Live vehicle positions on routes
   - ETA calculations

---

**Status:** Fully Functional ✅  
**Database Migration:** Required for existing systems  
**Backward Compatible:** Yes (existing trips work fine)  

The Routes & Dispatching module is production-ready!
