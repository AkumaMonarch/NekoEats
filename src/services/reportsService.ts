import { supabase } from '../lib/supabase';
import { Order } from '../lib/types';

export const reportsService = {
  async getCompletedOrders(startDate: Date, endDate: Date) {
    // Ensure endDate includes the full day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (
            category
          )
        )
      `)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as any[]; // Using any[] because of the join structure, similar to other services
  },

  async getStoreSettings() {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }
};
