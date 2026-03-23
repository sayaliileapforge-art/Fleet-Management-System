import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, AlertCircle, X } from 'lucide-react';
import { vehicleService } from '../../services/supabase';

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

const mockVehicles: Vehicle[] = [];

export function VehiclesList({ onViewDetail }: VehiclesListProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('');
  const [formData, setFormData] = useState({
    vehicleNo: '',
    type: 'Heavy Truck',
    model: '',
    capacity: '',
    fuelType: 'Diesel',
    status: 'Active',
    licenseExpiry: '',
    insuranceExpiry: '',
  });

  // Load vehicles from Supabase on mount
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getAll();
      setVehicles(data as Vehicle[]);
    } catch (error) {
      console.error('❌ Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    
    // Format dates for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };
    
    setFormData({
      vehicleNo: vehicle.vehicleNo,
      type: vehicle.type,
      model: vehicle.model,
      capacity: vehicle.capacity,
      fuelType: vehicle.fuelType,
      status: vehicle.status,
      licenseExpiry: formatDateForInput(vehicle.licenseExpiry),
      insuranceExpiry: formatDateForInput(vehicle.insuranceExpiry),
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      await vehicleService.delete(id);
      alert('Vehicle deleted successfully!');
      await loadVehicles();
    } catch (error) {
      console.error('❌ Error deleting vehicle:', error);
      alert('Error deleting vehicle: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleAddVehicle = async () => {
    if (!formData.vehicleNo || !formData.model || !formData.capacity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      if (editingId) {
        // For updates, only send the fields that should be updated
        const updatePayload = {
          vehicleNo: formData.vehicleNo,
          name: formData.model,
          type: formData.type,
          model: formData.model,
          capacity: formData.capacity,
          fuelType: formData.fuelType,
          status: formData.status,
          licenseExpiry: formData.licenseExpiry ? new Date(formData.licenseExpiry).toISOString() : null,
          insuranceExpiry: formData.insuranceExpiry ? new Date(formData.insuranceExpiry).toISOString() : null,
        };
        
        await vehicleService.update(editingId, updatePayload);
        alert('Vehicle updated successfully!');
      } else {
        // For new vehicles, include all fields
        const createPayload = {
          vehicleNo: formData.vehicleNo,
          name: formData.model,
          type: formData.type,
          model: formData.model,
          capacity: formData.capacity,
          fuelType: formData.fuelType,
          status: formData.status,
          licenseExpiry: formData.licenseExpiry ? new Date(formData.licenseExpiry).toISOString() : null,
          insuranceExpiry: formData.insuranceExpiry ? new Date(formData.insuranceExpiry).toISOString() : null,
          totalTrips: 0,
          totalRevenue: 0,
        };
        
        await vehicleService.create(createPayload);
        alert('Vehicle added successfully!');
      }

      setShowAddModal(false);
      setEditingId(null);
      setFormData({
        vehicleNo: '',
        type: 'Heavy Truck',
        model: '',
        capacity: '',
        fuelType: 'Diesel',
        status: 'Active',
        licenseExpiry: '',
        insuranceExpiry: '',
      });
      
      // Force reload vehicles to reflect changes
      await loadVehicles();
    } catch (error) {
      console.error('❌ Error saving vehicle:', error);
      alert('Error saving vehicle: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    const matchesType = !typeFilter || vehicle.type === typeFilter;
    const matchesFuelType = !fuelTypeFilter || vehicle.fuelType === fuelTypeFilter;
    return matchesSearch && matchesStatus && matchesType && matchesFuelType;
  });

  const handleExport = () => {
    const headers = ['Vehicle No', 'Type', 'Model', 'Capacity', 'Fuel Type', 'Status', 'License Expiry', 'Insurance Expiry', 'Total Trips', 'Total Revenue'];
    const csvContent = [
      headers.join(','),
      ...filteredVehicles.map(vehicle => [
        vehicle.vehicleNo,
        vehicle.type,
        vehicle.model,
        vehicle.capacity,
        vehicle.fuelType,
        vehicle.status,
        vehicle.licenseExpiry || '',
        vehicle.insuranceExpiry || '',
        vehicle.totalTrips || 0,
        vehicle.totalRevenue || 0
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vehicles_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('');
    setFuelTypeFilter('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Deployed': return 'bg-blue-100 text-blue-700';
      case 'Maintenance': return 'bg-orange-100 text-orange-700';
      case 'Idle': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isExpiringNear = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date < today;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Vehicles Management</h1>
          <p className="text-gray-600 mt-1">Manage your fleet vehicles and track their status</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              vehicleNo: '',
              type: 'Heavy Truck',
              model: '',
              capacity: '',
              fuelType: 'Diesel',
              status: 'Active',
              licenseExpiry: '',
              insuranceExpiry: '',
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
          <p className="text-sm text-gray-600">In Maintenance</p>
          <p className="text-2xl font-semibold text-orange-600 mt-1">
            {vehicles.filter(v => v.status === 'Maintenance').length}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
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
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Deployed">Deployed</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Idle">Idle</option>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Types</option>
                  <option value="Heavy Truck">Heavy Truck</option>
                  <option value="Light Truck">Light Truck</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Container">Container</option>
                  <option value="Tanker">Tanker</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                <select
                  value={fuelTypeFilter}
                  onChange={(e) => setFuelTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Fuel Types</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Petrol">Petrol</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Loading vehicles...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No vehicles found</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type & Model</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{vehicle.vehicleNo}</p>
                      <p className="text-sm text-gray-500">{vehicle.fuelType}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900">{vehicle.type}</p>
                      <p className="text-sm text-gray-500">{vehicle.model}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{vehicle.capacity}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs">
                        {isExpired(vehicle.licenseExpiry) ? (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        ) : isExpiringNear(vehicle.licenseExpiry) ? (
                          <AlertCircle className="w-3 h-3 text-orange-500" />
                        ) : null}
                        <span className={isExpired(vehicle.licenseExpiry) ? 'text-red-600' : isExpiringNear(vehicle.licenseExpiry) ? 'text-orange-600' : 'text-gray-600'}>
                          License: {vehicle.licenseExpiry}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {isExpired(vehicle.insuranceExpiry) ? (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        ) : isExpiringNear(vehicle.insuranceExpiry) ? (
                          <AlertCircle className="w-3 h-3 text-orange-500" />
                        ) : null}
                        <span className={isExpired(vehicle.insuranceExpiry) ? 'text-red-600' : isExpiringNear(vehicle.insuranceExpiry) ? 'text-orange-600' : 'text-gray-600'}>
                          Insurance: {vehicle.insuranceExpiry}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900">{vehicle.totalTrips} trips</p>
                      <p className="text-sm text-green-600">₹{vehicle.totalRevenue.toLocaleString()}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewDetail(vehicle.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(vehicle)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors" 
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(vehicle.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" 
                        title="Delete"
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
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                  <input 
                    type="text" 
                    name="vehicleNo"
                    value={formData.vehicleNo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="TRK-008" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select 
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Heavy Truck</option>
                    <option>Medium Truck</option>
                    <option>Light Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input 
                    type="text" 
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Tata Prima 4038" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input 
                    type="text" 
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="40 tons" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                  <select 
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Diesel</option>
                    <option>Petrol</option>
                    <option>CNG</option>
                    <option>Electric</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Active</option>
                    <option>Idle</option>
                    <option>Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry</label>
                  <input 
                    type="date" 
                    name="licenseExpiry"
                    value={formData.licenseExpiry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry</label>
                  <input 
                    type="date" 
                    name="insuranceExpiry"
                    value={formData.insuranceExpiry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                  setFormData({
                    vehicleNo: '',
                    type: 'Heavy Truck',
                    model: '',
                    capacity: '',
                    fuelType: 'Diesel',
                    status: 'Active',
                    licenseExpiry: '',
                    insuranceExpiry: '',
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button onClick={handleAddVehicle} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {editingId ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
