# Fleet Management System Backend

Complete REST API backend for the Fleet Management System built with Node.js, Express, Prisma, and PostgreSQL.

## 📋 Features

- **RESTful API** with modular route structure
- **Prisma ORM** for database management
- **PostgreSQL** database (ready for Supabase migration)
- **Comprehensive CRUD** operations for all entities
- **Error handling** with unified middleware
- **Pagination** support for list endpoints
- **Jest + Supertest** for API testing
- **TypeScript** for type safety
- **CORS** enabled for frontend integration
- **Environment configuration** via .env

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.ts                 # Express server setup
│   ├── config/
│   │   └── database.ts          # Prisma client
│   ├── controllers/
│   │   ├── vehicle.controller.ts
│   │   ├── driver.controller.ts
│   │   ├── trip.controller.ts
│   │   ├── expense.controller.ts
│   │   ├── customer.controller.ts
│   │   └── dashboard.controller.ts
│   ├── routes/
│   │   ├── vehicle.routes.ts
│   │   ├── driver.routes.ts
│   │   ├── trip.routes.ts
│   │   ├── expense.routes.ts
│   │   ├── customer.routes.ts
│   │   └── dashboard.routes.ts
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── notFoundHandler.ts
│   └── utils/
│       ├── types.ts
│       └── helpers.ts
├── prisma/
│   └── schema.prisma            # Database schema
├── tests/
│   ├── vehicle.test.ts
│   ├── trip.test.ts
│   └── expense.test.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.example
└── README.md (this file)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your PostgreSQL connection details:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/fleet_management"
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

4. **Set up Prisma and database:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Create and run migrations
   npm run prisma:migrate
   ```

   This will:
   - Create the PostgreSQL database (if it doesn't exist)
   - Create all tables based on the schema
   - Set up indexes

## 🗄️ Database Models

### Vehicle
- id, vehicleNo (unique), name, type, model, capacity, fuelType
- status: Active | Deployed | Maintenance | Idle
- licenseExpiry, insuranceExpiry, totalTrips, totalRevenue
- Relations: trips[], expenses[]

### Driver
- id, name, phone (unique), license (unique), licenseExpiry
- experience, status, totalTrips, rating
- Relations: trips[]

### Trip
- id, startDate, endDate, status: Planned | Running | Completed | Cancelled
- revenue, expense, profit
- Foreign keys: vehicleId, driverId, customerId (optional)
- Relations: vehicle, driver, customer, expenses[]

### Expense
- id, category, amount, date
- Foreign keys: vehicleId, tripId (optional)
- Relations: vehicle, trip

### Customer
- id, name, email (unique), phone, address, city
- Relations: trips[]

### Other Models
- Route, Contract, Maintenance, Fuel (see schema.prisma for details)

## 📡 API Endpoints

### Vehicles (`/api/vehicles`)
```
POST   /api/vehicles              # Create vehicle
GET    /api/vehicles              # Get all vehicles (paginated)
GET    /api/vehicles/:id          # Get vehicle by ID
PUT    /api/vehicles/:id          # Update vehicle
DELETE /api/vehicles/:id          # Delete vehicle
```

### Drivers (`/api/drivers`)
```
POST   /api/drivers               # Create driver
GET    /api/drivers               # Get all drivers (paginated)
GET    /api/drivers/:id           # Get driver by ID
PUT    /api/drivers/:id           # Update driver
DELETE /api/drivers/:id           # Delete driver
```

### Customers (`/api/customers`)
```
POST   /api/customers             # Create customer
GET    /api/customers             # Get all customers (paginated)
GET    /api/customers/:id         # Get customer by ID
PUT    /api/customers/:id         # Update customer
DELETE /api/customers/:id         # Delete customer
```

### Trips (`/api/trips`)
```
POST   /api/trips                 # Create trip
GET    /api/trips                 # Get all trips (paginated)
GET    /api/trips/:id             # Get trip by ID
PUT    /api/trips/:id             # Update trip
DELETE /api/trips/:id             # Delete trip
```

Query filters: `?status=Completed&vehicleId=xyz&driverId=abc`

### Expenses (`/api/expenses`)
```
POST   /api/expenses              # Create expense
GET    /api/expenses              # Get all expenses (paginated)
GET    /api/expenses/:id          # Get expense by ID
PUT    /api/expenses/:id          # Update expense
DELETE /api/expenses/:id          # Delete expense
```

Query filters: `?category=Fuel&vehicleId=xyz`

### Dashboard (`/api/dashboard`)
```
GET    /api/dashboard/stats       # Get KPIs and summary statistics
GET    /api/dashboard/revenue-by-month    # Revenue trend
GET    /api/dashboard/expense-by-category # Expense breakdown
GET    /api/dashboard/top-vehicles        # Top performing vehicles
GET    /api/dashboard/top-drivers         # Top performing drivers
```

## 📤 API Response Format

All endpoints return JSON in this format:

**Success Response (2xx):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "message": "Error description",
  "error": { ... }  // Only in development
}
```

## 🧪 Testing

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Generate coverage report:
```bash
npm run test:coverage
```

### Test files included:
- `tests/vehicle.test.ts` - Vehicle CRUD operations
- `tests/trip.test.ts` - Trip CRUD with related entities
- `tests/expense.test.ts` - Expense CRUD operations

### Test Coverage:
- Create operations with validation
- Get operations with pagination and filters
- Update operations with data integrity checks
- Delete operations with cascade checks
- Error handling (400, 404, 409, 500)

## 🔧 Development

### Start development server:
```bash
npm run dev
```

Server runs at `http://localhost:5000`

### Build for production:
```bash
npm run build
```

### Start production server:
```bash
npm start
```

### View Prisma Studio (GUI for database):
```bash
npm run prisma:studio
```

## 🔗 Frontend Integration

The frontend service layer (`src/services/`) provides type-safe API calls:

```typescript
// src/services/vehicle.service.ts
import { vehicleService } from '@/services/vehicle.service';

// Get all vehicles
const { data } = await vehicleService.getAllVehicles(1, 10);

// Create vehicle
const newVehicle = await vehicleService.createVehicle({
  vehicleNo: 'TRK-001',
  name: 'Truck A',
  type: 'Heavy Truck',
  // ...
});

// Update vehicle
await vehicleService.updateVehicle(id, { status: 'Maintenance' });

// Delete vehicle
await vehicleService.deleteVehicle(id);
```

## 📝 Example Requests

### Create Vehicle
```bash
curl -X POST http://localhost:5000/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleNo": "TRK-001",
    "name": "Heavy Truck",
    "type": "Heavy Truck",
    "model": "Tata Prima",
    "capacity": "40 tons",
    "fuelType": "Diesel",
    "status": "Active"
  }'
```

### Create Trip
```bash
curl -X POST http://localhost:5000/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "vehicle-id",
    "driverId": "driver-id",
    "customerId": "customer-id",
    "route": "Mumbai → Delhi",
    "distance": "1400 km",
    "startDate": "2025-01-26T10:00:00Z",
    "revenue": 25000,
    "expense": 16500
  }'
```

### Get Dashboard Stats
```bash
curl http://localhost:5000/api/dashboard/stats
```

## 🗄️ Database Migration

### Create a new migration:
```bash
npm run prisma:migrate
```

Follow prompts to name and describe the migration.

### Reset database (development only):
```bash
npm run prisma:migrate reset
```

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment (development/production) | development |
| `FRONTEND_URL` | Frontend origin for CORS | http://localhost:5173 |

## 🛠️ Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running
- Verify DATABASE_URL in .env
- Check PostgreSQL credentials

### Prisma Client Error
```
Error: @prisma/client not found
```
Solution:
```bash
npm run prisma:generate
npm install
```

### Migration Error
```
Database migration failed
```
Solution:
```bash
npm run prisma:migrate reset  # Development only!
npm run prisma:migrate
```

### Port Already in Use
Edit `.env` and change `PORT` to a different number (e.g., 5001)

## 📦 Deployment

### Prepare for production:
```bash
# Install production dependencies
npm install --production

# Build TypeScript
npm run build

# Run production server
npm start
```

### Deploy to Supabase (PostgreSQL):
1. Create Supabase project at https://supabase.com
2. Update `DATABASE_URL` with Supabase connection string
3. Run migrations: `npm run prisma:migrate`
4. Deploy application

### Environment variables for production:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[db]
FRONTEND_URL=https://yourdomain.com
```

## 🚦 Health Check

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2025-01-26T10:00:00.000Z"
}
```

## 📚 Additional Resources

- [Express Documentation](https://expressjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Jest Testing Framework](https://jestjs.io)
- [Supertest](https://github.com/visionmedia/supertest)

## 📄 License

This project is part of Fleet Management System. All rights reserved.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review test files for usage examples
3. Check Prisma schema for database structure
4. Review API response format documentation

---

**Version:** 1.0.0  
**Last Updated:** January 2025
