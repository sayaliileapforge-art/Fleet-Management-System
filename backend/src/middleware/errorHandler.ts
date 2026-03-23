import { Response, NextFunction } from 'express';
import { CustomRequest } from '../utils/types';

export interface ApiError extends Error {
  statusCode?: number;
  message: string;
}

export const errorHandler = (
  err: ApiError,
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${statusCode}: ${message}`, err);

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
