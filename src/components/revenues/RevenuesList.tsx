import { useState, useEffect } from 'react';
import { Plus, Search, Download, X } from 'lucide-react';
import { customerService, tripService, supabase } from '../../services/supabase';

interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  tripId: string;
  tripRoute: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
  notes: string;
  createdAt: string;
}

export function RevenuesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customer: '',
    trip: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    amount: '',
    paidAmount: '',
    notes: '',
    status: 'Unpaid'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersData, tripsData, invoicesData] = await Promise.all([
        customerService.getAll(),
        tripService.getAll(),
        supabase.from('Invoice').select('*').order('createdAt', { ascending: false })
      ]);
      setCustomers(customersData || []);
      setTrips(tripsData || []);
      setInvoices(invoicesData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get customer and trip names for display
      const selectedCustomer = customers.find(c => c.id === formData.customer);
      const selectedTrip = trips.find(t => t.id === formData.trip);
      
      const amount = parseFloat(formData.amount) || 0;
      const paidAmount = parseFloat(formData.paidAmount) || 0;
      
      // Determine status based on payment
      let status = formData.status;
      if (paidAmount >= amount && amount > 0) {
        status = 'Paid';
      } else if (paidAmount > 0) {
        status = 'Partial';
      }

      const invoiceData = {
        customerId: formData.customer,
        customerName: selectedCustomer?.name || '',
        tripId: formData.trip || null,
        tripRoute: selectedTrip?.route || '',
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        amount: amount,
        paidAmount: paidAmount,
        status: status,
        notes: formData.notes
      };

      const { data, error } = await supabase
        .from('Invoice')
        .insert([invoiceData])
        .select();

      if (error) throw error;

      await loadData();
      alert('Invoice created successfully!');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      customer: '',
      trip: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      amount: '',
      paidAmount: '',
      notes: '',
      status: 'Unpaid'
    });
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const headers = ['Invoice ID', 'Date', 'Due Date', 'Customer', 'Trip Route', 'Amount', 'Paid Amount', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredInvoices.map(inv => [
        inv.id?.slice(0, 8) || '',
        inv.invoiceDate || '',
        inv.dueDate || '',
        `"${inv.customerName || ''}"`,
        `"${inv.tripRoute || ''}"`,
        inv.amount || 0,
        inv.paidAmount || 0,
        inv.status || '',
        `"${inv.notes || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalPending = totalRevenue - totalPaid;
  const collectionRate = totalRevenue > 0 ? ((totalPaid / totalRevenue) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Revenues & Billing</h1>
          <p className="text-gray-600 mt-1">Manage invoices and track payments</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Paid</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">₹{totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-semibold text-orange-600 mt-1">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Collection Rate</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{collectionRate}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice ID or customer..."
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
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trip</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No invoices found. Click "Create Invoice" to add one.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{inv.id?.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-gray-600">{inv.invoiceDate}</td>
                    <td className="px-6 py-4 text-gray-900">{inv.customerName || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{inv.tripRoute || '-'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{(inv.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-green-600">₹{(inv.paidAmount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        inv.status === 'Paid' ? 'bg-green-100 text-green-700' :
                        inv.status === 'Partial' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Create New Invoice</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                  <select 
                    value={formData.customer}
                    onChange={(e) => setFormData({...formData, customer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip</label>
                  <select 
                    value={formData.trip}
                    onChange={(e) => setFormData({...formData, trip: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Trip (Optional)</option>
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.route || `Trip ${trip.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date *</label>
                  <input 
                    type="date" 
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input 
                    type="date" 
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹) *</label>
                  <input 
                    type="number" 
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (₹)</label>
                  <input 
                    type="number" 
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({...formData, paidAmount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                    placeholder="Additional notes or description..."
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
