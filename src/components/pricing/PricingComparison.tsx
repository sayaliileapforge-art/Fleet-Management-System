import { useState, useEffect } from 'react';
import { Plus, Search, X, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { pricingService } from '../../services/supabase';

interface CompetitorPricing {
  id: string;
  companyName: string;
  vehicleType: string;
  capacity: string;
  route: string;
  price: number;
  ourPrice: number;
  priceDifference: number;
  isBestPrice: boolean;
  marketRank: number;
  date: string;
}

const marketData = [
  { month: 'Jan', ourPrice: 45000, competitorAvg: 48000, lowestPrice: 42000 },
  { month: 'Feb', ourPrice: 45500, competitorAvg: 49000, lowestPrice: 43000 },
  { month: 'Mar', ourPrice: 46000, competitorAvg: 50000, lowestPrice: 44000 },
  { month: 'Apr', ourPrice: 45800, competitorAvg: 49500, lowestPrice: 43500 },
  { month: 'May', ourPrice: 46200, competitorAvg: 51000, lowestPrice: 45000 },
];

export function PricingComparison() {
  const [searchTerm, setSearchTerm] = useState('');
  const [comparisons, setComparisons] = useState<CompetitorPricing[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [ourPrice, setOurPrice] = useState('45000');
  const [formData, setFormData] = useState({
    companyName: '',
    vehicleType: 'Heavy Truck',
    capacity: '',
    route: '',
    price: '',
    marketRank: '5',
    date: new Date().toISOString().split('T')[0],
  });

  // Load comparison data from Supabase
  useEffect(() => {
    loadComparisons();
  }, []);

  const loadComparisons = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading pricing comparisons from database...');
      const data = await pricingService.getAll();
      console.log('✅ Loaded comparisons:', data);
      setComparisons(data || []);
    } catch (error) {
      console.error('❌ Error loading comparisons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComparison = async () => {
    console.log('📝 Adding pricing comparison:', formData);

    if (!formData.companyName.trim() || !formData.capacity.trim() || !formData.route.trim() || !formData.price) {
      alert('⚠️ Please fill in all required fields');
      return;
    }

    const competitorPrice = parseFloat(formData.price);
    const ourPriceValue = parseFloat(ourPrice);
    const priceDiff = ourPriceValue - competitorPrice;
    const isBest = ourPriceValue < competitorPrice;

    const newComparison = {
      companyName: formData.companyName.trim(),
      vehicleType: formData.vehicleType,
      capacity: formData.capacity.trim(),
      route: formData.route.trim(),
      price: competitorPrice,
      ourPrice: ourPriceValue,
      priceDifference: priceDiff,
      isBestPrice: isBest,
      marketRank: parseInt(formData.marketRank),
      date: formData.date,
    };

    try {
      console.log('💾 Saving to database...');
      await pricingService.create(newComparison);
      console.log('✅ Saved successfully!');
      
      await loadComparisons();
      
      setSuccessMessage(`✅ ${formData.companyName}'s pricing added successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);

      setFormData({
        companyName: '',
        vehicleType: 'Heavy Truck',
        capacity: '',
        route: '',
        price: '',
        marketRank: '5',
        date: new Date().toISOString().split('T')[0],
      });
      setShowForm(false);
    } catch (error) {
      console.error('❌ Error saving comparison:', error);
      alert('Failed to save pricing comparison. Please try again.');
    }
  };

  const handleDeleteComparison = async (id: string, companyName: string) => {
    if (!confirm(`Are you sure you want to delete pricing data for "${companyName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await pricingService.delete(id);
      await loadComparisons();
      alert('Pricing data deleted successfully!');
    } catch (error) {
      console.error('Error deleting pricing:', error);
      alert('Failed to delete pricing data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredComparisons = comparisons.filter(c =>
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const averageCompetitorPrice = comparisons.length > 0
    ? (comparisons.reduce((sum, c) => sum + c.price, 0) / comparisons.length).toFixed(0)
    : '0';

  const ourWinPercentage = comparisons.length > 0
    ? ((comparisons.filter(c => c.isBestPrice).length / comparisons.length) * 100).toFixed(1)
    : '0';

  const lowestPrice = comparisons.length > 0
    ? Math.min(...comparisons.map(c => c.price))
    : 0;

  const highestPrice = comparisons.length > 0
    ? Math.max(...comparisons.map(c => c.price))
    : 0;

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Award className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Competitive Pricing Analysis</h1>
          <p className="text-gray-600 mt-1">Compare our vehicle pricing with other transport companies to analyze market competitiveness</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Competitor Price
        </button>
      </div>

      {/* Our Base Price Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Our Base Vehicle Price</p>
            <p className="text-4xl font-bold mt-2">₹{parseFloat(ourPrice).toLocaleString()}</p>
          </div>
          <input
            type="number"
            value={ourPrice}
            onChange={(e) => setOurPrice(e.target.value)}
            className="w-32 px-3 py-2 rounded text-gray-900 bg-white"
            placeholder="Your price"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Market Average Price</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">₹{parseInt(averageCompetitorPrice).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">
            {parseInt(averageCompetitorPrice) > parseInt(ourPrice) 
              ? '✅ We are cheaper'
              : '⚠️ Market is cheaper'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Our Win Rate</p>
          <p className="text-2xl font-semibold text-green-600 mt-2">{ourWinPercentage}%</p>
          <p className="text-xs text-gray-500 mt-2">Best pricing vs competitors</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Price Range</p>
          <p className="text-xl font-semibold text-gray-900 mt-2">₹{lowestPrice.toLocaleString()} - ₹{highestPrice.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">Min - Max competitor prices</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Comparisons</p>
          <p className="text-2xl font-semibold text-blue-600 mt-2">{comparisons.length}</p>
          <p className="text-xs text-gray-500 mt-2">Competitor entries tracked</p>
        </div>
      </div>

      {/* Market Trend Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Pricing Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={marketData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            <Legend />
            <Line type="monotone" dataKey="ourPrice" stroke="#2563eb" strokeWidth={2} name="Our Price" />
            <Line type="monotone" dataKey="competitorAvg" stroke="#f97316" strokeWidth={2} name="Competitor Avg" />
            <Line type="monotone" dataKey="lowestPrice" stroke="#dc2626" strokeWidth={1} strokeDasharray="5 5" name="Lowest Market Price" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company name, vehicle type, or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Add Competitor Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add Competitor Pricing</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g., ABC Transport Co."
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option>Light Vehicle</option>
                  <option>Medium Truck</option>
                  <option>Heavy Truck</option>
                  <option>Tanker</option>
                  <option>Container Chassis</option>
                  <option>Flatbed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input
                  type="text"
                  placeholder="e.g., 20 TONS, 10000L"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route / Distance *</label>
                <input
                  type="text"
                  placeholder="e.g., Mumbai to Pune, 200km"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competitor Price (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g., 48000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Market Rank</label>
                <select
                  value={formData.marketRank}
                  onChange={(e) => setFormData({ ...formData, marketRank: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                    <option key={i} value={i}>Rank {i}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComparison}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparisons Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vehicle Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Capacity</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Their Price</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Our Price</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Difference</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Best Price</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredComparisons.length > 0 ? (
                filteredComparisons.map((comp, index) => (
                  <tr key={comp.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                    <td className="px-6 py-4 font-medium text-gray-900">{comp.companyName}</td>
                    <td className="px-6 py-4 text-gray-600">{comp.vehicleType}</td>
                    <td className="px-6 py-4 text-gray-600">{comp.capacity}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{comp.route}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{comp.price.toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-blue-600">₹{comp.ourPrice.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${comp.priceDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {comp.priceDifference > 0 ? '✓' : '✗'} ₹{Math.abs(comp.priceDifference).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {comp.isBestPrice ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                          <Award className="w-4 h-4" /> We Win
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">#{comp.marketRank}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteComparison(comp.id, comp.companyName)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    {loading
                      ? 'Loading pricing data...'
                      : comparisons.length === 0
                      ? 'No competitor pricing data yet. Click "Add Competitor Price" to get started.'
                      : 'No results match your search.'}
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
