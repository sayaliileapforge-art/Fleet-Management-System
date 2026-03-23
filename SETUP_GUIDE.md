# Setup & Deployment Guide

Complete guide to set up, run, test, and deploy the Fleet Management System.

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org))
- **npm** 9+ (comes with Node.js)
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download))
- **Git** ([Download](https://git-scm.com))
- **VS Code** (Recommended) ([Download](https://code.visualstudio.com))

### Verify Installation

```bash
node --version      # Should be v18+
npm --version       # Should be 9+
psql --version      # Should be 12+
git --version       # Any recent version
```

## 🗄️ Database Setup

### Step 1: Create PostgreSQL Database

**Windows (using psql):**
```bash
psql -U postgres

# In psql prompt:
CREATE DATABASE fleet_management;
\du  # List users
\l   # List databases
\q   # Quit
```

**Mac/Linux:**
```bash
psql postgres
# Same commands as above
```

**Alternative: Using pgAdmin GUI**
1. Open pgAdmin
2. Right-click Servers → Create → Server
3. Set name: "Fleet Management"
4. Create new database: "fleet_management"

### Step 2: Verify Connection

```bash
psql -U postgres -d fleet_management
```

You should see: `fleet_management=#`

## 🚀 Backend Setup

### Step 1: Navigate to Backend

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- Express, Prisma, PostgreSQL client
- TypeScript, Jest, Supertest
- Development tools (tsx, ESLint)

### Step 3: Configure Environment

```bash
# Copy example file
cp .env.example .env

# Edit .env with your PostgreSQL credentials
# Windows: notepad .env
# Mac/Linux: nano .env
```

Update `.env`:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/fleet_management"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Step 4: Initialize Prisma

```bash
# Generate Prisma client
npm run prisma:generate

# Create database schema (run migrations)
npm run prisma:migrate
```

When prompted for migration name, type: `initial`

### Step 5: Verify Setup

```bash
# Test database connection
npm run prisma:studio

# This opens: http://localhost:5555
# Verify all tables are created
# Press Ctrl+C to close
```

### Step 6: Start Backend Server

```bash
npm run dev
```

Expected output:
```
✅ Server running on http://localhost:5000
📝 API Documentation: http://localhost:5000/api/health
```

### Step 7: Test Backend

In new terminal (stay in backend folder):

```bash
# Run all tests
npm test

# Run specific test file
npm test vehicle.test.ts

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Step 8: Test API Endpoint

In new terminal:

```bash
# Test health check
curl http://localhost:5000/api/health

# Should return:
# {"status":"OK","message":"Server is running",...}
```

## 🎨 Frontend Setup

### Step 1: Navigate to Frontend

```bash
cd ..  # Go back to root
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

```bash
# Create .env file
copy .env.example .env  # Windows
# or
cp .env.example .env    # Mac/Linux
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 4: Start Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Step 5: Open in Browser

Navigate to: **http://localhost:5173**

You should see the Fleet Management UI.

## ✅ Verify Full Integration

### Test Creating a Vehicle

1. In browser, navigate to Vehicles
2. Click "Add Vehicle"
3. Fill form:
   - Vehicle No: TRK-TEST-001
   - Name: Test Vehicle
   - Type: Heavy Truck
   - Model: Tata Prima
   - Capacity: 40 tons
   - Fuel Type: Diesel
4. Click Add
5. Should see success toast
6. Check browser console for API response

### Check Backend Database

```bash
# In backend folder, run:
npm run prisma:studio

# View Vehicles table
# Should see your created vehicle
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test suite
npm test -- vehicle.test.ts

# Watch mode (auto re-run on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
# Opens: coverage/lcov-report/index.html
```

### Expected Test Output

```
PASS  tests/vehicle.test.ts
  Vehicle Controller
    POST /api/vehicles
      ✓ should create a vehicle successfully (45ms)
      ✓ should return 400 for missing required fields (12ms)
      ✓ should return 409 for duplicate vehicle number (18ms)
    GET /api/vehicles
      ✓ should get all vehicles (23ms)
      ✓ should filter vehicles by status (19ms)
    ...

Test Suites: 3 passed, 3 total
Tests:       32 passed, 32 total
Snapshots:   0 total
Time:        4.234s
```

## 🔄 Development Workflow

### During Development

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Watches for changes, auto-restarts
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Watches for changes, hot reload
```

**Terminal 3 - Prisma Studio (Optional):**
```bash
cd backend
npm run prisma:studio
# Visual database editor on http://localhost:5555
```

### Hot Reloading

- **Frontend**: Changes auto-refresh in browser
- **Backend**: Changes restart server automatically
- **Database**: Manual restart needed after schema changes

## 📦 Build for Production

### Backend Build

```bash
cd backend

# Build TypeScript to JavaScript
npm run build

# Verify build
ls dist/

# Start production server
npm start
```

### Frontend Build

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

## 🌐 Deployment

### Supabase PostgreSQL Setup

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string
4. Update backend `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
   ```
5. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

### Deploy Backend (Heroku Example)

```bash
cd backend

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set DATABASE_URL="postgresql://..."
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://your-frontend-domain.com

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Deploy Frontend (Vercel Example)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Create .env.production
VITE_API_URL=https://your-backend-domain.com/api

# Re-deploy with new env
vercel env add VITE_API_URL
vercel --prod
```

## 🔐 Environment Checklist

### Backend .env

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/db
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend .env

```env
VITE_API_URL=http://localhost:5000/api
```

### Production .env

```env
DATABASE_URL=postgresql://...@supabase.co:5432/postgres
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

## 🐛 Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check PostgreSQL is running
# Windows: Services → PostgreSQL
# Mac: brew services list
# Linux: sudo systemctl status postgresql

# Verify credentials in .env
# Test connection:
psql -U postgres -d fleet_management
```

### Prisma Migration Error

```
Error: Migration engine not found
```

**Solution:**
```bash
cd backend
npm run prisma:generate
npm install
npm run prisma:migrate
```

### Port Already in Use

```
Error: listen EADDRINUSE :::5000
```

**Solution:**

Windows:
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

Mac/Linux:
```bash
lsof -i :5000
kill -9 <PID>
```

Or change PORT in .env to 5001, 5002, etc.

### Frontend Can't Connect to Backend

**Symptoms:** API calls fail, see CORS errors

**Solution:**
1. Verify backend running: `curl http://localhost:5000/api/health`
2. Check frontend .env has correct VITE_API_URL
3. Clear browser cache: Ctrl+Shift+Delete
4. Check browser DevTools → Network tab
5. Verify CORS in backend index.ts

### Module Not Found Errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist

# Rebuild
npm run build
```

## 📊 Monitoring

### Backend Health

```bash
# Check if running
curl http://localhost:5000/api/health

# View logs
# Terminal window shows all logs

# Check database
npm run prisma:studio
```

### Database Monitoring

```bash
# Connect to database
psql -U postgres -d fleet_management

# List tables
\dt

# Count records
SELECT COUNT(*) FROM "Vehicle";

# Exit
\q
```

## 📚 Useful Commands

### Backend Commands

```bash
cd backend

npm run dev              # Start dev server
npm run build          # Build for production
npm start              # Start production server
npm test               # Run tests
npm run test:watch    # Watch mode tests
npm run test:coverage # Coverage report
npm run prisma:generate    # Generate client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open database UI
npm run lint           # Check code style
npm run type-check     # TypeScript check
```

### Frontend Commands

```bash
npm run dev            # Start dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm run type-check     # TypeScript check
npm run lint           # ESLint check
```

### Database Commands

```bash
# Connect to database
psql -U postgres -d fleet_management

# Useful psql commands
\dt              # List tables
\d "Vehicle"     # Show table structure
SELECT * FROM "Vehicle" LIMIT 5;  # View data
\du              # List users
\l               # List databases
\q               # Quit
```

## 📋 Checklist

### Initial Setup

- [ ] Node.js and PostgreSQL installed
- [ ] PostgreSQL database created
- [ ] Backend .env configured
- [ ] Backend dependencies installed
- [ ] Prisma migrations run
- [ ] Backend tests passing
- [ ] Backend server running
- [ ] Frontend .env configured
- [ ] Frontend dependencies installed
- [ ] Frontend server running
- [ ] API integration working
- [ ] Test data visible in database

### Before Deployment

- [ ] All backend tests passing
- [ ] All frontend tests passing
- [ ] Production .env configured
- [ ] Database backed up
- [ ] Frontend build successful
- [ ] Backend build successful
- [ ] Production database prepared
- [ ] API health check working
- [ ] CORS configured for production URL

## 🎓 Learning Resources

- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Prisma Docs](https://www.prisma.io/docs/getting-started)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html)
- [React Hooks](https://react.dev/reference/react/hooks)
- [Vite Guide](https://vitejs.dev/guide/)
- [Jest Testing](https://jestjs.io/docs/getting-started)

## 🤝 Support

### Getting Help

1. Check troubleshooting section above
2. Review README files in backend/ and frontend/
3. Check test files for usage examples
4. Review FRONTEND_INTEGRATION.md for component examples
5. Check browser DevTools for errors
6. Review terminal output for detailed error messages

### Common Issues

**Q: Backend won't start**
- Check PORT isn't in use
- Check DATABASE_URL is correct
- Run: `npm run prisma:generate`

**Q: API calls fail**
- Verify backend running
- Check .env VITE_API_URL
- Clear browser cache
- Check CORS settings

**Q: Database looks empty**
- Check .env DATABASE_URL
- Run: `npm run prisma:migrate`
- Verify psql connection works

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Status:** ✅ Complete Setup Guide
