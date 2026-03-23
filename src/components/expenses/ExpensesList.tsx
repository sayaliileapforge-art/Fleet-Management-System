import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { expenseService, tripService, customerService, vehicleService } from '../../services/supabase';

interface Vehicle {
  id: string;
  vehicleNo: string;
  name: string;
}

interface Trip {
  id: string;
  customerId?: string;
  route?: string;
}

interface Customer {
  id: string;
  name: string;
  city?: string;
}

interface ExpenseWithDetails {
  id: string;
  category: string;
  amount: number;
  vehicleId?: string;
  tripId?: string;
  customerId?: string;
  createdAt?: string;
  date?: string;
  vehicle?: string;
  trip?: string;
  vendor?: string;
  paymentMethod?: string;
}

export function ExpensesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Additional filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  
  // Form state
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Fuel',
    amount: '',
    vehicleId: '',
    tripId: '',
    customerId: '',
    paymentMethod: 'Cash',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, tripsData, customersData, vehiclesData] = await Promise.all([
        expenseService.getAll(),
        tripService.getAll(),
        customerService.getAll(),
        vehicleService.getAll()
      ]);

      setTrips(Array.isArray(tripsData) ? tripsData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);

      // Create trip index map for TRP-001 format
      const tripIndexMap = new Map<string, number>();
      (Array.isArray(tripsData) ? tripsData : []).forEach((trip: Trip, index: number) => {
        tripIndexMap.set(trip.id, index + 1);
      });

      // Map expenses with vehicle, trip, and customer details
      const mappedExpenses = (Array.isArray(expensesData) ? expensesData : []).map((expense: any) => {
        const vehicle = vehiclesData.find((v: Vehicle) => v.id === expense.vehicleId);
        const trip = tripsData.find((t: Trip) => t.id === expense.tripId);
        const tripIndex = expense.tripId ? tripIndexMap.get(expense.tripId) : null;
        
        // Get vendor from expense's customerId or from the trip's customer
        const vendorFromExpense = expense.customerId 
          ? customersData.find((c: Customer) => c.id === expense.customerId)
          : null;
        const vendorFromTrip = trip?.customerId 
          ? customersData.find((c: Customer) => c.id === trip.customerId)
          : null;

        return {
          ...expense,
          date: new Date(expense.createdAt).toLocaleDateString('en-IN'),
          vehicle: vehicle?.vehicleNo || expense.vehicleId || '-',
          trip: tripIndex ? `TRP-${String(tripIndex).padStart(3, '0')}` : '-',
          vendor: vendorFromExpense?.name || vendorFromTrip?.name || '-',
          paymentMethod: expense.paymentMethod || 'Cash'
        };
      });

      setExpenses(mappedExpenses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    try {
      if (!newExpense.vehicleId || !newExpense.amount) {
        alert('Please fill in required fields (Vehicle and Amount)');
        return;
      }

      await expenseService.create({
        vehicleId: newExpense.vehicleId,
        tripId: newExpense.tripId || null,
        customerId: newExpense.customerId || null,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        paymentMethod: newExpense.paymentMethod
      });

      setShowAddModal(false);
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category: 'Fuel',
        amount: '',
        vehicleId: '',
        tripId: '',
        customerId: '',
        paymentMethod: 'Cash',
        description: ''
      });
      
      loadData();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vehicle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesVehicle = vehicleFilter === 'all' || expense.vehicleId === vehicleFilter;
    const matchesPayment = paymentFilter === 'all' || expense.paymentMethod === paymentFilter;
    
    // Date filtering
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const expenseDate = expense.createdAt ? new Date(expense.createdAt) : null;
      if (expenseDate) {
        if (dateFrom) {
          matchesDate = matchesDate && expenseDate >= new Date(dateFrom);
        }
        if (dateTo) {
          matchesDate = matchesDate && expenseDate <= new Date(dateTo + 'T23:59:59');
        }
      }
    }
    
    return matchesSearch && matchesCategory && matchesVehicle && matchesPayment && matchesDate;
  });

  // Export expenses to CSV
  const handleExport = () => {
    const headers = ['Expense ID', 'Date', 'Category', 'Vehicle', 'Trip', 'Vendor', 'Payment Method', 'Amount'];
    const csvData = filteredExpenses.map(exp => [
      `EXP-${exp.id?.slice(-4).toUpperCase()}`,
      exp.date || '',
      exp.category || '',
      exp.vehicle || '',
      exp.trip || '',
      exp.vendor || '',
      exp.paymentMethod || '',
      exp.amount || 0
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setVehicleFilter('all');
    setPaymentFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Expenses Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all your expenses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Fuel</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">₹{(categoryTotals['Fuel'] || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Maintenance</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">₹{(categoryTotals['Maintenance'] || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Other</p>
          <p className="text-2xl font-semibold text-orange-600 mt-1">
            ₹{(totalExpenses - (categoryTotals['Fuel'] || 0) - (categoryTotals['Maintenance'] || 0)).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by expense ID or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Fuel">Fuel</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Tires">Tires</option>
              <option value="Driver Allowance">Driver Allowance</option>
              <option value="Toll">Toll</option>
              <option value="Repairs">Repairs</option>
              <option value="Office">Office</option>
              <option value="Other">Other</option>
            </select>
            <button 
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors ${
                showMoreFilters ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300'
              }`}
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
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Vehicles</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.vehicleNo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="FASTag">FASTag</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Expense ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trip</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No expenses found. Click "Add Expense" to create one.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">EXP-{expense.id?.slice(-4).toUpperCase()}</td>
                    <td className="px-6 py-4 text-gray-600">{expense.date}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{expense.vehicle}</td>
                    <td className="px-6 py-4 text-gray-600">{expense.trip}</td>
                    <td className="px-6 py-4 text-gray-600">{expense.vendor}</td>
                    <td className="px-6 py-4 text-gray-600">{expense.paymentMethod}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">₹{expense.amount?.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Expense</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Fuel</option>
                    <option>Maintenance</option>
                    <option>Tires</option>
                    <option>Driver Allowance</option>
                    <option>Toll</option>
                    <option>Repairs</option>
                    <option>Office</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                  <select 
                    value={newExpense.vehicleId}
                    onChange={(e) => setNewExpense({ ...newExpense, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleNo} - {vehicle.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip (Optional)</label>
                  <select 
                    value={newExpense.tripId}
                    onChange={(e) => setNewExpense({ ...newExpense, tripId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">None</option>
                    {trips.map((trip, index) => (
                      <option key={trip.id} value={trip.id}>
                        TRP-{String(index + 1).padStart(3, '0')} - {trip.route || 'No Route'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select 
                    value={newExpense.paymentMethod}
                    onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Cash</option>
                    <option>Card</option>
                    <option>Bank Transfer</option>
                    <option>FASTag</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <select 
                    value={newExpense.customerId}
                    onChange={(e) => setNewExpense({ ...newExpense, customerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Vendor (Optional)</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} {customer.city ? `- ${customer.city}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    rows={3} 
                    placeholder="Add notes..." 
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleAddExpense} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Add Expense</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
