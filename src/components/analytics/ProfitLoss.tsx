import { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { tripService, expenseService, vehicleService, customerService } from '../../services/supabase';

interface MonthlyData {
  month: string;
  revenue: number;
  expense: number;
  profit: number;
}

interface VehiclePerformance {
  vehicle: string;
  vehicleId: string;
  revenue: number;
  expense: number;
  profit: number;
  margin: number;
}

export function ProfitLoss() {
  const [timeFrame, setTimeFrame] = useState('6months');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [vehiclePerformance, setVehiclePerformance] = useState<VehiclePerformance[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    loadData();
  }, [timeFrame, vehicleFilter, customerFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tripsData, expensesData, vehiclesData, customersData] = await Promise.all([
        tripService.getAll(),
        expenseService.getAll(),
        vehicleService.getAll(),
        customerService.getAll()
      ]);

      setVehicles(vehiclesData || []);
      setCustomers(customersData || []);

      // Filter trips based on timeframe
      const now = new Date();
      let startDate = new Date();
      switch (timeFrame) {
        case '1month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Filter trips and expenses
      let filteredTrips = (tripsData || []).filter((trip: any) => {
        const tripDate = new Date(trip.createdAt);
        return tripDate >= startDate;
      });

      let filteredExpenses = (expensesData || []).filter((expense: any) => {
        const expenseDate = new Date(expense.createdAt);
        return expenseDate >= startDate;
      });

      // Apply vehicle filter
      if (vehicleFilter !== 'all') {
        filteredTrips = filteredTrips.filter((t: any) => t.vehicleId === vehicleFilter);
        filteredExpenses = filteredExpenses.filter((e: any) => e.vehicleId === vehicleFilter);
      }

      // Apply customer filter
      if (customerFilter !== 'all') {
        filteredTrips = filteredTrips.filter((t: any) => t.customerId === customerFilter);
      }

      // Calculate totals
      const tripRevenue = filteredTrips.reduce((sum: number, t: any) => sum + (t.revenue || 0), 0);
      const tripExpense = filteredTrips.reduce((sum: number, t: any) => sum + (t.expense || 0), 0);
      const additionalExpenses = filteredExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      setTotalRevenue(tripRevenue);
      setTotalExpense(tripExpense + additionalExpenses);

      // Group by month for chart
      const monthMap = new Map<string, { revenue: number; expense: number }>();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      filteredTrips.forEach((trip: any) => {
        const date = new Date(trip.createdAt);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        const existing = monthMap.get(monthKey) || { revenue: 0, expense: 0 };
        existing.revenue += trip.revenue || 0;
        existing.expense += trip.expense || 0;
        monthMap.set(monthKey, existing);
      });

      filteredExpenses.forEach((expense: any) => {
        const date = new Date(expense.createdAt);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        const existing = monthMap.get(monthKey) || { revenue: 0, expense: 0 };
        existing.expense += expense.amount || 0;
        monthMap.set(monthKey, existing);
      });

      const chartData: MonthlyData[] = Array.from(monthMap.entries()).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expense: data.expense,
        profit: data.revenue - data.expense
      })).sort((a, b) => {
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
      });

      setMonthlyData(chartData);

      // Calculate vehicle performance
      const vehiclePerfMap = new Map<string, { revenue: number; expense: number }>();
      
      filteredTrips.forEach((trip: any) => {
        if (trip.vehicleId) {
          const existing = vehiclePerfMap.get(trip.vehicleId) || { revenue: 0, expense: 0 };
          existing.revenue += trip.revenue || 0;
          existing.expense += trip.expense || 0;
          vehiclePerfMap.set(trip.vehicleId, existing);
        }
      });

      filteredExpenses.forEach((expense: any) => {
        if (expense.vehicleId) {
          const existing = vehiclePerfMap.get(expense.vehicleId) || { revenue: 0, expense: 0 };
          existing.expense += expense.amount || 0;
          vehiclePerfMap.set(expense.vehicleId, existing);
        }
      });

      const vehPerf: VehiclePerformance[] = Array.from(vehiclePerfMap.entries()).map(([vehicleId, data]) => {
        const vehicle = (vehiclesData || []).find((v: any) => v.id === vehicleId);
        const profit = data.revenue - data.expense;
        const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
        return {
          vehicleId,
          vehicle: vehicle?.vehicleNo || 'Unknown',
          revenue: data.revenue,
          expense: data.expense,
          profit,
          margin: parseFloat(margin.toFixed(1))
        };
      }).filter(v => v.revenue > 0 || v.expense > 0);

      setVehiclePerformance(vehPerf);
    } catch (error) {
      console.error('Error loading P&L data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalProfit = totalRevenue - totalExpense;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  const handleDownloadReport = () => {
    // Create comprehensive report
    const reportLines = [
      'PROFIT & LOSS REPORT',
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
      `Time Frame: ${timeFrame}`,
      '',
      'SUMMARY',
      `Total Revenue,₹${totalRevenue.toLocaleString()}`,
      `Total Expenses,₹${totalExpense.toLocaleString()}`,
      `Net Profit,₹${totalProfit.toLocaleString()}`,
      `Profit Margin,${profitMargin}%`,
      '',
      'MONTHLY BREAKDOWN',
      'Month,Revenue,Expense,Profit',
      ...monthlyData.map(m => `${m.month},₹${m.revenue.toLocaleString()},₹${m.expense.toLocaleString()},₹${m.profit.toLocaleString()}`),
      '',
      'VEHICLE PERFORMANCE',
      'Vehicle,Revenue,Expense,Profit,Margin',
      ...vehiclePerformance.map(v => `${v.vehicle},₹${v.revenue.toLocaleString()},₹${v.expense.toLocaleString()},₹${v.profit.toLocaleString()},${v.margin}%`)
    ];
    
    const csvContent = reportLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `profit_loss_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Profit & Loss Analytics</h1>
          <p className="text-gray-600 mt-1">Analyze profitability across vehicles, trips, and time periods</p>
        </div>
        <button 
          onClick={handleDownloadReport}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {totalRevenue >= 100000 ? `₹${(totalRevenue / 100000).toFixed(1)}L` : `₹${totalRevenue.toLocaleString()}`}
          </p>
          {totalRevenue > 0 && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Based on trips data
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-semibold text-red-600 mt-1">
            {totalExpense >= 100000 ? `₹${(totalExpense / 100000).toFixed(1)}L` : `₹${totalExpense.toLocaleString()}`}
          </p>
          {totalExpense > 0 && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> From trips & expenses
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Net Profit</p>
          <p className={`text-2xl font-semibold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(totalProfit) >= 100000 ? `₹${(totalProfit / 100000).toFixed(1)}L` : `₹${totalProfit.toLocaleString()}`}
          </p>
          {totalRevenue > 0 && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              Revenue - Expenses
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Profit Margin</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{profitMargin}%</p>
          {totalRevenue > 0 && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${parseFloat(profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {parseFloat(profitMargin) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              (Profit / Revenue) × 100
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <select 
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.vehicleNo}</option>
            ))}
          </select>
          <select 
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Revenue vs Expense Trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Revenue vs Expense Trend</h3>
        {loading ? (
          <div className="h-[350px] flex items-center justify-center text-gray-500">Loading...</div>
        ) : monthlyData.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center text-gray-500">
            No data available. Add trips with revenue/expense to see trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
              <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Vehicle Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Vehicle-wise Profitability</h3>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500">Loading...</div>
        ) : vehiclePerformance.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No vehicle performance data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vehiclePerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="vehicle" stroke="#666" />
              <YAxis stroke="#666" tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
              <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[8, 8, 0, 0]} />
              <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Detailed Performance by Vehicle</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Expense</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Profit</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : vehiclePerformance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No vehicle performance data. Create trips with revenue and expenses to see data here.
                  </td>
                </tr>
              ) : (
                vehiclePerformance.map((veh) => (
                  <tr key={veh.vehicleId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{veh.vehicle}</td>
                    <td className="px-6 py-4 text-right text-gray-900">₹{veh.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-red-600">₹{veh.expense.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">₹{veh.profit.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{veh.margin}%</td>
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
