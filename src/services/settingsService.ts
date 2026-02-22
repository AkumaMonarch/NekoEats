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
    // We update the single row where ID is not null (or we could fetch the ID first)
    // Since we have a unique index, we can just update the first row found or use a known ID if we had one.
    // A safer way without knowing ID is to update based on the unique constraint or just update all (since there's only one).
    
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
