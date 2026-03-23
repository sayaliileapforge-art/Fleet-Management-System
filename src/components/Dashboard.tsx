import { useState, useEffect } from 'react';
import { KPICard } from './shared/KPICard';
import { Truck, MapPin, DollarSign, Receipt, Package, FileText, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Page } from '../App';
import { vehicleService, tripService, expenseService } from '../services/supabase';

interface DashboardProps {
  onNavigate: (page: Page, id?: string) => void;
}

interface MaintenanceAlert {
  vehicle: string;
  issue: string;
  priority: 'High' | 'Medium' | 'Low';
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueExpenseData, setRevenueExpenseData] = useState<any[]>([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState<any[]>([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);

  // Load data from Supabase on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [vehiclesData, tripsData, expensesData] = await Promise.all([
        vehicleService.getAll(),
        tripService.getAll(),
        expenseService.getAll()
      ]);
      
      setVehicles(vehiclesData || []);
      setTrips(tripsData || []);
      setExpenses(expensesData || []);

      // Build revenue vs expense data by month
      const monthMap = new Map<string, { revenue: number; expense: number }>();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      (tripsData || []).forEach((trip: any) => {
        // Use createdAt or startDate, fallback to current date
        const dateStr = trip.createdAt || trip.startDate || new Date().toISOString();
        const date = new Date(dateStr);
        const monthKey = isNaN(date.getTime()) ? months[new Date().getMonth()] : months[date.getMonth()];
        const existing = monthMap.get(monthKey) || { revenue: 0, expense: 0 };
        existing.revenue += trip.revenue || 0;
        existing.expense += trip.expense || 0;
        monthMap.set(monthKey, existing);
      });

      (expensesData || []).forEach((expense: any) => {
        const dateStr = expense.createdAt || new Date().toISOString();
        const date = new Date(dateStr);
        const monthKey = isNaN(date.getTime()) ? months[new Date().getMonth()] : months[date.getMonth()];
        const existing = monthMap.get(monthKey) || { revenue: 0, expense: 0 };
        existing.expense += expense.amount || 0;
        monthMap.set(monthKey, existing);
      });

      // Sort months chronologically
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const revExpData = Array.from(monthMap.entries())
        .sort((a, b) => monthOrder.indexOf(a[0]) - monthOrder.indexOf(b[0]))
        .map(([month, data]) => ({
          month,
          revenue: data.revenue,
          expense: data.expense
        }));
      setRevenueExpenseData(revExpData);

      // Build expense category breakdown - include trip expenses even if 0 to show revenue breakdown
      const categoryMap = new Map<string, number>();
      
      // Add expenses from Expense table
      (expensesData || []).forEach((expense: any) => {
        const category = expense.category || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + (expense.amount || 0));
      });
      
      // Add trip expenses
      const totalTripExpense = (tripsData || []).reduce((sum: number, trip: any) => sum + (trip.expense || 0), 0);
      if (totalTripExpense > 0) {
        categoryMap.set('Trip Expenses', totalTripExpense);
      }
      
      // If no expenses but there's revenue, show a "No Expenses" placeholder
      const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];
      const expCatData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }));
      setExpenseCategoryData(expCatData);

      // Load maintenance alerts from localStorage
      try {
        const savedMaintenance = localStorage.getItem('maintenanceRecords');
        if (savedMaintenance) {
          const maintenanceRecords = JSON.parse(savedMaintenance);
          // Generate alerts from scheduled maintenance
          const alerts: MaintenanceAlert[] = maintenanceRecords
            .filter((record: any) => record.status === 'Scheduled')
            .slice(0, 5)
            .map((record: any) => {
              // Determine priority based on next due date
              const nextDue = new Date(record.nextDue);
              const today = new Date();
              const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              let priority: 'High' | 'Medium' | 'Low' = 'Low';
              if (daysUntilDue <= 7) priority = 'High';
              else if (daysUntilDue <= 30) priority = 'Medium';
              
              return {
                vehicle: record.vehicle || 'Unknown Vehicle',
                issue: `${record.type} scheduled for ${new Date(record.nextDue).toLocaleDateString('en-IN')}`,
                priority
              };
            });
          setMaintenanceAlerts(alerts);
        }
      } catch (error) {
        console.error('Error loading maintenance alerts:', error);
      }

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPI values from real data
  const totalTrips = trips.length;
  const activeVehicles = vehicles.filter(v => v.status === 'Active').length;
  
  // Calculate revenue and expenses from trips
  const totalRevenue = trips.reduce((sum, trip) => sum + (trip.revenue || 0), 0);
  const tripExpenses = trips.reduce((sum, trip) => sum + (trip.expense || 0), 0);
  const additionalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalExpense = tripExpenses + additionalExpenses;
  const netProfit = totalRevenue - totalExpense;

  // Build trip profitability chart data from trips state (last 6 trips)
  const tripProfitabilityChartData = trips.slice(0, 6).map((trip, index) => ({
    name: `TRP-${String(index + 1).padStart(3, '0')}`,
    profit: (trip.revenue || 0) - (trip.expense || 0)
  }));

  // Build revenue/expense chart data directly from trips state as fallback
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const computedRevExpData = () => {
    if (revenueExpenseData.length > 0) return revenueExpenseData;
    
    // Fallback: compute from trips state
    const monthMap = new Map<string, { revenue: number; expense: number }>();
    trips.forEach((trip: any) => {
      const dateStr = trip.createdAt || trip.startDate || new Date().toISOString();
      const date = new Date(dateStr);
      const monthKey = isNaN(date.getTime()) ? monthNames[new Date().getMonth()] : monthNames[date.getMonth()];
      const existing = monthMap.get(monthKey) || { revenue: 0, expense: 0 };
      existing.revenue += trip.revenue || 0;
      existing.expense += trip.expense || 0;
      monthMap.set(monthKey, existing);
    });
    
    expenses.forEach((expense: any) => {
      const dateStr = expense.createdAt || new Date().toISOString();
      const date = new Date(dateStr);
      const monthKey = isNaN(date.getTime()) ? monthNames[new Date().getMonth()] : monthNames[date.getMonth()];
      const existing = monthMap.get(monthKey) || { revenue: 0, expense: 0 };
      existing.expense += expense.amount || 0;
      monthMap.set(monthKey, existing);
    });
    
    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expense: data.expense
    }));
  };

  const chartRevExpData = computedRevExpData();

  // Prepare recent trips for table (last 4 trips) with TRP-001 format
  const recentTripsData = trips.slice(0, 4).map((trip, index) => ({
    id: trip.id,
    tripNo: `TRP-${String(index + 1).padStart(3, '0')}`,
    route: trip.route || 'N/A',
    status: trip.status || 'Planned',
    profit: (trip.revenue || 0) - (trip.expense || 0)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your fleet.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <div className="animate-spin w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Trips"
              value={totalTrips.toString()}
              icon={MapPin}
              trend={{ value: totalTrips > 0 ? '+12%' : '0%', isPositive: true }}
              color="blue"
            />
            <KPICard
              title="Active Vehicles"
              value={activeVehicles.toString()}
              icon={Truck}
              trend={{ value: activeVehicles > 0 ? '+5%' : '0%', isPositive: true }}
              color="green"
            />
            <KPICard
              title="Total Revenue"
              value={totalRevenue > 0 ? `₹${totalRevenue.toLocaleString()}` : '₹0'}
              icon={DollarSign}
              trend={{ value: totalRevenue > 0 ? '+8%' : '0%', isPositive: true }}
              color="purple"
            />
            <KPICard
              title="Net Profit"
              value={netProfit !== 0 ? `₹${netProfit.toLocaleString()}` : '₹0'}
              icon={TrendingUp}
              trend={{ value: netProfit > 0 ? '+15%' : netProfit < 0 ? '-5%' : '0%', isPositive: netProfit >= 0 }}
              color="orange"
            />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expense */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue vs Expense</h3>
          {chartRevExpData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartRevExpData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No revenue/expense data yet. Add trips with revenue to see the chart.
            </div>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          {expenseCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          ) : totalExpense > 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-red-600">₹{totalExpense.toLocaleString()}</div>
              <div className="text-gray-500 mt-2">Total Expenses</div>
              <p className="text-sm text-gray-400 mt-4">Add categorized expenses in Expenses module to see breakdown</p>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
              <div className="text-green-600 text-lg font-medium mb-2">No expenses recorded yet!</div>
              <p className="text-sm">Your trips are running expense-free. Add expenses in the Expenses module.</p>
            </div>
          )}
        </div>
      </div>

      {/* Trip Profitability Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Trip Profitability</h3>
        {tripProfitabilityChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tripProfitabilityChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
              <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
              <Bar dataKey="profit" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-gray-500">
            No trip profitability data yet. Add trips with revenue/expense to see the chart.
          </div>
        )}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trips */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Trips</h3>
            <button
              onClick={() => onNavigate('trips')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Trip ID</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Route</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTripsData.length > 0 ? (
                  recentTripsData.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium text-gray-900">{trip.tripNo}</td>
                      <td className="py-3 text-sm text-gray-600">{trip.route}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          trip.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          trip.status === 'Running' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-right font-medium text-green-600">
                        ₹{trip.profit.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No trips yet. <button onClick={() => onNavigate('trips')} className="text-blue-600 hover:underline">Add your first trip</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Maintenance Alerts</h3>
            <button
              onClick={() => onNavigate('maintenance')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {maintenanceAlerts.length > 0 ? (
              maintenanceAlerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.vehicle}</p>
                    <p className="text-sm text-gray-600">{alert.issue}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    alert.priority === 'High' ? 'bg-red-100 text-red-700' : 
                    alert.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {alert.priority}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No maintenance alerts!</p>
                <p className="text-xs text-gray-400 mt-1">Schedule maintenance in the Maintenance module</p>
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
