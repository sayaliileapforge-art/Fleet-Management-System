import { Request, Response } from 'express';
import { successResponse, errorResponse, getPaginationParams } from '../utils/helpers';
import prisma from '../config/database';

export const createDriver = async (req: Request, res: Response) => {
  try {
    const { name, phone, license, licenseExpiry, experience } = req.body;

    if (!name || !phone || !license) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    const existingDriver = await prisma.driver.findFirst({
      where: {
        OR: [{ phone }, { license }],
      },
    });

    if (existingDriver) {
      return errorResponse(res, 'Driver with this phone or license already exists', 409);
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        phone,
        license,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        experience: experience || 'Not specified',
      },
    });

    successResponse(res, driver, 'Driver created successfully', 201);
  } catch (error) {
    console.error('Create driver error:', error);
    errorResponse(res, 'Failed to create driver', 500, error);
  }
};

export const getDrivers = async (req: Request, res: Response) => {
  try {
    const { page, limit, status } = req.query;
    const paginationParams = getPaginationParams(String(page || 1), String(limit || 10));

    const whereClause: any = {};
    if (status) {
      whereClause.status = String(status);
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where: whereClause,
        skip: paginationParams.skip,
        take: paginationParams.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.driver.count({ where: whereClause }),
    ]);

    successResponse(
      res,
      {
        drivers,
        pagination: {
          page: paginationParams.page,
          limit: paginationParams.limit,
          total,
          pages: Math.ceil(total / paginationParams.limit),
        },
      },
      'Drivers fetched successfully'
    );
  } catch (error) {
    console.error('Get drivers error:', error);
    errorResponse(res, 'Failed to fetch drivers', 500, error);
  }
};

export const getDriverById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        trips: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    successResponse(res, driver, 'Driver fetched successfully');
  } catch (error) {
    console.error('Get driver by ID error:', error);
    errorResponse(res, 'Failed to fetch driver', 500, error);
  }
};

export const updateDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, license, licenseExpiry, experience, status, rating } = req.body;

    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    // Check if new phone or license is already taken
    if (phone && phone !== driver.phone) {
      const existingDriver = await prisma.driver.findFirst({
        where: { phone },
      });
      if (existingDriver) {
        return errorResponse(res, 'Phone number already in use', 409);
      }
    }

    if (license && license !== driver.license) {
      const existingDriver = await prisma.driver.findFirst({
        where: { license },
      });
      if (existingDriver) {
        return errorResponse(res, 'License already in use', 409);
      }
    }

    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(license && { license }),
        ...(licenseExpiry && { licenseExpiry: new Date(licenseExpiry) }),
        ...(experience && { experience }),
        ...(status && { status }),
        ...(rating && { rating: parseFloat(rating) }),
      },
    });

    successResponse(res, updatedDriver, 'Driver updated successfully');
  } catch (error) {
    console.error('Update driver error:', error);
    errorResponse(res, 'Failed to update driver', 500, error);
  }
};

export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    // Check if driver has active trips
    const activeTrips = await prisma.trip.findMany({
      where: {
        driverId: id,
        status: { in: ['Planned', 'Running'] },
      },
    });

    if (activeTrips.length > 0) {
      return errorResponse(res, 'Cannot delete driver with active trips', 400);
    }

    await prisma.driver.delete({
      where: { id },
    });

    successResponse(res, { id }, 'Driver deleted successfully');
  } catch (error) {
    console.error('Delete driver error:', error);
    errorResponse(res, 'Failed to delete driver', 500, error);
  }
};
