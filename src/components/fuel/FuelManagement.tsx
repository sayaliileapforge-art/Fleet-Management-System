import { useState, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase, vehicleService } from '../../services/supabase';

interface FuelEntry {
  id: string;
  date: string;
  vehicleId: string;
  vehicle: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  odometer: number;
  efficiency: number;
  vendor: string;
  createdAt: string;
}

export function FuelManagement() {
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleId: '',
    liters: '',
    pricePerLiter: '',
    odometer: '',
    vendor: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fuelData, vehiclesData] = await Promise.all([
        supabase.from('FuelEntry').select('*').order('createdAt', { ascending: false }),
        vehicleService.getAll()
      ]);
      
      setFuelEntries(fuelData.data || []);
      setVehicles(vehiclesData || []);
    } catch (error) {
      console.error('Error loading fuel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFuelEntry = async () => {
    try {
      const liters = parseFloat(formData.liters) || 0;
      const pricePerLiter = parseFloat(formData.pricePerLiter) || 0;
      const totalCost = liters * pricePerLiter;
      const odometer = parseFloat(formData.odometer) || 0;
      
      // Get vehicle name
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
      const vehicleName = selectedVehicle ? (selectedVehicle.vehicleNo || selectedVehicle.name) : '';
      
      const { data, error } = await supabase
        .from('FuelEntry')
        .insert([{
          date: formData.date,
          vehicleId: formData.vehicleId,
          vehicle: vehicleName,
          liters: liters,
          pricePerLiter: pricePerLiter,
          totalCost: totalCost,
          odometer: odometer,
          efficiency: 0, // Will be calculated based on previous entry
          vendor: formData.vendor
        }])
        .select();

      if (error) throw error;

      await loadData();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        vehicleId: '',
        liters: '',
        pricePerLiter: '',
        odometer: '',
        vendor: ''
      });
      setShowAddModal(false);
      alert('Fuel entry added successfully!');
    } catch (error) {
      console.error('Error creating fuel entry:', error);
      alert('Failed to add fuel entry. Please try again.');
    }
  };

  const totalLiters = fuelEntries.reduce((sum, f) => sum + (f.liters || 0), 0);
  const totalCost = fuelEntries.reduce((sum, f) => sum + (f.totalCost || 0), 0);
  const avgPricePerLiter = totalLiters > 0 ? (totalCost / totalLiters).toFixed(2) : '0';
  const avgEfficiency = fuelEntries.length > 0 
    ? (fuelEntries.reduce((sum, f) => sum + (f.efficiency || 0), 0) / fuelEntries.length).toFixed(1)
    : '0';

  const filteredEntries = fuelEntries.filter(f =>
    f.vehicle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate efficiency data for chart
  const efficiencyData = fuelEntries.slice(0, 6).reverse().map(f => ({
    month: f.date?.slice(0, 7) || '',
    avgEfficiency: f.efficiency || 0
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Fuel Management</h1>
          <p className="text-gray-600 mt-1">Track fuel consumption and efficiency</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Fuel Entry
        </button>
      </div>

      {/* Add Fuel Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add Fuel Entry</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.vehicleNo} - {v.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Liters *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.liters}
                    onChange={(e) => setFormData({...formData, liters: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., 50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price/Liter (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricePerLiter}
                    onChange={(e) => setFormData({...formData, pricePerLiter: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., 95.50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Odometer (km)</label>
                <input
                  type="number"
                  value={formData.odometer}
                  onChange={(e) => setFormData({...formData, odometer: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Current odometer reading"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor/Pump</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., HP Petrol Pump"
                />
              </div>

              {formData.liters && formData.pricePerLiter && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-xl font-semibold text-gray-900">
                    ₹{(parseFloat(formData.liters) * parseFloat(formData.pricePerLiter)).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFuelEntry}
                disabled={!formData.vehicleId || !formData.liters || !formData.pricePerLiter}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Liters (MTD)</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{totalLiters.toFixed(1)}L</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Cost (MTD)</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">₹{totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Avg Price/Liter</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">₹{avgPricePerLiter}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Avg Efficiency</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">{avgEfficiency} km/l</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Fuel Efficiency Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={efficiencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip />
            <Line type="monotone" dataKey="avgEfficiency" stroke="#10b981" strokeWidth={2} name="Avg Efficiency (km/l)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vehicle or vendor..."
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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Liters</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Price/L</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Odometer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vendor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    {loading ? 'Loading...' : 'No fuel entries found. Click "Add Fuel Entry" to add one.'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((fuel) => (
                  <tr key={fuel.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{fuel.id?.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-gray-600">{fuel.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{fuel.vehicle}</td>
                    <td className="px-6 py-4 text-gray-900">{fuel.liters}L</td>
                    <td className="px-6 py-4 text-gray-900">₹{fuel.pricePerLiter}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{(fuel.totalCost || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{(fuel.odometer || 0).toLocaleString()} km</td>
                    <td className="px-6 py-4 font-medium text-green-600">{fuel.efficiency || 0} km/l</td>
                    <td className="px-6 py-4 text-gray-600">{fuel.vendor || '-'}</td>
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
