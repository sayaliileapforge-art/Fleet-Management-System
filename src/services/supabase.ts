/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xsbrmsibiyzvmeilpber.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzYnJtc2liaXl6dm1laWxwYmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0ODI5MTEsImV4cCI6MjA4NTA1ODkxMX0.SfC4CulW3mq4-l9FzG78qQjSKMY4vg68sBVT8MV4Ux0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Vehicle operations using Supabase
export const vehicleService = {
  async create(vehicle: any) {
    const { data, error } = await supabase
      .from('Vehicle')
      .insert([vehicle])
      .select();
    
    if (error) {
      console.error('❌ Error creating vehicle:', error);
      throw error;
    }
    
    return data;
  },

  async getAll(filters?: any) {
    let query = supabase.from('Vehicle').select('*');
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query.order('createdAt', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching vehicles:', error);
      throw error;
    }
    
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('Vehicle')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('Vehicle')
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
      .from('Vehicle')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Driver operations
export const driverService = {
  async create(driver: any) {
    const { data, error } = await supabase
      .from('Driver')
      .insert([driver])
      .select();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('Driver')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('Driver')
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
      .from('Driver')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Customer operations
export const customerService = {
  async create(customer: any) {
    // Remove any fields that might not exist in the database
    const customerData = {
      name: customer.name,
      type: customer.type,
      contactPerson: customer.contactPerson,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      gstNumber: customer.gstNumber || null,
      panNumber: customer.panNumber || null
    };
    
    const { data, error } = await supabase
      .from('Customer')
      .insert([customerData])
      .select();
    
    if (error) {
      console.error('❌ Customer create error:', error);
      // Provide more helpful error message for conflicts
      if (error.code === '23505') {
        throw new Error('A customer with this email, phone, GST, or PAN already exists.');
      }
      throw error;
    }
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('Customer')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('Customer')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Trip operations
export const tripService = {
  async create(trip: any) {
    const { data, error } = await supabase
      .from('Trip')
      .insert([trip])
      .select();
    if (error) throw error;
    return data;
  },

  async getAll(filters?: any) {
    let query = supabase.from('Trip').select('*');
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query.order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('Trip')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Expense operations
export const expenseService = {
  async create(expense: any) {
    const { data, error } = await supabase
      .from('Expense')
      .insert([{
        vehicleId: expense.vehicleId,
        tripId: expense.tripId || null,
        customerId: expense.customerId || null,
        category: expense.category,
        amount: expense.amount,
        paymentMethod: expense.paymentMethod || 'Cash'
      }])
      .select();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('Expense')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
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
