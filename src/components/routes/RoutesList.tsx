import { useState, useEffect } from 'react';
import { Plus, Search, X, Edit, Trash2 } from 'lucide-react';
import { supabase, routeService } from '../../services/supabase';

interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
  distance: string;
  avgTime: string;
  totalTrips: number;
  frequency: string;
  createdAt: string;
}

export function RoutesList() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [activeDispatchCount, setActiveDispatchCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    from: '',
    to: '',
    distance: '',
    avgTime: '',
    frequency: 'Medium'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load routes
      const { data: routesData, error: routesError } = await supabase
        .from('Route')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (routesError) throw routesError;
      setRoutes(routesData || []);
      
      // Load active trips to calculate active dispatches (Running status)
      const { data: tripsData, error: tripsError } = await supabase
        .from('Trip')
        .select('status')
        .eq('status', 'Running');
      
      if (!tripsError && tripsData) {
        setActiveDispatchCount(tripsData.length);
      } else {
        setActiveDispatchCount(0);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = async () => {
    try {
      const routeName = formData.name || `${formData.from} to ${formData.to}`;
      
      await routeService.create({
        name: routeName,
        from: formData.from,
        to: formData.to,
        distance: formData.distance,
        avgTime: formData.avgTime,
        totalTrips: 0,
        frequency: formData.frequency
      });

      await loadData();
      setFormData({
        name: '',
        from: '',
        to: '',
        distance: '',
        avgTime: '',
        frequency: 'Medium'
      });
      setShowAddModal(false);
      alert('Route created successfully!');
    } catch (error) {
      console.error('Error creating route:', error);
      alert('Failed to create route. Please try again.');
    }
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name || '',
      from: route.from || '',
      to: route.to || '',
      distance: route.distance || '',
      avgTime: route.avgTime || '',
      frequency: route.frequency || 'Medium'
    });
    setShowEditModal(true);
  };

  const handleUpdateRoute = async () => {
    if (!editingRoute) return;
    
    try {
      const routeName = formData.name || `${formData.from} to ${formData.to}`;
      
      await routeService.update(editingRoute.id, {
        name: routeName,
        from: formData.from,
        to: formData.to,
        distance: formData.distance,
        avgTime: formData.avgTime,
        frequency: formData.frequency
      });

      await loadData();
      setFormData({
        name: '',
        from: '',
        to: '',
        distance: '',
        avgTime: '',
        frequency: 'Medium'
      });
      setEditingRoute(null);
      setShowEditModal(false);
      alert('Route updated successfully!');
    } catch (error) {
      console.error('Error updating route:', error);
      alert('Failed to update route. Please try again.');
    }
  };

  const handleDeleteRoute = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete route "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await routeService.delete(id);
      await loadData();
      alert('Route deleted successfully!');
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Failed to delete route. The route may be assigned to active trips.');
    }
  };

  const filteredRoutes = routes.filter(route =>
    route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.to?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Routes & Dispatching</h1>
          <p className="text-gray-600 mt-1">Manage routes and track shipment assignments</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Route
        </button>
      </div>

      {/* Add Route Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Route</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route Name (Optional)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Mumbai-Pune Express"
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
                    placeholder="Origin city"
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
                    placeholder="Destination city"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distance</label>
                  <input
                    type="text"
                    value={formData.distance}
                    onChange={(e) => setFormData({...formData, distance: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., 150 km"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avg Time</label>
                  <input
                    type="text"
                    value={formData.avgTime}
                    onChange={(e) => setFormData({...formData, avgTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., 3 hours"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
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
                onClick={handleCreateRoute}
                disabled={!formData.from || !formData.to}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Route
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Routes</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{routes.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">High Frequency</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">{routes.filter(r => r.frequency === 'High').length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Trips</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{routes.reduce((sum, r) => sum + (r.totalTrips || 0), 0)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Active Dispatches</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">{activeDispatchCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search routes..."
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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Route ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Route Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Distance</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Trips</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {loading ? 'Loading...' : 'No routes found. Click "Add Route" to create one.'}
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{route.id?.slice(0, 8)}...</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{route.name}</td>
                    <td className="px-6 py-4 text-gray-600">{route.distance || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{route.avgTime || '-'}</td>
                    <td className="px-6 py-4 text-gray-900">{route.totalTrips || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        route.frequency === 'High' ? 'bg-green-100 text-green-700' :
                        route.frequency === 'Medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {route.frequency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditRoute(route)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          title="Edit Route"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoute(route.id, route.name)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Delete Route"
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

      {/* Edit Route Modal */}
      {showEditModal && editingRoute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Route</h2>
              <button onClick={() => {
                setShowEditModal(false);
                setEditingRoute(null);
              }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route Name (Optional)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Mumbai-Pune Express"
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
                    placeholder="Origin city"
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
                    placeholder="Destination city"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distance</label>
                  <input
                    type="text"
                    value={formData.distance}
                    onChange={(e) => setFormData({...formData, distance: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., 150 km"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avg Time</label>
                  <input
                    type="text"
                    value={formData.avgTime}
                    onChange={(e) => setFormData({...formData, avgTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., 3 hours"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRoute(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRoute}
                disabled={!formData.from || !formData.to}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
