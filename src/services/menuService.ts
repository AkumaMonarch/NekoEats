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
    try {
      // 1. Fetch completed orders with their items
      // We limit to last 500 completed orders to keep it performant without backend aggregation
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_items (
            menu_item_id,
            quantity
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(100); // Reduced limit for safety

      if (ordersError) {
          console.error('Error fetching orders for popular items:', ordersError);
          return this.getFallbackPopularItems();
      }

      // 2. Aggregate sales count
      const itemCounts: Record<string, number> = {};
      
      if (ordersData) {
          ordersData.forEach((order: any) => {
            if (order.order_items && Array.isArray(order.order_items)) {
                order.order_items.forEach((item: any) => {
                  if (item.menu_item_id) {
                    itemCounts[item.menu_item_id] = (itemCounts[item.menu_item_id] || 0) + (item.quantity || 1);
                  }
                });
            }
          });
      }

      // 3. Sort by count descending
      const sortedItemIds = Object.entries(itemCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 6) // Top 6
        .map(([id]) => id);

      // 4. Fetch menu item details
      if (sortedItemIds.length > 0) {
        const { data: menuItems, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .in('id', sortedItemIds);
          
        if (menuError) throw menuError;

        // Sort the result to match the popularity order (since .in() doesn't preserve order)
        const sortedMenuItems = sortedItemIds
          .map(id => menuItems?.find(item => item.id === id))
          .filter(item => item !== undefined) as MenuItem[];
          
        return sortedMenuItems;
      }
      
      // Fallback if no sales data found
      return this.getFallbackPopularItems();
    } catch (error) {
      console.error('Error fetching popular items by sales:', error);
      return this.getFallbackPopularItems();
    }
  },

  async getFallbackPopularItems() {
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
