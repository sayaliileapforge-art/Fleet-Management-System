import { Response } from 'express';
import { CustomRequest } from '../utils/types';
import { successResponse, errorResponse, getPaginationParams } from '../utils/helpers';
import prisma from '../config/database';

export const createCustomer = async (req: CustomRequest, res: Response) => {
  try {
    const { name, email, phone, address, city } = req.body;

    if (!name) {
      return errorResponse(res, 'Name is required', 400);
    }

    if (email) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email },
      });
      if (existingCustomer) {
        return errorResponse(res, 'Customer with this email already exists', 409);
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
      },
    });

    successResponse(res, customer, 'Customer created successfully', 201);
  } catch (error) {
    console.error('Create customer error:', error);
    errorResponse(res, 'Failed to create customer', 500, error);
  }
};

export const getCustomers = async (req: CustomRequest, res: Response) => {
  try {
    const { page, limit } = req.query;
    const paginationParams = getPaginationParams(String(page || 1), String(limit || 10));

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        skip: paginationParams.skip,
        take: paginationParams.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count(),
    ]);

    successResponse(
      res,
      {
        customers,
        pagination: {
          page: paginationParams.page,
          limit: paginationParams.limit,
          total,
          pages: Math.ceil(total / paginationParams.limit),
        },
      },
      'Customers fetched successfully'
    );
  } catch (error) {
    console.error('Get customers error:', error);
    errorResponse(res, 'Failed to fetch customers', 500, error);
  }
};

export const getCustomerById = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        trips: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    successResponse(res, customer, 'Customer fetched successfully');
  } catch (error) {
    console.error('Get customer by ID error:', error);
    errorResponse(res, 'Failed to fetch customer', 500, error);
  }
};

export const updateCustomer = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, city } = req.body;

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    // Check if new email is already taken
    if (email && email !== customer.email) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email },
      });
      if (existingCustomer) {
        return errorResponse(res, 'Email already in use', 409);
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(address !== undefined && { address: address || null }),
        ...(city !== undefined && { city: city || null }),
      },
    });

    successResponse(res, updatedCustomer, 'Customer updated successfully');
  } catch (error) {
    console.error('Update customer error:', error);
    errorResponse(res, 'Failed to update customer', 500, error);
  }
};

export const deleteCustomer = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return errorResponse(res, 'Customer not found', 404);
    }

    await prisma.customer.delete({
      where: { id },
    });

    successResponse(res, { id }, 'Customer deleted successfully');
  } catch (error) {
    console.error('Delete customer error:', error);
    errorResponse(res, 'Failed to delete customer', 500, error);
  }
};
