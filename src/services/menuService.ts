import { supabase } from '../lib/supabase';
import { MenuItem } from '../lib/types';

export const menuService = {
  async getMenuItems() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as MenuItem[];
  },

  async getPopularItems() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('popular', true)
      .limit(6);

    if (error) throw error;
    return data as MenuItem[];
  },

  async getItemsByCategory(category: string) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category', category);

    if (error) throw error;
    return data as MenuItem[];
  },

  async toggleStock(id: string, inStock: boolean) {
    const { error } = await supabase
      .from('menu_items')
      .update({ in_stock: inStock })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteItem(id: string) {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async createItem(item: Omit<MenuItem, 'id'>) {
    const { data, error } = await supabase
      .from('menu_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data as MenuItem;
  },

  async updateItem(id: string, item: Partial<MenuItem>) {
    const { data, error } = await supabase
      .from('menu_items')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MenuItem;
  }
};
