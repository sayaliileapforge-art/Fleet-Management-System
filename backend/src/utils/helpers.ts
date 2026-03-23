import { Response } from 'express';
import { ApiResponse } from './types';

export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message: string = 'Error',
  statusCode: number = 400,
  error?: any
) => {
  const response: ApiResponse = {
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined,
  };
  res.status(statusCode).json(response);
};

export const getPaginationParams = (page?: string | number, limit?: string | number) => {
  const pageNum = parseInt(String(page || 1), 10);
  const limitNum = parseInt(String(limit || 10), 10);
  const skip = (pageNum - 1) * limitNum;

  return {
    page: Math.max(1, pageNum),
    limit: Math.min(limitNum, 100),
    skip: Math.max(0, skip),
  };
};
