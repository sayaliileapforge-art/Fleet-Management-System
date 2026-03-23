import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Wrench, Receipt, TrendingUp, Upload } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VehicleDetailProps {
  vehicleId: string;
  onBack: () => void;
}

const tripHistoryData = [];

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

const recentTrips = [
  { id: 'TRP-045', route: 'Mumbai → Delhi', date: '2025-01-25', distance: '1,400 km', revenue: 25000, expense: 16500, profit: 8500 },
  { id: 'TRP-042', route: 'Delhi → Jaipur', date: '2025-01-20', distance: '280 km', revenue: 12000, expense: 7800, profit: 4200 },
  { id: 'TRP-039', route: 'Jaipur → Ahmedabad', date: '2025-01-15', distance: '660 km', revenue: 18000, expense: 11200, profit: 6800 },
];

const documents = [
  { name: 'Registration Certificate', expiry: '2028-03-15', status: 'Valid' },
  { name: 'Insurance Policy', expiry: '2025-02-20', status: 'Expiring Soon' },
  { name: 'Pollution Certificate', expiry: '2025-07-10', status: 'Valid' },
  { name: 'Permit', expiry: '2025-06-30', status: 'Valid' },
];

export function VehicleDetail({ vehicleId, onBack }: VehicleDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'maintenance' | 'documents' | 'profitloss'>('overview');
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);

  // Load maintenance records from localStorage on mount
  useEffect(() => {
    console.log('🔍 [VEHICLE DETAIL] Loading maintenance records for vehicle...');
    try {
      const saved = localStorage.getItem('maintenanceRecords');
      if (saved) {
        const allRecords: MaintenanceRecord[] = JSON.parse(saved);
        // Filter records for this specific vehicle (TRK-001)
        const vehicleRecords = allRecords.filter(record => 
          record.vehicle === 'TRK-001' || record.vehicle.includes('TRK-001')
        );
        console.log('✅ [VEHICLE DETAIL] Filtered maintenance records:', vehicleRecords);
        setMaintenanceHistory(vehicleRecords);
      } else {
        console.log('ℹ️ [VEHICLE DETAIL] No maintenance records found');
        setMaintenanceHistory([]);
      }
    } catch (error) {
      console.error('❌ [VEHICLE DETAIL] Error loading maintenance records:', error);
      setMaintenanceHistory([]);
    }
  }, [vehicleId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-gray-900">TRK-001</h1>
          <p className="text-gray-600 mt-1">Tata Prima 4038 • Heavy Truck</p>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          Active
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Trips</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">45</p>
          <p className="text-xs text-green-600 mt-1">↑ 12% this month</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">₹8.5L</p>
          <p className="text-xs text-green-600 mt-1">↑ 18% this month</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Net Profit</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">₹3.2L</p>
          <p className="text-xs text-green-600 mt-1">37.6% margin</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Avg. Fuel Economy</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">4.2 km/l</p>
          <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Vehicle Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Vehicle Number</p>
            <p className="font-medium text-gray-900 mt-1">TRK-001</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="font-medium text-gray-900 mt-1">Heavy Truck</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Model</p>
            <p className="font-medium text-gray-900 mt-1">Tata Prima 4038</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Capacity</p>
            <p className="font-medium text-gray-900 mt-1">40 tons</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fuel Type</p>
            <p className="font-medium text-gray-900 mt-1">Diesel</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Year</p>
            <p className="font-medium text-gray-900 mt-1">2022</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">License Expiry</p>
            <p className="font-medium text-gray-900 mt-1">2025-03-15</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Insurance Expiry</p>
            <p className="font-medium text-orange-600 mt-1">2025-02-20 (Expiring Soon)</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Odometer</p>
            <p className="font-medium text-gray-900 mt-1">125,450 km</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'trips', label: 'Trips', icon: FileText },
            { id: 'maintenance', label: 'Maintenance', icon: Wrench },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'profitloss', label: 'Profit & Loss', icon: Receipt },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={tripHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Trips per Month */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Trips per Month</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tripHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip />
                  <Bar dataKey="trips" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trips' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trip ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Route</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Distance</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Expense</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{trip.id}</td>
                    <td className="px-6 py-4 text-gray-600">{trip.route}</td>
                    <td className="px-6 py-4 text-gray-600">{trip.date}</td>
                    <td className="px-6 py-4 text-gray-600">{trip.distance}</td>
                    <td className="px-6 py-4 text-gray-900">₹{trip.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-red-600">₹{trip.expense.toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-green-600">₹{trip.profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Maintenance History</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              Add Service Record
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Service Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {maintenanceHistory.length > 0 ? (
                  maintenanceHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-600">{record.date}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{record.type}</td>
                      <td className="px-6 py-4 text-gray-600">{record.vendor}</td>
                      <td className="px-6 py-4 text-gray-900">₹{record.cost.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          record.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No maintenance records found for this vehicle
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Vehicle Documents</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-600 mt-1">Expiry: {doc.expiry}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      doc.status === 'Valid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View Document
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profitloss' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Profit & Loss Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-semibold text-gray-900">₹8,50,000</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Total Expenses</span>
                <span className="font-semibold text-red-600">₹5,30,000</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="font-semibold text-gray-900">Net Profit</span>
                <span className="font-semibold text-green-600 text-lg">₹3,20,000</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Fuel</span>
                  <span className="text-sm font-medium text-gray-900">₹2,50,000 (47%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '47%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Maintenance</span>
                  <span className="text-sm font-medium text-gray-900">₹82,000 (15%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '15%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Driver Allowance</span>
                  <span className="text-sm font-medium text-gray-900">₹1,20,000 (23%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: '23%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Toll & Fees</span>
                  <span className="text-sm font-medium text-gray-900">₹58,000 (11%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: '11%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Other</span>
                  <span className="text-sm font-medium text-gray-900">₹20,000 (4%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: '4%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
