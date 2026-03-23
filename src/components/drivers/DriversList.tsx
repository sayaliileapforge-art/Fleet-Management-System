import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { driverService } from '../../services/supabase';

const mockDrivers = [];

export function DriversList() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license: '',
    licenseExpiry: '',
    experience: '',
    status: 'Active',
    rating: 4.5,
  });

  // Load drivers on mount
  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      
      const driversData = await driverService.getAll();
      setDrivers(driversData || []);
    } catch (error) {
      console.error('❌ Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async () => {
    try {
      console.log('📤 [DRIVERS] Creating driver...', formData);
      
      const driverData = {
        name: formData.name,
        phone: formData.phone,
        license: formData.license,
        licenseExpiry: formData.licenseExpiry,
        experience: formData.experience,
        status: formData.status,
      };

      await driverService.create(driverData);
      
      console.log('✅ [DRIVERS] Driver created successfully!');
      
      // Reload drivers
      await loadDrivers();
      
      // Reset form and close modal
      setFormData({
        name: '',
        phone: '',
        license: '',
        licenseExpiry: '',
        experience: '',
        status: 'Active',
        rating: 4.5,
      });
      setShowAddModal(false);
      
      alert('Driver added successfully!');
    } catch (error) {
      console.error('❌ [DRIVERS CREATE ERROR]', error);
      alert('Failed to add driver. Please try again.');
    }
  };

  const handleEditDriver = (driver: any) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      license: driver.license || '',
      licenseExpiry: driver.licenseExpiry || '',
      experience: driver.experience || '',
      status: driver.status || 'Active',
      rating: driver.rating || 4.5,
    });
    setShowEditModal(true);
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver) return;
    
    try {
      console.log('📤 [DRIVERS] Updating driver...', formData);
      
      const driverData = {
        name: formData.name,
        phone: formData.phone,
        license: formData.license,
        licenseExpiry: formData.licenseExpiry,
        experience: formData.experience,
        status: formData.status,
        rating: parseFloat(formData.rating.toString()) || 4.5,
      };

      await driverService.update(editingDriver.id, driverData);
      
      console.log('✅ [DRIVERS] Driver updated successfully!');
      
      // Reload drivers
      await loadDrivers();
      
      // Reset form and close modal
      setFormData({
        name: '',
        phone: '',
        license: '',
        licenseExpiry: '',
        experience: '',
        status: 'Active',
        rating: 4.5,
      });
      setEditingDriver(null);
      setShowEditModal(false);
      
      alert('Driver updated successfully!');
    } catch (error) {
      console.error('❌ [DRIVERS UPDATE ERROR]', error);
      alert('Failed to update driver. Please try again.');
    }
  };

  const handleDeleteDriver = async (id: string, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete driver "${name}"? This action cannot be undone.`);
    
    if (!confirmed) return;
    
    try {
      await driverService.delete(id);
      await loadDrivers();
      alert('Driver deleted successfully!');
    } catch (error) {
      console.error('❌ [DRIVERS DELETE ERROR]', error);
      alert('Failed to delete driver. The driver may be assigned to active trips.');
    }
  };

  const filteredDrivers = drivers.filter(driver => 
    driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.license?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.status === 'Active').length;
  const onTripDrivers = drivers.filter(d => d.status === 'On Trip').length;
  const avgRating = drivers.length > 0 
    ? (drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.length).toFixed(1)
    : 'NaN';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Drivers & Staff</h1>
          <p className="text-gray-600 mt-1">Manage drivers and track their performance</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Driver
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Drivers</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{totalDrivers}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">{activeDrivers}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">On Trip</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">{onTripDrivers}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Avg Rating</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{avgRating} ⭐</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">License</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">License Expiry</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Experience</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Trips</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="inline-flex items-center gap-2 text-gray-600">
                        <div className="animate-spin w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                        Loading drivers...
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredDrivers.length > 0 ? (
                filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{driver.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{driver.name}</td>
                    <td className="px-6 py-4 text-gray-600">{driver.phone}</td>
                    <td className="px-6 py-4 text-gray-600">{driver.license}</td>
                    <td className="px-6 py-4 text-gray-600">{driver.licenseExpiry}</td>
                    <td className="px-6 py-4 text-gray-600">{driver.experience}</td>
                    <td className="px-6 py-4 text-gray-900">{driver.totalTrips || 0}</td>
                    <td className="px-6 py-4 font-medium text-green-600">{driver.rating || 0} ⭐</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        driver.status === 'Active' ? 'bg-green-100 text-green-700' :
                        driver.status === 'On Trip' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {driver.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditDriver(driver)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          title="Edit Driver"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDriver(driver.id, driver.name)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Delete Driver"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium mb-1">No drivers found</p>
                      <p className="text-sm">Add your first driver to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Driver</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input 
                    type="text" 
                    placeholder="DL-1234567890"
                    value={formData.license}
                    onChange={(e) => setFormData({...formData, license: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry</label>
                  <input 
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                  <input 
                    type="text" 
                    placeholder="5 years"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
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
                    <option value="Active">Active</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-5)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="5"
                    step="0.1"
                    placeholder="4.5"
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
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
                onClick={handleAddDriver}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {showEditModal && editingDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Driver</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input 
                    type="text" 
                    placeholder="DL-1234567890"
                    value={formData.license}
                    onChange={(e) => setFormData({...formData, license: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry</label>
                  <input 
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                  <input 
                    type="text" 
                    placeholder="5 years"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
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
                    <option value="Active">Active</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-5)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="5"
                    step="0.1"
                    placeholder="4.5"
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDriver(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateDriver}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Driver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
