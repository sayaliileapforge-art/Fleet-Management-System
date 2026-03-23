# Quick Reference Card

## 🚀 Start Development (Copy-Paste Commands)

### First Time Setup

```bash
# Terminal 1: Backend Setup
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm run prisma:generate
npm run prisma:migrate
npm run dev

# Terminal 2: Frontend Setup (in new terminal, from root)
npm install
npm run dev

# Terminal 3: Optional - Database UI (in new terminal)
cd backend
npm run prisma:studio
```

### Verify Everything Works

```bash
# Test health check
curl http://localhost:5000/api/health

# Open browser
# Frontend: http://localhost:5173
# Database UI: http://localhost:5555 (if running prisma:studio)
```

## 📡 Common API Calls

```bash
# Health Check
curl http://localhost:5000/api/health

# Create Vehicle
curl -X POST http://localhost:5000/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{"vehicleNo":"TRK-001","name":"Test","type":"Truck","model":"Tata","capacity":"40","fuelType":"Diesel"}'

# Get All Vehicles
curl http://localhost:5000/api/vehicles

# Get Vehicle by ID
curl http://localhost:5000/api/vehicles/VEHICLE_ID

# Update Vehicle
curl -X PUT http://localhost:5000/api/vehicles/VEHICLE_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"Maintenance"}'

# Delete Vehicle
curl -X DELETE http://localhost:5000/api/vehicles/VEHICLE_ID

# Get Trips with Filter
curl "http://localhost:5000/api/trips?status=Completed"

# Get Dashboard Stats
curl http://localhost:5000/api/dashboard/stats
```

## 📁 Key Files Location

```
Fleet Management System Design/
├── backend/                      # All backend code
│   ├── src/index.ts             # Express server entry
│   ├── prisma/schema.prisma     # Database schema
│   └── README.md                # Backend docs
├── src/services/                # Frontend API services
│   ├── api.ts                   # Axios instance
│   └── vehicle.service.ts       # Example service
├── FRONTEND_INTEGRATION.md      # How to use API
├── SETUP_GUIDE.md              # Detailed setup
└── INTEGRATION_SUMMARY.md       # This overview
```

## 🧪 Testing Commands

```bash
cd backend

# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npm test -- vehicle.test.ts
```

## 🛠️ Environment Setup

### Backend .env
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/fleet_management"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend .env
```env
VITE_API_URL=http://localhost:5000/api
```

## 💡 Frontend Component Pattern

```typescript
import { vehicleService } from '@/services/vehicle.service';
import { useState, useEffect } from 'react';

export function YourComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await vehicleService.getAllVehicles();
      setData(response.data.vehicles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## 🐛 Troubleshooting Quick Fixes

```bash
# Port 5000 in use?
# Mac/Linux:
lsof -i :5000
kill -9 PID

# Windows:
netstat -ano | findstr :5000
taskkill /PID PID /F

# Database connection error?
psql -U postgres -d fleet_management

# Prisma issues?
cd backend
rm -rf node_modules .prisma
npm install
npm run prisma:generate

# Clear everything and restart?
cd backend
npm run prisma:migrate reset
npm run dev
```

## 📊 Database Connection

```bash
# Connect to database
psql -U postgres -d fleet_management

# Useful commands in psql:
\dt              # List all tables
\d "Vehicle"     # Show Vehicle table structure
SELECT COUNT(*) FROM "Vehicle";  # Count records
\q               # Quit

# Visual database editor (recommended)
cd backend
npm run prisma:studio  # Opens http://localhost:5555
```

## 🔧 Useful npm Scripts

### Backend (cd backend first)

```bash
npm run dev              # Start dev server (auto-reload)
npm run build           # Build for production
npm start              # Run production server
npm test               # Run tests
npm run test:watch    # Tests auto-rerun
npm run test:coverage # Coverage report
npm run prisma:generate     # Regenerate client
npm run prisma:migrate      # Run migrations
npm run prisma:studio       # Open database UI
npm run lint           # ESLint
npm run type-check    # TypeScript check
```

### Frontend (from root)

```bash
npm run dev            # Start dev server
npm run build          # Production build
npm run preview        # Preview build
npm run type-check    # TypeScript check
```

## 📞 API Response Format

### Success (2xx)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error (4xx/5xx)
```json
{
  "success": false,
  "message": "Error description",
  "error": { ... }  // Only in development
}
```

## 🔄 Common Workflows

### Adding a New Feature

1. Update Prisma schema: `backend/prisma/schema.prisma`
2. Run migration: `npm run prisma:migrate` (in backend)
3. Create controller: `backend/src/controllers/newfeature.controller.ts`
4. Create router: `backend/src/routes/newfeature.routes.ts`
5. Add to server: Update `backend/src/index.ts`
6. Create service: `src/services/newfeature.service.ts`
7. Use in component: Import service and follow pattern

### Updating Existing Model

1. Edit schema: `backend/prisma/schema.prisma`
2. Migrate: `npm run prisma:migrate`
3. Update controller logic
4. Update/add tests
5. Test in UI

### Fixing Issues

1. Check logs in terminal
2. Use DevTools Network tab
3. Try `npm run prisma:studio` to inspect data
4. Review error in VS Code Problems panel
5. Check `.env` files are configured
6. Restart both servers

## 📚 Documentation Links

- Backend: `backend/README.md`
- Frontend Integration: `FRONTEND_INTEGRATION.md`
- Setup Details: `SETUP_GUIDE.md`
- Overview: `INTEGRATION_SUMMARY.md`

## ✨ Features Available

| Feature | Status | Location |
|---------|--------|----------|
| Vehicle CRUD | ✅ Complete | `/api/vehicles` |
| Driver CRUD | ✅ Complete | `/api/drivers` |
| Trip CRUD | ✅ Complete | `/api/trips` |
| Expense CRUD | ✅ Complete | `/api/expenses` |
| Customer CRUD | ✅ Complete | `/api/customers` |
| Dashboard Stats | ✅ Complete | `/api/dashboard/stats` |
| Pagination | ✅ Complete | All list endpoints |
| Filtering | ✅ Complete | Trips, Expenses |
| Error Handling | ✅ Complete | All endpoints |
| Testing | ✅ Complete | 21+ tests |
| Validation | ✅ Complete | All endpoints |
| Type Safety | ✅ Complete | Full TypeScript |
| CORS | ✅ Complete | Configured |
| Documentation | ✅ Complete | 4 guides |

## 🎯 Daily Commands Cheatsheet

```bash
# Start coding
cd backend && npm run dev     # Terminal 1
npm run dev                   # Terminal 2 (from root)
cd backend && npm run prisma:studio  # Terminal 3 (optional)

# Run tests
cd backend && npm test

# Check database
cd backend && npm run prisma:studio

# Build for production
cd backend && npm run build
npm run build

# Check for errors
cd backend && npm run type-check
npm run type-check

# Clean and reinstall (if having issues)
cd backend
rm -rf node_modules dist .prisma
npm install
npm run prisma:generate

# Deploy backend (example: Heroku)
git push heroku main

# Deploy frontend (example: Vercel)
vercel --prod
```

## 🔐 Important Notes

- ✅ Never commit `.env` file (use `.env.example`)
- ✅ Never commit `node_modules` folder
- ✅ Use `.gitignore` (already provided)
- ✅ Always run `npm run prisma:migrate` after schema changes
- ✅ Test before deploying
- ✅ Keep dependencies updated: `npm update`
- ✅ Use environment variables for secrets
- ✅ Review error logs in terminal

## 🎉 You're Ready!

1. ✅ Backend created
2. ✅ Database configured
3. ✅ API services ready
4. ✅ Tests included
5. ✅ Documentation complete
6. ✅ Ready to build UI

Start with: `cd backend && npm run dev`

---

**Quick Reference v1.0** | January 2025
