import { supabase } from '../lib/supabase';

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  avgTicket: number;
  topItems: {
    name: string;
    quantity: number;
    revenue: number;
    image_url?: string;
  }[];
  categoryMix: {
    category: string;
    percentage: number;
    revenue: number;
  }[];
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        created_at,
        order_items (
          quantity,
          price,
          name,
          menu_items (
            category,
            image_url
          )
        )
      `)
      .neq('status', 'cancelled'); // Exclude cancelled orders

    if (error) throw error;

    if (!orders || orders.length === 0) {
      return {
        totalSales: 0,
        totalOrders: 0,
        avgTicket: 0,
        topItems: [],
        categoryMix: []
      };
    }

    // 1. Basic Stats
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const avgTicket = totalSales / totalOrders;

    // 2. Process Items for Top Items and Category Mix
    const itemStats = new Map<string, { quantity: number; revenue: number; image_url?: string }>();
    const categoryStats = new Map<string, number>();

    orders.forEach(order => {
      order.order_items.forEach((item: any) => {
        // Top Items
        const currentItem = itemStats.get(item.name) || { quantity: 0, revenue: 0, image_url: item.menu_items?.image_url };
        itemStats.set(item.name, {
          quantity: currentItem.quantity + item.quantity,
          revenue: currentItem.revenue + (item.price * item.quantity),
          image_url: item.menu_items?.image_url || currentItem.image_url
        });

        // Category Mix
        const category = item.menu_items?.category || 'other';
        const currentCatRevenue = categoryStats.get(category) || 0;
        categoryStats.set(category, currentCatRevenue + (item.price * item.quantity));
      });
    });

    // 3. Format Top Items
    const topItems = Array.from(itemStats.entries())
      .map(([name, stats]) => ({
        name,
        ...stats
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 4. Format Category Mix
    const totalItemRevenue = Array.from(categoryStats.values()).reduce((a, b) => a + b, 0);
    const categoryMix = Array.from(categoryStats.entries())
      .map(([category, revenue]) => ({
        category,
        revenue,
        percentage: totalItemRevenue > 0 ? Math.round((revenue / totalItemRevenue) * 100) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalSales,
      totalOrders,
      avgTicket,
      topItems,
      categoryMix
    };
  }
};
