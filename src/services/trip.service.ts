import api from './api';

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  customerId?: string;
  route?: string;
  distance?: string;
  startDate: string;
  endDate?: string;
  status: string;
  revenue: number;
  expense: number;
  profit: number;
  createdAt: string;
  updatedAt: string;
  vehicle?: any;
  driver?: any;
  customer?: any;
}

export interface CreateTripInput {
  vehicleId: string;
  driverId: string;
  customerId?: string;
  route?: string;
  distance?: string;
  startDate: string;
  endDate?: string;
  status?: string;
  revenue?: number;
  expense?: number;
}

export const tripService = {
  async getAllTrips(page = 1, limit = 10, status?: string, vehicleId?: string, driverId?: string) {
    return api.get('/trips', {
      params: { page, limit, ...(status && { status }), ...(vehicleId && { vehicleId }), ...(driverId && { driverId }) },
    });
  },

  async getTripById(id: string) {
    return api.get(`/trips/${id}`);
  },

  async createTrip(data: CreateTripInput) {
    return api.post('/trips', data);
  },

  async updateTrip(id: string, data: Partial<CreateTripInput>) {
    return api.put(`/trips/${id}`, data);
  },

  async deleteTrip(id: string) {
    return api.delete(`/trips/${id}`);
  },
};
