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
  }
};
