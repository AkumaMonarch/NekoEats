import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { settingsService } from '../services/settingsService';
import { StoreSettings } from '../lib/types';

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('public:store_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, (payload) => {
        console.log('Settings update:', payload);
        if (payload.new) {
            setSettings(payload.new as StoreSettings);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading };
}
