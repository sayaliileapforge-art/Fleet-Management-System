/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import api from './api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xsbrmsibiyzvmeilpber.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzYnJtc2liaXl6dm1laWxwYmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0ODI5MTEsImV4cCI6MjA4NTA1ODkxMX0.SfC4CulW3mq4-l9FzG78qQjSKMY4vg68sBVT8MV4Ux0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Vehicle operations using Supabase
export const vehicleService = {
  async create(vehicle: any) {
    const response = await api.post('/vehicles', vehicle);
    return response?.data;
  },

  async getAll(filters?: any) {
    const response = await api.get('/vehicles', {
      params: {
        page: 1,
        limit: 100,
        ...(filters?.status && { status: filters.status }),
      },
    });
    return response?.data?.vehicles || [];
  },

  async getById(id: string) {
    const response = await api.get(`/vehicles/${id}`);
    return response?.data;
  },

  async update(id: string, updates: any) {
    const response = await api.put(`/vehicles/${id}`, updates);
    return response?.data;
  },

  async delete(id: string) {
    await api.delete(`/vehicles/${id}`);
  }
};

// Driver operations
export const driverService = {
  async create(driver: any) {
    const response = await api.post('/drivers', driver);
    return response?.data;
  },

  async getAll() {
    const response = await api.get('/drivers', {
      params: { page: 1, limit: 100 },
    });
    return response?.data?.drivers || [];
  },

  async update(id: string, updates: any) {
    const response = await api.put(`/drivers/${id}`, updates);
    return response?.data;
  },

  async delete(id: string) {
    await api.delete(`/drivers/${id}`);
  }
};

// Customer operations
export const customerService = {
  async create(customer: any) {
    const customerData = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
    };

    const response = await api.post('/customers', customerData);
    return response?.data;
  },

  async getAll() {
    const response = await api.get('/customers', {
      params: { page: 1, limit: 100 },
    });
    return response?.data?.customers || [];
  },

  async delete(id: string) {
    await api.delete(`/customers/${id}`);
  }
};

// Trip operations
export const tripService = {
  async create(trip: any) {
    const { routeId, ...tripPayload } = trip;
    const response = await api.post('/trips', tripPayload);
    return response?.data;
  },

  async getAll(filters?: any) {
    const response = await api.get('/trips', {
      params: {
        page: 1,
        limit: 100,
        ...(filters?.status && { status: filters.status }),
      },
    });
    return response?.data?.trips || [];
  },

  async delete(id: string) {
    await api.delete(`/trips/${id}`);
  }
};

// Expense operations
export const expenseService = {
  async create(expense: any) {
    const response = await api.post('/expenses', {
      vehicleId: expense.vehicleId,
      tripId: expense.tripId || null,
      category: expense.category,
      amount: expense.amount,
    });
    return response?.data;
  },

  async getAll() {
    const response = await api.get('/expenses', {
      params: { page: 1, limit: 100 },
    });
    return response?.data?.expenses || [];
  }
};

// Load operations
export const loadService = {
  async create(load: any) {
    const { data, error } = await supabase
      .from('Load')
      .insert([{
        tripId: load.tripId || null,
        consignorId: load.consignorId || null,
        consigneeId: load.consigneeId || null,
        material: load.material,
        weight: load.weight || null,
        from: load.from,
        to: load.to,
        status: load.status || 'Pending',
        pod: load.pod || 'Pending'
      }])
      .select();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('Load')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('Load')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Route operations
export const routeService = {
  async create(route: any) {
    const { data, error } = await supabase
      .from('Route')
      .insert([route])
      .select();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('Route')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('Route')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Update error:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('Route')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async incrementTripCount(id: string) {
    // Fetch current route
    const { data: route, error: fetchError } = await supabase
      .from('Route')
      .select('totalTrips')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Increment trip count
    const { error: updateError } = await supabase
      .from('Route')
      .update({ totalTrips: (route?.totalTrips || 0) + 1 })
      .eq('id', id);
    
    if (updateError) throw updateError;
  }
};

// Contract operations
export const contractService = {
  async create(contract: any) {
    const { data, error } = await supabase
      .from('Contract')
      .insert([contract])
      .select();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('Contract')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};

// Pricing operations
export const pricingService = {
  async create(pricing: any) {
    const { data, error } = await supabase
      .from('CompetitorPricing')
      .insert([pricing])
      .select();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('CompetitorPricing')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('CompetitorPricing')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
