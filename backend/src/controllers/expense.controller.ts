import { Response } from 'express';
import { CustomRequest } from '../utils/types';
import { successResponse, errorResponse, getPaginationParams } from '../utils/helpers';
import prisma from '../config/database';

export const createExpense = async (req: CustomRequest, res: Response) => {
  try {
    const { vehicleId, tripId, category, amount } = req.body;

    if (!vehicleId || !category || amount === undefined) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    // Verify trip exists if provided
    if (tripId) {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
      });
      if (!trip) {
        return errorResponse(res, 'Trip not found', 404);
      }
    }

    const expense = await prisma.expense.create({
      data: {
        vehicleId,
        tripId: tripId || null,
        category,
        amount: parseFloat(amount),
      },
      include: {
        vehicle: true,
        trip: true,
      },
    });

    successResponse(res, expense, 'Expense created successfully', 201);
  } catch (error) {
    console.error('Create expense error:', error);
    errorResponse(res, 'Failed to create expense', 500, error);
  }
};

export const getExpenses = async (req: CustomRequest, res: Response) => {
  try {
    const { page, limit, category, vehicleId, tripId } = req.query;
    const paginationParams = getPaginationParams(String(page || 1), String(limit || 10));

    const whereClause: any = {};
    if (category) {
      whereClause.category = String(category);
    }
    if (vehicleId) {
      whereClause.vehicleId = String(vehicleId);
    }
    if (tripId) {
      whereClause.tripId = String(tripId);
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: whereClause,
        skip: paginationParams.skip,
        take: paginationParams.limit,
        include: {
          vehicle: true,
          trip: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.expense.count({ where: whereClause }),
    ]);

    successResponse(
      res,
      {
        expenses,
        pagination: {
          page: paginationParams.page,
          limit: paginationParams.limit,
          total,
          pages: Math.ceil(total / paginationParams.limit),
        },
      },
      'Expenses fetched successfully'
    );
  } catch (error) {
    console.error('Get expenses error:', error);
    errorResponse(res, 'Failed to fetch expenses', 500, error);
  }
};

export const getExpenseById = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        vehicle: true,
        trip: true,
      },
    });

    if (!expense) {
      return errorResponse(res, 'Expense not found', 404);
    }

    successResponse(res, expense, 'Expense fetched successfully');
  } catch (error) {
    console.error('Get expense by ID error:', error);
    errorResponse(res, 'Failed to fetch expense', 500, error);
  }
};

export const updateExpense = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { vehicleId, tripId, category, amount } = req.body;

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return errorResponse(res, 'Expense not found', 404);
    }

    // Verify vehicle exists if provided
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });
      if (!vehicle) {
        return errorResponse(res, 'Vehicle not found', 404);
      }
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        ...(vehicleId && { vehicleId }),
        ...(tripId !== undefined && { tripId: tripId || null }),
        ...(category && { category }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
      },
      include: {
        vehicle: true,
        trip: true,
      },
    });

    successResponse(res, updatedExpense, 'Expense updated successfully');
  } catch (error) {
    console.error('Update expense error:', error);
    errorResponse(res, 'Failed to update expense', 500, error);
  }
};

export const deleteExpense = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return errorResponse(res, 'Expense not found', 404);
    }

    await prisma.expense.delete({
      where: { id },
    });

    successResponse(res, { id }, 'Expense deleted successfully');
  } catch (error) {
    console.error('Delete expense error:', error);
    errorResponse(res, 'Failed to delete expense', 500, error);
  }
};
