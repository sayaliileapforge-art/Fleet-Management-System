import { useState, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { customerService, contractService } from '../../services/supabase';

export function ContractsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    customer: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: '',
    description: '',
    paymentTerms: '',
    status: 'Active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersData, contractsData] = await Promise.all([
        customerService.getAll(),
        contractService.getAll()
      ]);
      setCustomers(customersData || []);
      setContracts(contractsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await contractService.create({
        name: formData.name,
        customerId: formData.customer,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: parseFloat(formData.budget) || 0,
        description: formData.description,
        paymentTerms: formData.paymentTerms,
        status: formData.status
      });
      alert('Contract created successfully!');
      setShowAddModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Failed to create contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      customer: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      budget: '',
      description: '',
      paymentTerms: '',
      status: 'Active'
    });
  };

  const filteredContracts = contracts.filter(contract =>
    contract.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Contracts & Projects</h1>
          <p className="text-gray-600 mt-1">Manage contracts and track project profitability</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Contract
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Contracts</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{contracts.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">{contracts.filter(c => c.status === 'Active').length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Budget</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">₹{(contracts.reduce((sum, c) => sum + (c.budget || 0), 0) / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Spent</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">₹{(contracts.reduce((sum, c) => sum + (c.spent || 0), 0) / 100000).toFixed(1)}L</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search contracts..."
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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Project ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Budget</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Spent</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Loading contracts...
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No contracts found
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => {
                  const progress = contract.budget > 0 ? ((contract.spent || 0) / contract.budget) * 100 : 0;
                  const customer = customers.find(c => c.id === contract.customerId);
                  const startDate = contract.startDate ? new Date(contract.startDate).toLocaleDateString() : '-';
                  const endDate = contract.endDate ? new Date(contract.endDate).toLocaleDateString() : '-';
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{contract.id.substring(0, 8)}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{contract.name}</p>
                          <p className="text-xs text-gray-500">{contract.trips || 0} trips</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{customer?.name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{startDate}</p>
                          <p className="text-xs text-gray-500">to {endDate}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">₹{(contract.budget || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium text-blue-600">₹{(contract.spent || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="w-24">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          contract.status === 'Active' ? 'bg-green-100 text-green-700' :
                          contract.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {contract.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Contract Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Create New Contract</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateContract} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter project/contract name"
                    required
                  />
                </div>
                <div className="col-span-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input 
                    type="date" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input 
                    type="date" 
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget (₹) *</label>
                  <input 
                    type="number" 
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
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
                    <option value="Draft">Draft</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                    placeholder="Project description and scope..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <textarea 
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={2}
                    placeholder="Payment terms and conditions..."
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
