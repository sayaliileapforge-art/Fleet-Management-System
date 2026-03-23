# Frontend Integration Guide

This guide explains how to integrate the backend API into your React components.

## 🔧 Setup

### 1. Install axios (if not already installed)

```bash
npm install axios
```

### 2. Environment Variables

Add to `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. API Service Layer

All API calls are centralized in `/src/services/`. Each service file exports:
- Type definitions
- Service methods for CRUD operations

```typescript
// src/services/vehicle.service.ts
import { vehicleService } from '@/services/vehicle.service';
```

## 📚 Usage Examples

### Vehicles Service

```typescript
import { vehicleService } from '@/services/vehicle.service';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

function VehicleComponent() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all vehicles
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async (page = 1, limit = 10, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await vehicleService.getAllVehicles(page, limit, status);
      setVehicles(response.data.vehicles);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vehicles');
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  // Create vehicle
  const handleCreateVehicle = async (formData: any) => {
    try {
      const newVehicle = await vehicleService.createVehicle(formData);
      setVehicles([newVehicle.data, ...vehicles]);
      toast.success('Vehicle created successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create vehicle');
    }
  };

  // Update vehicle
  const handleUpdateVehicle = async (id: string, formData: any) => {
    try {
      const updated = await vehicleService.updateVehicle(id, formData);
      setVehicles(vehicles.map(v => v.id === id ? updated.data : v));
      toast.success('Vehicle updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update vehicle');
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async (id: string) => {
    try {
      await vehicleService.deleteVehicle(id);
      setVehicles(vehicles.filter(v => v.id !== id));
      toast.success('Vehicle deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete vehicle');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      {vehicles.map(vehicle => (
        <div key={vehicle.id}>
          {vehicle.vehicleNo} - {vehicle.name}
          <button onClick={() => handleDeleteVehicle(vehicle.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Drivers Service

```typescript
import { driverService } from '@/services/driver.service';

// Get all drivers
const response = await driverService.getAllDrivers(page, limit, status);
const drivers = response.data.drivers;

// Create driver
const newDriver = await driverService.createDriver({
  name: 'John Doe',
  phone: '+91 98765 43210',
  license: 'DL-1234567890',
});

// Update driver
await driverService.updateDriver(driverId, {
  status: 'Active',
  rating: 4.8,
});

// Delete driver
await driverService.deleteDriver(driverId);
```

### Trips Service

```typescript
import { tripService } from '@/services/trip.service';

// Get all trips with filters
const response = await tripService.getAllTrips(
  page,
  limit,
  'Completed', // status
  vehicleId,
  driverId
);

// Create trip
const trip = await tripService.createTrip({
  vehicleId: 'vehicle-id',
  driverId: 'driver-id',
  customerId: 'customer-id',
  route: 'Mumbai → Delhi',
  distance: '1400 km',
  startDate: new Date().toISOString(),
  revenue: 25000,
  expense: 16500,
});

// Update trip status
await tripService.updateTrip(tripId, {
  status: 'Completed',
  endDate: new Date().toISOString(),
});
```

### Expenses Service

```typescript
import { expenseService } from '@/services/expense.service';

// Get expenses by category
const response = await expenseService.getAllExpenses(page, limit, 'Fuel');

// Create expense
const expense = await expenseService.createExpense({
  vehicleId: 'vehicle-id',
  tripId: 'trip-id',
  category: 'Fuel',
  amount: 5000,
});

// Update expense
await expenseService.updateExpense(expenseId, {
  amount: 5500,
  category: 'Maintenance',
});
```

### Dashboard Service

```typescript
import { dashboardService } from '@/services/dashboard.service';

// Get dashboard stats
const stats = await dashboardService.getStats();
console.log(stats.data.financials.totalRevenue);

// Get revenue trend
const revenueData = await dashboardService.getRevenueByMonth();

// Get expense breakdown
const expenses = await dashboardService.getExpenseByCategory();

// Get top vehicles
const topVehicles = await dashboardService.getTopVehicles();

// Get top drivers
const topDrivers = await dashboardService.getTopDrivers();
```

## 🎯 Complete Component Example: Vehicles List

Here's a complete updated VehiclesList component with API integration:

```typescript
import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, AlertCircle } from 'lucide-react';
import { vehicleService } from '@/services/vehicle.service';
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  vehicleNo: string;
  type: string;
  model: string;
  capacity: string;
  fuelType: string;
  status: 'Active' | 'Maintenance' | 'Idle' | 'Deployed';
  licenseExpiry: string;
  insuranceExpiry: string;
  totalTrips: number;
  totalRevenue: number;
}

interface VehiclesListProps {
  onViewDetail: (id: string) => void;
}

export function VehiclesList({ onViewDetail }: VehiclesListProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch vehicles on component mount and when filters change
  useEffect(() => {
    fetchVehicles();
  }, [page, statusFilter]);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await vehicleService.getAllVehicles(
        page,
        10,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      
      setVehicles(response.data.vehicles);
      setTotalPages(response.data.pagination.pages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vehicles');
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (formData: any) => {
    try {
      await vehicleService.createVehicle(formData);
      toast.success('Vehicle created successfully');
      setShowAddModal(false);
      fetchVehicles(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || 'Failed to create vehicle');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await vehicleService.deleteVehicle(id);
        toast.success('Vehicle deleted successfully');
        fetchVehicles(); // Refresh list
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete vehicle');
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await vehicleService.updateVehicle(id, { status: newStatus });
      toast.success('Vehicle status updated');
      fetchVehicles(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || 'Failed to update vehicle');
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    return vehicle.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
           vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Deployed': return 'bg-blue-100 text-blue-700';
      case 'Maintenance': return 'bg-orange-100 text-orange-700';
      case 'Idle': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (error && vehicles.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <div>
          <p className="text-red-700 font-medium">Error Loading Vehicles</p>
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={fetchVehicles}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Vehicles Management</h1>
          <p className="text-gray-600 mt-1">Manage your fleet vehicles and track their status</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          <Plus className="w-5 h-5" />
          Add Vehicle
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Vehicles</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{vehicles.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {vehicles.filter(v => v.status === 'Active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Deployed</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">
            {vehicles.filter(v => v.status === 'Deployed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Maintenance</p>
          <p className="text-2xl font-semibold text-orange-600 mt-1">
            {vehicles.filter(v => v.status === 'Maintenance').length}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by vehicle number or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Deployed">Deployed</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Idle">Idle</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && vehicles.length === 0 && (
        <div className="text-center py-8">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="mt-2 text-gray-600">Loading vehicles...</p>
        </div>
      )}

      {/* Vehicles Table */}
      {!loading && filteredVehicles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vehicle No</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Model</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Trips</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{vehicle.vehicleNo}</td>
                    <td className="px-6 py-4 text-gray-700">{vehicle.type}</td>
                    <td className="px-6 py-4 text-gray-700">{vehicle.model}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{vehicle.totalTrips}</td>
                    <td className="px-6 py-4 text-gray-700">₹{vehicle.totalRevenue.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewDetail(vehicle.id)}
                          className="p-2 hover:bg-gray-100 rounded text-blue-600"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="p-2 hover:bg-gray-100 rounded text-red-600"
                          title="Delete vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && filteredVehicles.length === 0 && vehicles.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No vehicles match your search criteria
        </div>
      )}

      {/* Empty State */}
      {!loading && vehicles.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-gray-500">No vehicles added yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create your first vehicle
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

## 🎨 Error Handling Pattern

```typescript
try {
  const response = await vehicleService.someMethod();
  // Handle success
} catch (error: any) {
  // Handle error
  if (error.statusCode === 404) {
    toast.error('Resource not found');
  } else if (error.statusCode === 409) {
    toast.error('Resource already exists');
  } else if (error.statusCode === 400) {
    toast.error(error.message);
  } else {
    toast.error('An error occurred');
  }
}
```

## 🔄 Loading and State Management Pattern

```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await service.getAll();
    setData(response.data);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

## 📝 Testing API Integration

```typescript
// Example test
describe('VehiclesList with API', () => {
  it('should fetch and display vehicles from API', async () => {
    render(<VehiclesList onViewDetail={jest.fn()} />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Total Vehicles/)).toBeInTheDocument();
    });
  });
});
```

## ✅ Checklist for Integration

- [ ] Backend server running (`npm run dev` in backend/)
- [ ] Database configured and migrated
- [ ] Frontend .env file has `VITE_API_URL=http://localhost:5000/api`
- [ ] Services imported in components
- [ ] Loading and error states implemented
- [ ] API calls made on component mount
- [ ] Forms submit to API endpoints
- [ ] Table refresh after mutations
- [ ] Toast notifications for feedback
- [ ] Tests updated with API mocks

## 🚀 Next Steps

1. Update remaining components (Trips, Drivers, Expenses, etc.) using the same pattern
2. Add form components for creating/editing entities
3. Implement modal dialogs for CRUD operations
4. Add data validation on frontend
5. Implement authentication when ready
6. Add real-time updates with WebSockets if needed
7. Deploy frontend and backend

---

For more details, see the backend README at `backend/README.md`
