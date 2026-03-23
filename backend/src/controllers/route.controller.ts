import { Request, Response } from 'express';
import { successResponse, errorResponse, getPaginationParams } from '../utils/helpers';
import prisma from '../config/database';

export const createRoute = async (req: Request, res: Response) => {
  try {
    const { name, from, to, distance } = req.body;

    if (!name || !from || !to) {
      return errorResponse(res, 'Missing required fields: name, from, to', 400);
    }

    const route = await prisma.route.create({
      data: {
        name,
        startCity: from,
        endCity: to,
        distance: distance || '',
      },
    });

    successResponse(res, route, 'Route created successfully', 201);
  } catch (error) {
    console.error('Create route error:', error);
    errorResponse(res, 'Failed to create route', 500, error);
  }
};

export const getRoutes = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;
    const paginationParams = getPaginationParams(String(page || 1), String(limit || 10));

    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        skip: paginationParams.skip,
        take: paginationParams.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.route.count(),
    ]);

    successResponse(
      res,
      {
        routes,
        pagination: {
          page: paginationParams.page,
          limit: paginationParams.limit,
          total,
          pages: Math.ceil(total / paginationParams.limit),
        },
      },
      'Routes fetched successfully'
    );
  } catch (error) {
    console.error('Get routes error:', error);
    errorResponse(res, 'Failed to fetch routes', 500, error);
  }
};

export const updateRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, from, to, distance } = req.body;

    const existingRoute = await prisma.route.findUnique({ where: { id } });
    if (!existingRoute) {
      return errorResponse(res, 'Route not found', 404);
    }

    const route = await prisma.route.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(from !== undefined && { startCity: from }),
        ...(to !== undefined && { endCity: to }),
        ...(distance !== undefined && { distance }),
      },
    });

    successResponse(res, route, 'Route updated successfully');
  } catch (error) {
    console.error('Update route error:', error);
    errorResponse(res, 'Failed to update route', 500, error);
  }
};

export const deleteRoute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingRoute = await prisma.route.findUnique({ where: { id } });
    if (!existingRoute) {
      return errorResponse(res, 'Route not found', 404);
    }

    await prisma.route.delete({ where: { id } });
    successResponse(res, { id }, 'Route deleted successfully');
  } catch (error) {
    console.error('Delete route error:', error);
    errorResponse(res, 'Failed to delete route', 500, error);
  }
};
