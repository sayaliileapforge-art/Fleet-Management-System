import api from './api';

export interface Vehicle {
  id: string;
  vehicleNo: string;
  name: string;
  type: string;
  model: string;
  capacity: string;
  fuelType: string;
  status: string;
  licenseExpiry?: string;
  insuranceExpiry?: string;
  totalTrips: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleInput {
  vehicleNo: string;
  name: string;
  type: string;
  model: string;
  capacity: string;
  fuelType: string;
  licenseExpiry?: string;
  insuranceExpiry?: string;
}

export const vehicleService = {
  async getAllVehicles(page = 1, limit = 10, status?: string) {
    return api.get('/vehicles', {
      params: { page, limit, ...(status && { status }) },
    });
  },

  async getVehicleById(id: string) {
    return api.get(`/vehicles/${id}`);
  },

  async createVehicle(data: CreateVehicleInput) {
    return api.post('/vehicles', data);
  },

  async updateVehicle(id: string, data: Partial<CreateVehicleInput>) {
    return api.put(`/vehicles/${id}`, data);
  },

  async deleteVehicle(id: string) {
    return api.delete(`/vehicles/${id}`);
  },
};
