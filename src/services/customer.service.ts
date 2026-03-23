import api from './api';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
}

export const customerService = {
  async getAllCustomers(page = 1, limit = 10) {
    return api.get('/customers', {
      params: { page, limit },
    });
  },

  async getCustomerById(id: string) {
    return api.get(`/customers/${id}`);
  },

  async createCustomer(data: CreateCustomerInput) {
    return api.post('/customers', data);
  },

  async updateCustomer(id: string, data: Partial<CreateCustomerInput>) {
    return api.put(`/customers/${id}`, data);
  },

  async deleteCustomer(id: string) {
    return api.delete(`/customers/${id}`);
  },
};
