import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/helpers';
import prisma from '../config/database';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [vehicles, drivers, trips, expenses, customers] = await Promise.all([
      prisma.vehicle.findMany(),
      prisma.driver.findMany(),
      prisma.trip.findMany(),
      prisma.expense.findMany(),
      prisma.customer.findMany(),
    ]);

    // Calculate metrics
    const activeVehicles = vehicles.filter((v: any) => v.status === 'Active').length;
    const deployedVehicles = vehicles.filter((v: any) => v.status === 'Deployed').length;
    const maintenanceVehicles = vehicles.filter((v: any) => v.status === 'Maintenance').length;

    const activeDrivers = drivers.filter((d: any) => d.status === 'Active').length;
    const onTripDrivers = drivers.filter((d: any) => d.status === 'On Trip').length;

    const completedTrips = trips.filter((t: any) => t.status === 'Completed').length;
    const runningTrips = trips.filter((t: any) => t.status === 'Running').length;
    const plannedTrips = trips.filter((t: any) => t.status === 'Planned').length;

    const totalRevenue = trips.reduce((sum: number, trip: any) => sum + trip.revenue, 0);
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const totalProfit = totalRevenue - totalExpenses;

    const avgFuelCost = expenses
      .filter((e: any) => e.category === 'Fuel')
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    const stats = {
      vehicles: {
        total: vehicles.length,
        active: activeVehicles,
        deployed: deployedVehicles,
        maintenance: maintenanceVehicles,
        idle: vehicles.length - activeVehicles - deployedVehicles - maintenanceVehicles,
      },
      drivers: {
        total: drivers.length,
        active: activeDrivers,
        onTrip: onTripDrivers,
        onLeave: drivers.filter((d: any) => d.status === 'On Leave').length,
      },
      trips: {
        total: trips.length,
        completed: completedTrips,
        running: runningTrips,
        planned: plannedTrips,
      },
      financials: {
        totalRevenue,
        totalExpenses,
        totalProfit,
        profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0,
        avgFuelCost,
      },
      customers: {
        total: customers.length,
      },
    };

    successResponse(res, stats, 'Dashboard stats fetched successfully');
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    errorResponse(res, 'Failed to fetch dashboard stats', 500, error);
  }
};

export const getRevenueByMonth = async (req: Request, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        status: 'Completed',
      },
      orderBy: { endDate: 'asc' },
    });

    const monthlyData: { [key: string]: number } = {};

    trips.forEach((trip: any) => {
      const date = trip.endDate || trip.startDate;
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += trip.revenue;
    });

    const data = Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    successResponse(res, data, 'Monthly revenue data fetched successfully');
  } catch (error) {
    console.error('Get revenue by month error:', error);
    errorResponse(res, 'Failed to fetch revenue data', 500, error);
  }
};

export const getExpenseByCategory = async (req: Request, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany();

    const categoryData: { [key: string]: number } = {};

    expenses.forEach((exp: any) => {
      if (!categoryData[exp.category]) {
        categoryData[exp.category] = 0;
      }
      categoryData[exp.category] += exp.amount;
    });

    const data = Object.entries(categoryData).map(([category, amount]) => ({
      category,
      amount,
    }));

    successResponse(res, data, 'Expense category data fetched successfully');
  } catch (error) {
    console.error('Get expense by category error:', error);
    errorResponse(res, 'Failed to fetch expense data', 500, error);
  }
};

export const getTopVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { totalRevenue: 'desc' },
      take: 10,
    });

    successResponse(res, vehicles, 'Top vehicles fetched successfully');
  } catch (error) {
    console.error('Get top vehicles error:', error);
    errorResponse(res, 'Failed to fetch top vehicles', 500, error);
  }
};

export const getTopDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { rating: 'desc' },
      take: 10,
    });

    successResponse(res, drivers, 'Top drivers fetched successfully');
  } catch (error) {
    console.error('Get top drivers error:', error);
    errorResponse(res, 'Failed to fetch top drivers', 500, error);
  }
};
