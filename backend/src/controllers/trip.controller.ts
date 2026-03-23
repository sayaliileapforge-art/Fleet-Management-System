import { Request, Response } from 'express';
import { successResponse, errorResponse, getPaginationParams } from '../utils/helpers';
import prisma from '../config/database';

export const createTrip = async (req: Request, res: Response) => {
  try {
    const { vehicleId, driverId, customerId, route, distance, startDate, endDate, status, revenue, expense } =
      req.body;

    if (!vehicleId || !driverId || !startDate) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    // Verify driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });
    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    // Verify customer exists if provided
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        return errorResponse(res, 'Customer not found', 404);
      }
    }

    const trip = await prisma.trip.create({
      data: {
        vehicleId,
        driverId,
        customerId: customerId || null,
        route: route || null,
        distance: distance || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'Planned',
        revenue: parseFloat(revenue || 0),
        expense: parseFloat(expense || 0),
        profit: parseFloat(revenue || 0) - parseFloat(expense || 0),
      },
      include: {
        vehicle: true,
        driver: true,
        customer: true,
      },
    });

    successResponse(res, trip, 'Trip created successfully', 201);
  } catch (error) {
    console.error('Create trip error:', error);
    errorResponse(res, 'Failed to create trip', 500, error);
  }
};

export const getTrips = async (req: Request, res: Response) => {
  try {
    const { page, limit, status, vehicleId, driverId } = req.query;
    const paginationParams = getPaginationParams(String(page || 1), String(limit || 10));

    const whereClause: any = {};
    if (status) {
      whereClause.status = String(status);
    }
    if (vehicleId) {
      whereClause.vehicleId = String(vehicleId);
    }
    if (driverId) {
      whereClause.driverId = String(driverId);
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where: whereClause,
        skip: paginationParams.skip,
        take: paginationParams.limit,
        include: {
          vehicle: true,
          driver: true,
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.trip.count({ where: whereClause }),
    ]);

    successResponse(
      res,
      {
        trips,
        pagination: {
          page: paginationParams.page,
          limit: paginationParams.limit,
          total,
          pages: Math.ceil(total / paginationParams.limit),
        },
      },
      'Trips fetched successfully'
    );
  } catch (error) {
    console.error('Get trips error:', error);
    errorResponse(res, 'Failed to fetch trips', 500, error);
  }
};

export const getTripById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
        customer: true,
        expenses: true,
      },
    });

    if (!trip) {
      return errorResponse(res, 'Trip not found', 404);
    }

    successResponse(res, trip, 'Trip fetched successfully');
  } catch (error) {
    console.error('Get trip by ID error:', error);
    errorResponse(res, 'Failed to fetch trip', 500, error);
  }
};

export const updateTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vehicleId, driverId, customerId, route, distance, startDate, endDate, status, revenue, expense } =
      req.body;

    const trip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!trip) {
      return errorResponse(res, 'Trip not found', 404);
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

    // Verify driver exists if provided
    if (driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
      });
      if (!driver) {
        return errorResponse(res, 'Driver not found', 404);
      }
    }

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        ...(vehicleId && { vehicleId }),
        ...(driverId && { driverId }),
        ...(customerId !== undefined && { customerId: customerId || null }),
        ...(route && { route }),
        ...(distance && { distance }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status && { status }),
        ...(revenue !== undefined && { revenue: parseFloat(revenue) }),
        ...(expense !== undefined && {
          expense: parseFloat(expense),
          profit: parseFloat(revenue || trip.revenue) - parseFloat(expense),
        }),
      },
      include: {
        vehicle: true,
        driver: true,
        customer: true,
      },
    });

    successResponse(res, updatedTrip, 'Trip updated successfully');
  } catch (error) {
    console.error('Update trip error:', error);
    errorResponse(res, 'Failed to update trip', 500, error);
  }
};

export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!trip) {
      return errorResponse(res, 'Trip not found', 404);
    }

    await prisma.trip.delete({
      where: { id },
    });

    successResponse(res, { id }, 'Trip deleted successfully');
  } catch (error) {
    console.error('Delete trip error:', error);
    errorResponse(res, 'Failed to delete trip', 500, error);
  }
};
