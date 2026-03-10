import { supabase } from '../lib/supabase';
import { StoreSettings } from '../lib/types';

export const settingsService = {
  async getSettings() {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .single();
    
    if (error) throw error;
    return data as StoreSettings;
  },

  async updateSettings(settings: Partial<StoreSettings>) {
    // If we have an ID, use it to update the specific row
    if (settings.id) {
      const { data, error } = await supabase
        .from('store_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data as StoreSettings;
    }

    // Fallback: update any row (since there should only be one)
    const { data, error } = await supabase
      .from('store_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Dummy condition to match all valid UUIDs
      .select()
      .single();

    if (error) throw error;
    return data as StoreSettings;
  },

  async clearTestData() {
    // Call the secure RPC function to clear data
    // This requires creating the clear_test_data function in Supabase
    const { error } = await supabase.rpc('clear_test_data');
    
    if (error) {
      console.error('RPC failed, falling back to direct delete:', error);
      
      // Fallback to direct deletes if RPC is not available
      // Delete all deliveries
      const { error: deliveriesError } = await supabase
        .from('deliveries')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
        
      if (deliveriesError) throw deliveriesError;

      // Delete all order items
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
        
      if (orderItemsError) throw orderItemsError;

      // Delete all order status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
        
      if (historyError) throw historyError;

      // Delete all orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
        
      if (ordersError) throw ordersError;
    }

    return true;
  }
};
