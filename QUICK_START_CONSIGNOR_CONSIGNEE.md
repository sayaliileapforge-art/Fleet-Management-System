# Consignor & Consignee Feature - Quick Start Guide

## ✅ What's Been Implemented

Your Fleet Management System now has full **Consignor & Consignee tracking** for all shipments!

### Key Features
- ✓ Select shippers (consignors) when creating loads
- ✓ Select receivers (consignees) when creating loads  
- ✓ View who sent/received each shipment
- ✓ Search loads by party names
- ✓ Fully backward compatible

## 🚀 Getting Started (3 Minutes)

### Step 1: Apply Database Migration (Existing Systems Only)

If you already have loads in your system:

1. **Open your Supabase project**
2. **Go to SQL Editor** → New Query
3. **Copy** contents from: `load_consignor_consignee_migration.sql`
4. **Execute** the query
5. **Done!** The columns are added

*For new installations, the schema is already updated.*

### Step 2: Create Your Customers

Before creating loads, add customers to your system:

1. **Go to Customers section**
2. **Click "Create Customer"**
3. **Add all shippers** (people/companies sending goods)
4. **Add all receivers** (people/companies receiving goods)

*You can use the same customer as both shipper and receiver*

### Step 3: Create Loads with Parties

Now you can track parties with every load:

1. **Go to Loads & Shipment Tracking**
2. **Click "Create Load"**
3. **Select Consignor** (who's sending) ← NEW
4. **Select Consignee** (who's receiving) ← NEW
5. **Fill other details** as normal
6. **Save** - Done!

## 📊 How to Use the Feature

### Creating a Load

```
Create Load Form:
├─ Trip (Optional)
├─ Consignor ← NEW! Pick the shipper
├─ Consignee ← NEW! Pick the receiver
├─ Material
├─ Weight
├─ From
├─ To
├─ Status
└─ POD Status
```

### Viewing Loads with Parties

The loads table now shows:
- **Consignor** column - Who sent it
- **Consignee** column - Who receives it
- Search by customer name finds all their shipments

### Example Workflow

**Scenario:** You have a shipment from Supplier ABC to Customer XYZ

1. Create Customer: "Supplier ABC" (Consignor)
2. Create Customer: "Customer XYZ" (Consignee)
3. Create Load:
   - Set Consignor = "Supplier ABC"
   - Set Consignee = "Customer XYZ"
   - Add material details
   - Save ✓

Now you can instantly see:
- All shipments FROM "Supplier ABC"
- All shipments TO "Customer XYZ"
- Complete shipment details

## 📚 Documentation

**Detailed guides available:**
- [`CONSIGNOR_CONSIGNEE_GUIDE.md`](CONSIGNOR_CONSIGNEE_GUIDE.md) - Full feature documentation
- [`CONSIGNOR_CONSIGNEE_IMPLEMENTATION.md`](CONSIGNOR_CONSIGNEE_IMPLEMENTATION.md) - Technical implementation details

## 🔍 What Changed (Technical)

### Database
- Added `consignorId` column to Load table
- Added `consigneeId` column to Load table
- Both reference Customer table
- Includes performance indices

### Frontend
- Consignor dropdown in create form
- Consignee dropdown in create form
- Consignor & Consignee columns in table display
- Enhanced search (by party names)

### Backend Service
- Updated `loadService` to handle new fields
- Maintains referential integrity
- Backward compatible

## ❓ Common Questions

**Q: Do I have to use consignor/consignee?**  
A: No! They're optional. Existing loads work fine without them.

**Q: Can I leave one blank?**  
A: Yes! You can have consignor without consignee or vice versa.

**Q: Can same customer be both?**  
A: Yes! The system allows it (e.g., internal transfers).

**Q: What if I delete a customer?**  
A: Loads remain, but the party reference is cleared (set to NULL).

**Q: How do I update an existing load?**  
A: Currently, create a new load. Full edit feature coming soon.

## 🎯 Next Steps

1. **Check the guides** if you want detailed information
2. **Create your customers** (shippers & receivers)
3. **Start using the feature** when creating loads
4. **Search by party names** to find shipments quickly

## 📞 Support

For issues:
1. Check [`CONSIGNOR_CONSIGNEE_GUIDE.md`](CONSIGNOR_CONSIGNEE_GUIDE.md) Troubleshooting section
2. Verify customers are created
3. Ensure migration was applied (for existing systems)
4. Clear browser cache and refresh

## ✨ What's Next?

Future enhancements we're considering:
- Edit consignor/consignee on existing loads
- Party-based reporting & analytics
- Performance tracking by shipper/receiver
- Automated notifications to parties
- Contract-based party assignments

---

**Status:** Ready to Use ✅  
**Backward Compatible:** Yes ✅  
**No Breaking Changes:** Yes ✅  

Happy shipping! 📦
