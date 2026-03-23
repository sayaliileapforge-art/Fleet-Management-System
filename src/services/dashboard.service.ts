import api from './api';

export interface DashboardStats {
  vehicles: {
    total: number;
    active: number;
    deployed: number;
    maintenance: number;
    idle: number;
  };
  drivers: {
    total: number;
    active: number;
    onTrip: number;
    onLeave: number;
  };
  trips: {
    total: number;
    completed: number;
    running: number;
    planned: number;
  };
  financials: {
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    profitMargin: number | string;
    avgFuelCost: number;
  };
  customers: {
    total: number;
  };
}

export const dashboardService = {
  async getStats() {
    return api.get('/dashboard/stats');
  },

  async getRevenueByMonth() {
    return api.get('/dashboard/revenue-by-month');
  },

  async getExpenseByCategory() {
    return api.get('/dashboard/expense-by-category');
  },

  async getTopVehicles() {
    return api.get('/dashboard/top-vehicles');
  },

  async getTopDrivers() {
    return api.get('/dashboard/top-drivers');
  },
};
