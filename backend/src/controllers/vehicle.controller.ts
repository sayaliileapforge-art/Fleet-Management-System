import { Response } from 'express';
import { CustomRequest } from '../utils/types';
import { successResponse, errorResponse, getPaginationParams } from '../utils/helpers';
import prisma from '../config/database';

export const createVehicle = async (req: CustomRequest, res: Response) => {
  try {
    console.log('📥 [CREATE VEHICLE] Incoming request body:', JSON.stringify(req.body, null, 2));

    const { vehicleNo, type, model, capacity, fuelType, status, licenseExpiry, insuranceExpiry } =
      req.body;

    // Validation
    if (!vehicleNo || !type || !model) {
      console.error('❌ [VALIDATION ERROR] Missing required fields');
      return errorResponse(res, 'Missing required fields: vehicleNo, type, model are required', 400);
    }

    console.log('✅ [VALIDATION] All required fields present');

    // Check if vehicle already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { vehicleNo },
    });

    if (existingVehicle) {
      console.error(`❌ [DUPLICATE] Vehicle ${vehicleNo} already exists`);
      return errorResponse(res, 'Vehicle with this number already exists', 409);
    }

    console.log('✅ [DB CHECK] Vehicle number is unique');

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleNo,
        name: model, // Use model as name for display purposes
        type,
        model,
        capacity: capacity ? String(capacity) : '',
        fuelType: fuelType || 'Diesel',
        status: status || 'Active',
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
      },
    });

    console.log('✅ [DB CREATE] Vehicle created successfully:', vehicle.id);
    successResponse(res, vehicle, 'Vehicle created successfully', 201);
  } catch (error) {
    console.error('❌ [ERROR] Create vehicle error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errorResponse(res, `Failed to create vehicle: ${errorMessage}`, 500, error);
  }
};

export const getVehicles = async (req: CustomRequest, res: Response) => {
  try {
    const { page, limit, status } = req.query;
    const paginationParams = getPaginationParams(String(page || 1), String(limit || 10));

    const whereClause: any = {};
    if (status) {
      whereClause.status = String(status);
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where: whereClause,
        skip: paginationParams.skip,
        take: paginationParams.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vehicle.count({ where: whereClause }),
    ]);

    successResponse(
      res,
      {
        vehicles,
        pagination: {
          page: paginationParams.page,
          limit: paginationParams.limit,
          total,
          pages: Math.ceil(total / paginationParams.limit),
        },
      },
      'Vehicles fetched successfully'
    );
  } catch (error) {
    console.error('Get vehicles error:', error);
    errorResponse(res, 'Failed to fetch vehicles', 500, error);
  }
};

export const getVehicleById = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        expenses: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    successResponse(res, vehicle, 'Vehicle fetched successfully');
  } catch (error) {
    console.error('Get vehicle by ID error:', error);
    errorResponse(res, 'Failed to fetch vehicle', 500, error);
  }
};

export const updateVehicle = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { vehicleNo, name, type, model, capacity, fuelType, status, licenseExpiry, insuranceExpiry } =
      req.body;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    // Check if new vehicleNo is already taken
    if (vehicleNo && vehicleNo !== vehicle.vehicleNo) {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { vehicleNo },
      });
      if (existingVehicle) {
        return errorResponse(res, 'Vehicle number already in use', 409);
      }
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(vehicleNo && { vehicleNo }),
        ...(name && { name }),
        ...(type && { type }),
        ...(model && { model }),
        ...(capacity && { capacity }),
        ...(fuelType && { fuelType }),
        ...(status && { status }),
        ...(licenseExpiry && { licenseExpiry: new Date(licenseExpiry) }),
        ...(insuranceExpiry && { insuranceExpiry: new Date(insuranceExpiry) }),
      },
    });

    successResponse(res, updatedVehicle, 'Vehicle updated successfully');
  } catch (error) {
    console.error('Update vehicle error:', error);
    errorResponse(res, 'Failed to update vehicle', 500, error);
  }
};

export const deleteVehicle = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return errorResponse(res, 'Vehicle not found', 404);
    }

    // Check if vehicle has active trips
    const activeTrips = await prisma.trip.findMany({
      where: {
        vehicleId: id,
        status: { in: ['Planned', 'Running'] },
      },
    });

    if (activeTrips.length > 0) {
      return errorResponse(res, 'Cannot delete vehicle with active trips', 400);
    }

    await prisma.vehicle.delete({
      where: { id },
    });

    successResponse(res, { id }, 'Vehicle deleted successfully');
  } catch (error) {
    console.error('Delete vehicle error:', error);
    errorResponse(res, 'Failed to delete vehicle', 500, error);
  }
};
