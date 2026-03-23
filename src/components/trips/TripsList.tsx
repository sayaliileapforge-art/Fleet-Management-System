import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Eye, MapPin, X, Trash2 } from 'lucide-react';
import { tripService, vehicleService, driverService, customerService, routeService } from '../../services/supabase';

interface Trip {
  id: string;
  tripNo: string;
  vehicle: string;
  driver: string;
  customer: string;
  route: string;
  distance: string;
  startDate: string;
  endDate: string;
  status: 'Planned' | 'Running' | 'Completed' | 'Cancelled';
  revenue: number;
  expense: number;
  profit: number;
}

interface TripsListProps {
  onViewDetail: (id: string) => void;
}

const mockTrips: Trip[] = [];

export function TripsList({ onViewDetail }: TripsListProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [formData, setFormData] = useState({
    vehicle: '',
    driver: '',
    customer: '',
    route: '',
    routeId: '',
    distance: '',
    startDate: '',
    shipmentType: '',
    loadCapacity: '',
    revenue: '',
    status: 'Running',
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [tripsData, vehiclesData, driversData, customersData, routesData] = await Promise.all([
        tripService.getAll(),
        vehicleService.getAll(),
        driverService.getAll(),
        customerService.getAll(),
        routeService.getAll()
      ]);
      
      // Transform trips data to match UI interface
      const transformedTrips = (tripsData || []).map((trip: any, index: number) => {
        // Look up related entities
        const vehicleData = (vehiclesData || []).find((v: any) => v.id === trip.vehicleId);
        const driverData = (driversData || []).find((d: any) => d.id === trip.driverId);
        const customerData = (customersData || []).find((c: any) => c.id === trip.customerId);

        return {
          id: trip.id,
          tripNo: `TRP-${String(index + 1).padStart(3, '0')}`,
          vehicle: vehicleData?.vehicleNo || vehicleData?.name || 'N/A',
          driver: driverData?.name || 'N/A',
          customer: customerData?.name || 'N/A',
          route: trip.route || '',
          distance: trip.distance || '0 km',
          startDate: trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          endDate: trip.endDate ? new Date(trip.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          status: trip.status || 'Planned',
          revenue: trip.revenue || 0,
          expense: trip.expense || 0,
          profit: (trip.revenue || 0) - (trip.expense || 0)
        };
      });

      setTrips(transformedTrips);
      setVehicles(vehiclesData || []);
      setDrivers(driversData || []);
      setCustomers(customersData || []);
      setRoutes(routesData || []);
    } catch (error) {
      console.error('❌ Error loading trips data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (id: string, tripNo: string) => {
    if (!confirm(`Are you sure you want to delete trip "${tripNo}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await tripService.delete(id);
      alert('Trip deleted successfully!');
      await loadData();
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async () => {
    try {
      console.log('📤 [TRIPS] Creating trip...', formData);
      
      const revenue = parseFloat(formData.revenue) || 0;
      const expense = 0;
      
      const tripData = {
        vehicleId: formData.vehicle,
        driverId: formData.driver,
        customerId: formData.customer || null,
        routeId: formData.routeId || null,
        route: formData.route,
        distance: formData.distance,
        startDate: formData.startDate,
        endDate: null,
        status: formData.status,
        revenue: revenue,
        expense: expense,
        profit: revenue - expense
      };

      await tripService.create(tripData);
      
      // Increment route trip count if route selected
      if (formData.routeId) {
        try {
          await routeService.incrementTripCount(formData.routeId);
        } catch (error) {
          console.warn('Failed to update route trip count:', error);
        }
      }
      
      console.log('✅ [TRIPS] Trip created successfully!');
      
      // Reload trips
      await loadData();
      
      // Reset form and close modal
      setFormData({
        vehicle: '',
        driver: '',
        customer: '',
        route: '',
        routeId: '',
        distance: '',
        startDate: '',
        shipmentType: '',
        loadCapacity: '',
        revenue: '',
        status: 'Running',
      });
      setShowAddModal(false);
      
      alert('Trip created successfully!');
    } catch (error) {
      console.error('❌ [TRIPS CREATE ERROR]', error);
      alert('Failed to create trip. Please try again.');
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    const matchesVehicle = !vehicleFilter || trip.vehicle.toLowerCase().includes(vehicleFilter.toLowerCase());
    const matchesCustomer = !customerFilter || trip.customer.toLowerCase().includes(customerFilter.toLowerCase());
    
    // Date filtering
    let matchesDateFrom = true;
    let matchesDateTo = true;
    if (dateFrom && trip.startDate) {
      const tripDate = new Date(trip.startDate);
      const filterDate = new Date(dateFrom);
      matchesDateFrom = tripDate >= filterDate;
    }
    if (dateTo && trip.startDate) {
      const tripDate = new Date(trip.startDate);
      const filterDate = new Date(dateTo);
      matchesDateTo = tripDate <= filterDate;
    }
    
    return matchesSearch && matchesStatus && matchesVehicle && matchesCustomer && matchesDateFrom && matchesDateTo;
  });

  const handleExport = () => {
    const headers = ['Trip ID', 'Route', 'Vehicle', 'Driver', 'Customer', 'Start Date', 'End Date', 'Status', 'Revenue', 'Expense', 'Profit'];
    const csvContent = [
      headers.join(','),
      ...filteredTrips.map(trip => [
        trip.tripNo,
        `"${trip.route}"`,
        trip.vehicle,
        trip.driver,
        trip.customer,
        trip.startDate,
        trip.endDate,
        trip.status,
        trip.revenue,
        trip.expense,
        trip.profit
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `trips_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setVehicleFilter('');
    setCustomerFilter('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Running': return 'bg-blue-100 text-blue-700';
      case 'Planned': return 'bg-gray-100 text-gray-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalRevenue = filteredTrips.reduce((sum, trip) => sum + trip.revenue, 0);
  const totalProfit = filteredTrips.reduce((sum, trip) => sum + trip.profit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Trips Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all your trips</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Trip
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Trips</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{filteredTrips.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Running</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">
            {filteredTrips.filter(t => t.status === 'Running').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Profit</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">₹{totalProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by trip ID, route, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="Planned">Planned</option>
              <option value="Running">Running</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button 
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${showMoreFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" />
              More Filters
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* More Filters Panel */}
        {showMoreFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Vehicles</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.vehicleNo || v.name}>{v.vehicleNo || v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Customers</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trip ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle / Driver</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="inline-flex items-center gap-2 text-gray-600">
                        <div className="animate-spin w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                        Loading trips...
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredTrips.length > 0 ? (
                filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{trip.tripNo}</p>
                        <p className="text-xs text-gray-500">{trip.distance}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{trip.route}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900">{trip.vehicle}</p>
                        <p className="text-xs text-gray-500">{trip.driver}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{trip.customer}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900">{trip.startDate}</p>
                        <p className="text-xs text-gray-500">to {trip.endDate}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">₹{trip.revenue.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-green-600">₹{trip.profit.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{trip.revenue > 0 ? ((trip.profit / trip.revenue) * 100).toFixed(1) : '0'}% margin</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewDetail(trip.id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrip(trip.id, trip.tripNo)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Trip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium mb-1">No trips found</p>
                      <p className="text-sm">Create your first trip to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Trip Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Trip</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                  <select 
                    value={formData.vehicle}
                    onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleNo} - {vehicle.type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                  <select 
                    value={formData.driver}
                    onChange={(e) => setFormData({...formData, driver: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select 
                    value={formData.customer}
                    onChange={(e) => setFormData({...formData, customer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                  <select 
                    value={formData.routeId}
                    onChange={(e) => {
                      const selectedRoute = routes.find(r => r.id === e.target.value);
                      setFormData({
                        ...formData, 
                        routeId: e.target.value,
                        route: selectedRoute ? `${selectedRoute.from} → ${selectedRoute.to}` : '',
                        distance: selectedRoute?.distance || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Route</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name} ({route.from} → {route.to}) - {route.distance}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Or create a custom route in Routes & Dispatching</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                  <input 
                    type="text" 
                    placeholder="Auto-filled from route" 
                    value={formData.distance}
                    onChange={(e) => setFormData({...formData, distance: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Load Capacity (tons)</label>
                  <input 
                    type="number" 
                    placeholder="20" 
                    value={formData.loadCapacity}
                    onChange={(e) => setFormData({...formData, loadCapacity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Type</label>
                  <input 
                    type="text" 
                    placeholder="e.g., General Cargo" 
                    value={formData.shipmentType}
                    onChange={(e) => setFormData({...formData, shipmentType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Charges (₹)</label>
                  <input 
                    type="number" 
                    placeholder="10000" 
                    value={formData.revenue}
                    onChange={(e) => setFormData({...formData, revenue: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Running">Running</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateTrip}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
