import { Request } from 'express';

export interface CustomRequest extends Request {
  userId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}
