import { useState, useEffect } from 'react';
import { Plus, Search, X, Trash2 } from 'lucide-react';
import { supabase, tripService, loadService, customerService } from '../../services/supabase';

interface Load {
  id: string;
  tripId: string;
  material: string;
  weight: string;
  from: string;
  to: string;
  status: string;
  pod: string;
  createdAt: string;
}

export function LoadsList() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    tripId: '',
    consignorId: '',
    consigneeId: '',
    material: '',
    weight: '',
    from: '',
    to: '',
    status: 'In Transit',
    pod: 'Pending'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [loadsData, tripsData, customersData] = await Promise.all([
        supabase.from('Load').select('*').order('createdAt', { ascending: false }),
        tripService.getAll(),
        customerService.getAll()
      ]);
      
      setLoads(loadsData.data || []);
      setTrips(tripsData || []);
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error loading loads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLoad = async (id: string, material: string) => {
    if (!confirm(`Are you sure you want to delete load "${material}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await loadService.delete(id);
      alert('Load deleted successfully!');
      await loadData();
    } catch (error) {
      console.error('Error deleting load:', error);
      alert('Failed to delete load. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoad = async () => {
    try {
      await loadService.create({
        tripId: formData.tripId,
        consignorId: formData.consignorId,
        consigneeId: formData.consigneeId,
        material: formData.material,
        weight: formData.weight,
        from: formData.from,
        to: formData.to,
        status: formData.status,
        pod: formData.pod
      });

      await loadData();
      setFormData({
        tripId: '',
        consignorId: '',
        consigneeId: '',
        material: '',
        weight: '',
        from: '',
        to: '',
        status: 'In Transit',
        pod: 'Pending'
      });
      setShowAddModal(false);
      alert('Load created successfully!');
    } catch (error) {
      console.error('Error creating load:', error);
      alert('Failed to create load. Please try again.');
    }
  };

  const filteredLoads = loads.filter(load =>
    load.material?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    load.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    load.to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCustomerName(load.consignorId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCustomerName(load.consigneeId)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerName = (customerId: string | null | undefined) => {
    if (!customerId) return '-';
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Loads & Shipment Tracking</h1>
          <p className="text-gray-600 mt-1">Track shipments and manage proof of delivery</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Load
        </button>
      </div>

      {/* Add Load Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create New Load</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trip (Optional)</label>
                <select
                  value={formData.tripId}
                  onChange={(e) => setFormData({...formData, tripId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Trip</option>
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>{trip.route || trip.id}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consignor</label>
                  <select
                    value={formData.consignorId}
                    onChange={(e) => setFormData({...formData, consignorId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Consignor</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consignee</label>
                  <select
                    value={formData.consigneeId}
                    onChange={(e) => setFormData({...formData, consigneeId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Consignee</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({...formData, material: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Steel, Cement, Electronics"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 10 tons"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From *</label>
                  <input
                    type="text"
                    value={formData.from}
                    onChange={(e) => setFormData({...formData, from: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Origin"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
                  <input
                    type="text"
                    value={formData.to}
                    onChange={(e) => setFormData({...formData, to: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Destination"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">POD Status</label>
                  <select
                    value={formData.pod}
                    onChange={(e) => setFormData({...formData, pod: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLoad}
                disabled={!formData.material || !formData.from || !formData.to}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Load
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Loads</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{loads.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">In Transit</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">{loads.filter(l => l.status === 'In Transit').length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Delivered</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">{loads.filter(l => l.status === 'Delivered').length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">POD Pending</p>
          <p className="text-2xl font-semibold text-orange-600 mt-1">{loads.filter(l => l.pod === 'Pending').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search loads..."
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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Load ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trip</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Consignor</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Consignee</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Material</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Weight</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">From</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">To</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">POD</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLoads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                    {loading ? 'Loading...' : 'No loads found. Click "Create Load" to add one.'}
                  </td>
                </tr>
              ) : (
                filteredLoads.map((load) => (
                  <tr key={load.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{load.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-gray-600">{load.tripId ? load.tripId.slice(0, 8) + '...' : '-'}</td>
                    <td className="px-6 py-4 text-gray-900">{getCustomerName(load.consignorId)}</td>
                    <td className="px-6 py-4 text-gray-900">{getCustomerName(load.consigneeId)}</td>
                    <td className="px-6 py-4 text-gray-900">{load.material}</td>
                    <td className="px-6 py-4 text-gray-600">{load.weight}</td>
                    <td className="px-6 py-4 text-gray-600">{load.from}</td>
                    <td className="px-6 py-4 text-gray-600">{load.to}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        load.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                        load.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {load.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        load.pod === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {load.pod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleDeleteLoad(load.id, load.material)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Load"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
