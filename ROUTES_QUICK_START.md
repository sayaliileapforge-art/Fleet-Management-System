# Quick Start: Routes & Dispatching

## 🚀 Get Started in 5 Minutes

### Step 1: Apply Database Migration (Required)

**Open Supabase SQL Editor and run:**

```sql
-- Add routeId column to Trip table
ALTER TABLE "Trip" 
ADD COLUMN IF NOT EXISTS "routeId" TEXT REFERENCES "Route"(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_trip_routeId ON "Trip"("routeId");
```

✅ **Done!** Your database is ready.

---

### Step 2: Create Your First Route

1. **Refresh your browser** (F5)
2. **Go to** Routes & Dispatching
3. **Click** "Add Route"
4. **Fill in:**
   ```
   From: Mumbai
   To: Pune
   Distance: 148 km
   Avg Time: 3 hours
   Frequency: High
   ```
5. **Click** "Add Route"

✅ **Route Created!**

---

### Step 3: Create a Trip Using the Route

1. **Go to** Trips section
2. **Click** "Create Trip"
3. **Select:**
   - Vehicle: Any vehicle
   - Driver: Any driver
   - Customer: Any customer (optional)
   - **Route:** Select "Mumbai to Pune (Mumbai → Pune) - 148 km"
   
   👀 **Watch:** Distance auto-fills to "148 km"!

4. **Complete** other fields (start date, revenue)
5. **Click** "Create Trip"

✅ **Trip Created!** Route trip counter incremented automatically.

---

### Step 4: Verify Everything Works

1. **Go back to** Routes & Dispatching
2. **Check metrics:**
   - Total Routes: 1
   - Total Trips: 1
   - Active Dispatches: 1 (if trip status is Running)
   
3. **Test edit:**
   - Click blue Edit icon on your route
   - Change distance to "150 km"
   - Save

✅ **All Working!**

---

## 🎯 What You Can Do Now

### Routes Management
- ✏️ **Edit routes** - Click blue pencil icon
- 🗑️ **Delete routes** - Click red trash icon
- 🔍 **Search routes** - Use search box
- 📊 **Track metrics** - See totals at the top

### Trip Creation
- 📍 **Select routes** from dropdown (no more typing!)
- 🚗 **Auto-fill distance** (saves time)
- ✅ **Consistent data** (no typos)

### Dispatching
- 📈 **Monitor active dispatches** in real-time
- 📊 **Track trip counts** per route
- 🎯 **Analyze route frequency**

---

## 📱 Quick Reference

| Feature | How to Access |
|---------|---------------|
| Create Route | Routes & Dispatching → Add Route |
| Edit Route | Routes table → Blue Edit icon |
| Delete Route | Routes table → Red Trash icon |
| Use Route in Trip | Trips → Create Trip → Route dropdown |
| View Metrics | Routes & Dispatching → Top cards |

---

## 🆘 Troubleshooting

**Q: Routes not showing in trip dropdown?**  
A: Refresh page, or go create routes first in Routes & Dispatching

**Q: Distance not auto-filling?**  
A: Make sure route has distance set (edit route and add it)

**Q: Active Dispatches shows 0?**  
A: Create a trip with status "Running" to see it increment

**Q: Can't delete route?**  
A: Route is assigned to trips - wait for trips to complete

---

## 📚 Full Documentation

- **Complete Guide:** `ROUTES_DISPATCHING_GUIDE.md`
- **Implementation Details:** `ROUTES_DISPATCHING_SUMMARY.md`
- **Migration File:** `trip_route_connection_migration.sql`

---

✨ **That's it! You're ready to use Routes & Dispatching!**

The module is fully functional and integrated with your Fleet Management System.
