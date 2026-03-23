import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Truck, User, Calendar, Package } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface TripDetailProps {
  tripId: string;
  onBack: () => void;
}

interface TripData {
  id: string;
  route: string;
  distance: string;
  startDate: string;
  endDate: string;
  status: string;
  revenue: number;
  expense: number;
  profit: number;
  vehicleId: string;
  driverId: string;
  customerId: string;
}

interface VehicleData {
  id: string;
  vehicleNo: string;
  name: string;
  type: string;
  capacity: string;
}

interface DriverData {
  id: string;
  name: string;
  phone: string;
  license: string;
}

interface CustomerData {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
}

export function TripDetail({ tripId, onBack }: TripDetailProps) {
  const [trip, setTrip] = useState<TripData | null>(null);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [driver, setDriver] = useState<DriverData | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTripData();
  }, [tripId]);

  const loadTripData = async () => {
    try {
      setLoading(true);
      
      // Fetch trip data
      const { data: tripData, error: tripError } = await supabase
        .from('Trip')
        .select('*')
        .eq('id', tripId)
        .single();
      
      if (tripError) throw tripError;
      setTrip(tripData);

      // Fetch vehicle data
      if (tripData?.vehicleId) {
        const { data: vehicleData } = await supabase
          .from('Vehicle')
          .select('*')
          .eq('id', tripData.vehicleId)
          .single();
        setVehicle(vehicleData);
      }

      // Fetch driver data
      if (tripData?.driverId) {
        const { data: driverData } = await supabase
          .from('Driver')
          .select('*')
          .eq('id', tripData.driverId)
          .single();
        setDriver(driverData);
      }

      // Fetch customer data
      if (tripData?.customerId) {
        const { data: customerData } = await supabase
          .from('Customer')
          .select('*')
          .eq('id', tripData.customerId)
          .single();
        setCustomer(customerData);
      }

      // Fetch expenses for this trip
      const { data: expenseData } = await supabase
        .from('Expense')
        .select('*')
        .eq('tripId', tripId);
      setExpenses(expenseData || []);

    } catch (error) {
      console.error('Error loading trip data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 'N/A';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading trip details...</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Trip not found</div>
      </div>
    );
  }

  const totalExpense = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const revenue = trip.revenue || 0;
  const profit = revenue - totalExpense;
  const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';

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
          <h1 className="text-3xl font-semibold text-gray-900">Trip Details</h1>
          <p className="text-gray-600 mt-1">{trip.route || 'No route specified'}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          trip.status === 'Completed' ? 'bg-green-100 text-green-700' :
          trip.status === 'Running' ? 'bg-blue-100 text-blue-700' :
          trip.status === 'Planned' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {trip.status || 'Unknown'}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Revenue</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">₹{revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Expense</p>
          <p className="text-2xl font-semibold text-red-600 mt-1">₹{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Net Profit</p>
          <p className={`text-2xl font-semibold mt-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{profit.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Profit Margin</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{profitMargin}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Trip Information</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Route</p>
                <p className="font-medium text-gray-900">{trip.route || 'N/A'}</p>
                <p className="text-sm text-gray-500">{trip.distance || 'Distance not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Trip Dates</p>
                <p className="font-medium text-gray-900">
                  {formatDate(trip.startDate)} {trip.endDate ? `- ${formatDate(trip.endDate)}` : '(Ongoing)'}
                </p>
                <p className="text-sm text-gray-500">
                  Duration: {trip.endDate ? calculateDuration(trip.startDate, trip.endDate) : 'In progress'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Vehicle</p>
                <p className="font-medium text-gray-900">{vehicle?.vehicleNo || 'N/A'}</p>
                <p className="text-sm text-gray-500">{vehicle?.name || ''} {vehicle?.type ? `(${vehicle.type})` : ''}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Driver</p>
                <p className="font-medium text-gray-900">{driver?.name || 'N/A'}</p>
                <p className="text-sm text-gray-500">{driver?.license ? `License: ${driver.license}` : ''}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Vehicle Capacity</p>
                <p className="font-medium text-gray-900">{vehicle?.capacity || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Customer Information</h3>
          {customer ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Customer Name</p>
                <p className="font-medium text-gray-900 mt-1">{customer.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact Person</p>
                <p className="font-medium text-gray-900 mt-1">{customer.contactPerson || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900 mt-1">{customer.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900 mt-1">{customer.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium text-gray-900 mt-1">
                  {customer.address || ''}{customer.city ? `, ${customer.city}` : ''}
                  {!customer.address && !customer.city && 'N/A'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              No customer assigned to this trip
            </div>
          )}
        </div>
      </div>

      {/* Revenue Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Revenue Details</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Total Freight Charge</span>
            <span className="font-medium text-gray-900">₹{revenue.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between py-2 font-semibold">
            <span className="text-gray-900">Total Revenue</span>
            <span className="text-gray-900">₹{revenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Expense Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.length > 0 ? (
                expenses.map((expense, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{expense.category || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{expense.description || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">₹{(expense.amount || 0).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No expenses recorded for this trip
                  </td>
                </tr>
              )}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-6 py-4 text-gray-900" colSpan={2}>Total Expenses</td>
                <td className="px-6 py-4 text-right text-red-600">₹{totalExpense.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Profit Summary */}
      <div className={`rounded-xl border p-6 ${profit >= 0 ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200' : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'}`}>
        <h3 className="font-semibold text-gray-900 mb-4">Profitability Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">₹{revenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-semibold text-red-600 mt-1">₹{totalExpense.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Net Profit</p>
            <p className={`text-2xl font-semibold mt-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{profit.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">Margin: {profitMargin}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
