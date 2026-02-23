import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { settingsService } from '../services/settingsService';
import { StoreSettings } from '../lib/types';

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(() => {
    // Try to load from local storage first
    try {
      const cached = localStorage.getItem('store_settings');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Failed to parse cached settings', e);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('public:store_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, (payload) => {
        console.log('Settings update:', payload);
        if (payload.new) {
            const newSettings = payload.new as StoreSettings;
            setSettings(newSettings);
            localStorage.setItem('store_settings', JSON.stringify(newSettings));
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
      localStorage.setItem('store_settings', JSON.stringify(data));
      
      // If we have a logo and it wasn't cached (loading was true), give it a moment to display
      if (data.logo_url && loading) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading };
}
