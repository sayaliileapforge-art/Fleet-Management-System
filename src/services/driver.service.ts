import api from './api';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  license: string;
  licenseExpiry?: string;
  experience: string;
  status: string;
  totalTrips: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverInput {
  name: string;
  phone: string;
  license: string;
  licenseExpiry?: string;
  experience?: string;
}

export const driverService = {
  async getAllDrivers(page = 1, limit = 10, status?: string) {
    return api.get('/drivers', {
      params: { page, limit, ...(status && { status }) },
    });
  },

  async getDriverById(id: string) {
    return api.get(`/drivers/${id}`);
  },

  async createDriver(data: CreateDriverInput) {
    return api.post('/drivers', data);
  },

  async updateDriver(id: string, data: Partial<CreateDriverInput>) {
    return api.put(`/drivers/${id}`, data);
  },

  async deleteDriver(id: string) {
    return api.delete(`/drivers/${id}`);
  },
};
