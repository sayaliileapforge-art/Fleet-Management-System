import { Request, Response } from 'express';
import { successResponse, errorResponse, getPaginationParams } from '../utils/helpers';
import prisma from '../config/database';
import {
  convertRawTextOrCsvToFleetVehicles,
  FleetVehicle,
  FleetVehicleParseError,
  mapRawFleetRowToVehicle,
} from '../utils/vehicleBulkParser';
import fleetVehicles2025_2026_ordered from '../data/fleetVehicles2025_2026_ordered.json';

type OrderedFleetVehicle = FleetVehicle & { srNo: number };

const formatVehicleNumber = (num: string): string => {
  const clean = String(num || '')
    .replace(/\s+/g, '')
    .toUpperCase();
  return clean.replace(/^([A-Z]{2})(\d{2})([A-Z]{2})(\d{4})$/, '$1-$2$3-$4');
};

export const createVehicle = async (req: Request, res: Response) => {
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

export const createVehiclesBulk = async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      vehicles?: unknown[];
      rawText?: string;
      expectedTotal?: number;
      strictTotalInserted?: boolean;
    };

    const incomingRows = Array.isArray(req.body)
      ? (req.body as unknown[])
      : Array.isArray(body?.vehicles)
        ? body.vehicles
        : [];

    const expectedTotal =
      typeof body?.expectedTotal === 'number' && Number.isFinite(body.expectedTotal)
        ? body.expectedTotal
        : undefined;
    const strictTotalInserted = Boolean(body?.strictTotalInserted);

    let parsedVehicles: FleetVehicle[] = [];
    let invalidEntries: FleetVehicleParseError[] = [];

    if (typeof body?.rawText === 'string' && body.rawText.trim()) {
      const parseResult = convertRawTextOrCsvToFleetVehicles(body.rawText);
      parsedVehicles = parseResult.vehicles;
      invalidEntries = parseResult.invalidEntries;
    } else if (incomingRows.length > 0) {
      incomingRows.forEach((row, index) => {
        const { vehicle, reason } = mapRawFleetRowToVehicle((row || {}) as Record<string, unknown>);
        if (!vehicle) {
          invalidEntries.push({
            index,
            reason: reason || 'Invalid row',
            raw: row,
          });
          return;
        }
        parsedVehicles.push(vehicle);
      });
    } else {
      return errorResponse(
        res,
        'Request must include either a vehicles array or rawText CSV data',
        400
      );
    }

    const receivedCount =
      incomingRows.length > 0 ? incomingRows.length : parsedVehicles.length + invalidEntries.length;

    if (typeof expectedTotal === 'number' && receivedCount !== expectedTotal) {
      return errorResponse(
        res,
        `Expected exactly ${expectedTotal} vehicles, but received ${receivedCount}`,
        400
      );
    }

    invalidEntries.forEach((entry) => {
      console.error(`❌ [BULK VEHICLE][INVALID][${entry.index}] ${entry.reason}`, entry.raw);
    });

    const seenVehicleNumbers = new Set<string>();
    const payloadDuplicates: string[] = [];
    const dedupedVehicles: FleetVehicle[] = [];

    parsedVehicles.forEach((vehicle) => {
      if (seenVehicleNumbers.has(vehicle.vehicleNumber)) {
        payloadDuplicates.push(vehicle.vehicleNumber);
        return;
      }

      seenVehicleNumbers.add(vehicle.vehicleNumber);
      dedupedVehicles.push(vehicle);
    });

    const existingVehicleRows =
      dedupedVehicles.length > 0
        ? await prisma.vehicle.findMany({
            where: {
              vehicleNo: {
                in: dedupedVehicles.map((vehicle) => vehicle.vehicleNumber),
              },
            },
            select: {
              vehicleNo: true,
            },
          })
        : [];

    const existingVehicleNos = new Set(existingVehicleRows.map((row) => row.vehicleNo));
    const vehiclesToInsert = dedupedVehicles.filter(
      (vehicle) => !existingVehicleNos.has(vehicle.vehicleNumber)
    );

    const summaryBeforeInsert = {
      receivedCount,
      validCount: parsedVehicles.length,
      insertedCount: vehiclesToInsert.length,
      skippedPayloadDuplicateCount: payloadDuplicates.length,
      skippedExistingCount: dedupedVehicles.length - vehiclesToInsert.length,
      invalidCount: invalidEntries.length,
    };

    if (
      strictTotalInserted &&
      typeof expectedTotal === 'number' &&
      summaryBeforeInsert.insertedCount !== expectedTotal
    ) {
      return res.status(422).json({
        success: false,
        message: `Validation failed before insert: totalInsertable (${summaryBeforeInsert.insertedCount}) !== expected (${expectedTotal})`,
        data: {
          summary: summaryBeforeInsert,
          skippedPayloadDuplicates: payloadDuplicates,
          skippedExistingVehicleNumbers: Array.from(existingVehicleNos),
          invalidEntries,
          orderedUniqueVehicles: dedupedVehicles,
        },
      });
    }

    const createResult =
      vehiclesToInsert.length > 0
        ? await prisma.vehicle.createMany({
            data: vehiclesToInsert.map((vehicle) => ({
              vehicleNo: vehicle.vehicleNumber,
              name: vehicle.model,
              type: vehicle.vehicleType,
              model: vehicle.model,
              fuelType: vehicle.fuelType,
              capacity: vehicle.capacity,
              status: vehicle.status || 'Active',
            })),
            skipDuplicates: true,
          })
        : { count: 0 };

    const summary = {
      receivedCount,
      validCount: parsedVehicles.length,
      insertedCount: createResult.count,
      skippedPayloadDuplicateCount: payloadDuplicates.length,
      skippedExistingCount: dedupedVehicles.length - vehiclesToInsert.length,
      invalidCount: invalidEntries.length,
    };

    if (strictTotalInserted && typeof expectedTotal === 'number' && createResult.count !== expectedTotal) {
      return res.status(422).json({
        success: false,
        message: `Validation failed: totalInserted (${createResult.count}) !== expected (${expectedTotal})`,
        data: {
          summary,
          skippedPayloadDuplicates: payloadDuplicates,
          skippedExistingVehicleNumbers: Array.from(existingVehicleNos),
          invalidEntries,
          orderedUniqueVehicles: dedupedVehicles,
        },
      });
    }

    successResponse(
      res,
      {
        summary,
        skippedPayloadDuplicates: payloadDuplicates,
        skippedExistingVehicleNumbers: Array.from(existingVehicleNos),
        invalidEntries,
        orderedUniqueVehicles: dedupedVehicles,
      },
      'Bulk vehicle import completed successfully',
      201
    );
  } catch (error) {
    console.error('❌ [ERROR] Bulk vehicle import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errorResponse(res, `Failed to import vehicles in bulk: ${errorMessage}`, 500, error);
  }
};

export const importFleetVehicles2025To2026 = async (req: Request, res: Response) => {
  try {
    const orderedFleetVehicles: OrderedFleetVehicle[] = (
      fleetVehicles2025_2026_ordered as OrderedFleetVehicle[]
    ).map((vehicle) => ({
      ...vehicle,
      vehicleNumber: formatVehicleNumber(vehicle.vehicleNumber),
    }));

    const expectedTotal = 29;
    if (orderedFleetVehicles.length !== expectedTotal) {
      return errorResponse(
        res,
        `Fleet source validation failed: expected ${expectedTotal} rows, got ${orderedFleetVehicles.length}`,
        422
      );
    }

    const hasInvalidSequence = orderedFleetVehicles.some((vehicle, index) => vehicle.srNo !== index + 1);
    if (hasInvalidSequence) {
      return errorResponse(
        res,
        'Fleet source sequence validation failed: SR NO must be strict 1 to 29 order',
        422
      );
    }

    const seenVehicleNumbers = new Set<string>();

    const orderedResults: Array<
      OrderedFleetVehicle & {
        action: 'inserted' | 'skipped_existing' | 'skipped_duplicate';
      }
    > = [];

    for (const vehicle of orderedFleetVehicles) {
      if (seenVehicleNumbers.has(vehicle.vehicleNumber)) {
        orderedResults.push({
          ...vehicle,
          action: 'skipped_duplicate',
        });
        continue;
      }

      seenVehicleNumbers.add(vehicle.vehicleNumber);

      const existingVehicle = await prisma.vehicle.findUnique({
        where: { vehicleNo: vehicle.vehicleNumber },
        select: { id: true },
      });

      if (existingVehicle) {
        orderedResults.push({
          ...vehicle,
          action: 'skipped_existing',
        });
        continue;
      }

      await prisma.vehicle.create({
        data: {
          vehicleNo: vehicle.vehicleNumber,
          name: vehicle.model,
          type: vehicle.vehicleType,
          model: vehicle.model,
          fuelType: vehicle.fuelType,
          capacity: vehicle.capacity,
          status: vehicle.status || 'Active',
        },
      });

      orderedResults.push({
        ...vehicle,
        action: 'inserted',
      });
    }

    const totalProcessed = orderedResults.length;
    if (totalProcessed !== expectedTotal) {
      return errorResponse(
        res,
        `Validation failed after insert: processed ${totalProcessed} rows, expected ${expectedTotal}`,
        422
      );
    }

    const insertedCount = orderedResults.filter((row) => row.action === 'inserted').length;
    const skippedDuplicateCount = orderedResults.filter(
      (row) => row.action === 'skipped_duplicate'
    ).length;
    const skippedExistingCount = orderedResults.filter(
      (row) => row.action === 'skipped_existing'
    ).length;

    if (insertedCount !== expectedTotal) {
      return errorResponse(
        res,
        `Vehicle count mismatch: totalInserted (${insertedCount}) !== expected (${expectedTotal})`,
        422,
        {
          expectedTotal,
          totalProcessed,
          insertedCount,
          skippedDuplicateCount,
          skippedExistingCount,
          orderedJson: orderedResults,
        }
      );
    }

    return successResponse(
      res,
      {
        expectedTotal,
        totalProcessed,
        insertedCount,
        skippedDuplicateCount,
        skippedExistingCount,
        orderedJson: orderedResults,
      },
      'Fleet vehicles imported in strict SR NO order (1-29)',
      201
    );
  } catch (error) {
    console.error('❌ [ERROR] Ordered fleet import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(res, `Failed to import fleet vehicles: ${errorMessage}`, 500, error);
  }
};

export const getVehicles = async (req: Request, res: Response) => {
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

export const getVehicleById = async (req: Request, res: Response) => {
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

export const updateVehicle = async (req: Request, res: Response) => {
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

export const deleteVehicle = async (req: Request, res: Response) => {
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
