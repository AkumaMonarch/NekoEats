import { supabase } from '../lib/supabase';
import { Rider } from '../lib/types';

export const riderService = {
  async getRiders() {
    const { data, error } = await supabase
      .from('riders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Rider[];
  },

  async getAvailableRiders() {
    const { data, error } = await supabase
      .from('riders')
      .select('*')
      .eq('status', 'available')
      .order('total_deliveries', { ascending: true });
    
    if (error) throw error;
    return data as Rider[];
  },

  async createRider(rider: Omit<Rider, 'id' | 'created_at' | 'total_deliveries' | 'status'>) {
    const { data, error } = await supabase
      .from('riders')
      .insert([{ ...rider, total_deliveries: 0, status: 'offline' }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Rider;
  },

  async updateRider(id: string, updates: Partial<Rider>) {
    const { data, error } = await supabase
      .from('riders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Rider;
  },

  async deleteRider(id: string) {
    const { error } = await supabase
      .from('riders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async toggleAvailability(id: string, currentStatus: Rider['status']) {
    const newStatus = currentStatus === 'offline' ? 'available' : 'offline';
    // If busy, we probably shouldn't toggle to offline directly without finishing delivery, 
    // but for now let's just allow toggling between available/offline.
    // If status is 'busy', maybe we set to 'offline' (rider goes offline after delivery) or keep as is?
    // The requirement says "Toggle rider availability".
    
    const { data, error } = await supabase
      .from('riders')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Rider;
  }
};
