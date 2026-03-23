import api from './api';

export interface Expense {
  id: string;
  vehicleId: string;
  tripId?: string;
  category: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  vehicleId: string;
  tripId?: string;
  category: string;
  amount: number;
}

export const expenseService = {
  async getAllExpenses(page = 1, limit = 10, category?: string, vehicleId?: string) {
    return api.get('/expenses', {
      params: { page, limit, ...(category && { category }), ...(vehicleId && { vehicleId }) },
    });
  },

  async getExpenseById(id: string) {
    return api.get(`/expenses/${id}`);
  },

  async createExpense(data: CreateExpenseInput) {
    return api.post('/expenses', data);
  },

  async updateExpense(id: string, data: Partial<CreateExpenseInput>) {
    return api.put(`/expenses/${id}`, data);
  },

  async deleteExpense(id: string) {
    return api.delete(`/expenses/${id}`);
  },
};
