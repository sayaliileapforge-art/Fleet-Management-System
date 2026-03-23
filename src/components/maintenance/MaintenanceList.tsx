import { useState, useEffect } from 'react';
import { Plus, Search, X, CheckCircle } from 'lucide-react';
import { vehicleService } from '../../services/supabase';

interface MaintenanceRecord {
  id: string;
  date: string;
  vehicle: string;
  type: string;
  vendor: string;
  cost: number;
  status: 'Scheduled' | 'Completed';
  nextDue: string;
}

export function MaintenanceList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicle: '',
    vehicleId: '',
    type: 'Oil Change',
    vendor: '',
    cost: '',
    status: 'Scheduled' as const,
    nextDue: '',
  });

  // Load maintenance records from localStorage on mount
  useEffect(() => {
    console.log('🔍 Loading maintenance records from localStorage...');
    try {
      const saved = localStorage.getItem('maintenanceRecords');
      console.log('📦 Saved data:', saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('✅ Loaded records:', parsed);
        setMaintenance(parsed);
      } else {
        console.log('ℹ️ No saved records found');
      }
    } catch (error) {
      console.error('❌ Error loading records:', error);
    }
    
    // Load vehicles from database
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      console.log('📥 Loading vehicles from database...');
      const vehiclesData = await vehicleService.getAll();
      setVehicles(vehiclesData || []);
      console.log('✅ Vehicles loaded:', vehiclesData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading vehicles:', error);
    }
  };

  // Save maintenance records to localStorage whenever they change
  useEffect(() => {
    console.log('💾 Saving maintenance records:', maintenance);
    try {
      localStorage.setItem('maintenanceRecords', JSON.stringify(maintenance));
      console.log('✅ Records saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving records:', error);
    }
  }, [maintenance]);

  const handleAddMaintenance = async () => {
    console.log('📝 Adding maintenance record with data:', formData);
    
    if (!formData.vehicleId || !formData.vendor.trim() || !formData.cost) {
      alert('⚠️ Please fill in all required fields:\n- Vehicle\n- Vendor\n- Cost');
      return;
    }

    if (isNaN(parseFloat(formData.cost))) {
      alert('⚠️ Cost must be a valid number');
      return;
    }

    const newRecord: MaintenanceRecord = {
      id: `MT-${Date.now()}`,
      date: formData.date,
      vehicle: formData.vehicle.trim(),
      type: formData.type,
      vendor: formData.vendor.trim(),
      cost: parseFloat(formData.cost),
      status: formData.status,
      nextDue: formData.nextDue,
    };

    console.log('✅ New record created:', newRecord);
    
    setMaintenance([...maintenance, newRecord]);
    
    // Update vehicle status to 'Maintenance' in database
    if (formData.vehicleId) {
      try {
        console.log('🔄 Updating vehicle status to Maintenance for:', formData.vehicleId);
        const result = await vehicleService.update(formData.vehicleId, { status: 'Maintenance' });
        console.log('✅ Vehicle status updated to Maintenance:', result);
        // Reload vehicles to reflect the change
        await loadVehicles();
      } catch (error) {
        console.error('❌ Error updating vehicle status:', error);
        alert('Warning: Maintenance record added but failed to update vehicle status. Error: ' + error);
      }
    } else {
      console.warn('⚠️ No vehicleId provided, cannot update vehicle status');
    }
    
    setSuccessMessage(`✅ Maintenance record for ${formData.vehicle} added successfully! Vehicle status updated.`);
    setTimeout(() => setSuccessMessage(''), 3000);
    
    setFormData({
      date: new Date().toISOString().split('T')[0],
      vehicle: '',
      vehicleId: '',
      type: 'Oil Change',
      vendor: '',
      cost: '',
      status: 'Scheduled',
      nextDue: '',
    });
    setShowForm(false);
  };

  const handleDeleteMaintenance = (id: string) => {
    console.log('🗑️ Deleting record:', id);
    setMaintenance(maintenance.filter(m => m.id !== id));
  };

  // Filter maintenance records to only show vehicles currently in Maintenance status
  const filteredMaintenance = maintenance.filter(m => {
    // First check if matches search
    const matchesSearch = m.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Then check if vehicle is currently in Maintenance status
    const vehicle = vehicles.find(v => v.vehicleNo === m.vehicle);
    
    // Only show maintenance records for vehicles that are currently in 'Maintenance' status
    // or if the maintenance record is already 'Completed'
    return m.status === 'Completed' || (vehicle && vehicle.status === 'Maintenance');
  });

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Maintenance & Service</h1>
          <p className="text-gray-600 mt-1">Track vehicle maintenance and service records</p>
          {vehicles.filter(v => v.status === 'Maintenance').length > 0 && (
            <p className="text-sm text-orange-600 mt-1">
              {vehicles.filter(v => v.status === 'Maintenance').length} vehicle(s) currently in maintenance: {' '}
              {vehicles.filter(v => v.status === 'Maintenance').map(v => v.vehicleNo).join(', ')}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Service Record
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Maintenance</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{filteredMaintenance.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Cost (MTD)</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">₹{filteredMaintenance.reduce((sum, m) => sum + m.cost, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Scheduled</p>
          <p className="text-2xl font-semibold text-orange-600 mt-1">{filteredMaintenance.filter(m => m.status === 'Scheduled').length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">{filteredMaintenance.filter(m => m.status === 'Completed').length}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vehicle or service type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Modal for Adding Maintenance */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add Service Record</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => {
                    const selectedVehicle = vehicles.find(v => v.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      vehicleId: e.target.value,
                      vehicle: selectedVehicle ? selectedVehicle.vehicleNo : ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.filter(v => v.status === 'Maintenance').map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicleNo} - {vehicle.type}
                    </option>
                  ))}
                  {vehicles.filter(v => v.status === 'Maintenance').length === 0 && (
                    <option disabled>No vehicles in Maintenance status</option>
                  )}
                </select>
                {vehicles.filter(v => v.status === 'Maintenance').length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">Note: Only vehicles with "Maintenance" status can have service records added.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option>Oil Change</option>
                  <option>Filter Replacement</option>
                  <option>Brake Service</option>
                  <option>Tire Rotation</option>
                  <option>Battery Check</option>
                  <option>Engine Check</option>
                  <option>Suspension Service</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                <input
                  type="text"
                  placeholder="e.g., XYZ Service Center"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹) *</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Scheduled' | 'Completed' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
                <input
                  type="date"
                  value={formData.nextDue}
                  onChange={(e) => setFormData({ ...formData, nextDue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMaintenance}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Service Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Next Due</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMaintenance.length > 0 ? (
                filteredMaintenance.map((mnt) => (
                  <tr key={mnt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{mnt.id}</td>
                    <td className="px-6 py-4 text-gray-600">{mnt.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{mnt.vehicle}</td>
                    <td className="px-6 py-4 text-gray-900">{mnt.type}</td>
                    <td className="px-6 py-4 text-gray-600">{mnt.vendor}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{mnt.cost.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        mnt.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {mnt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{mnt.nextDue || '-'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteMaintenance(mnt.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    {maintenance.length === 0 
                      ? 'No maintenance records yet. Click "Add Service Record" to get started.' 
                      : searchTerm 
                        ? 'No records match your search.'
                        : 'No scheduled maintenance for vehicles currently in Maintenance status. Move a vehicle to Maintenance status to schedule service.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
