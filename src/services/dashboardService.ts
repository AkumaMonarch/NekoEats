import { supabase } from '../lib/supabase';

export interface DashboardStats {
  totalSales: number;
  totalVat: number;
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
  busyHours: {
    hour: string;
    count: number;
  }[];
  serviceOptionSplit: {
    name: string;
    value: number;
  }[];
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        vat_amount,
        created_at,
        service_option,
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
        totalVat: 0,
        totalOrders: 0,
        avgTicket: 0,
        topItems: [],
        categoryMix: [],
        busyHours: [],
        serviceOptionSplit: []
      };
    }

    // 1. Basic Stats
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalVat = orders.reduce((sum, order) => sum + (order.vat_amount || 0), 0);
    const totalOrders = orders.length;
    const avgTicket = totalSales / totalOrders;

    // 2. Process Items for Top Items and Category Mix
    const itemStats = new Map<string, { quantity: number; revenue: number; image_url?: string }>();
    const categoryStats = new Map<string, number>();
    const hourStats = new Map<number, number>();
    const serviceStats = new Map<string, number>();

    orders.forEach(order => {
      // Busy Hours
      const date = new Date(order.created_at);
      const hour = date.getHours();
      hourStats.set(hour, (hourStats.get(hour) || 0) + 1);

      // Service Option Split
      const service = order.service_option || 'delivery'; // Default to delivery if null
      serviceStats.set(service, (serviceStats.get(service) || 0) + 1);

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

    // 5. Format Busy Hours
    const busyHours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      count: hourStats.get(i) || 0
    }));

    // 6. Format Service Option Split
    const serviceOptionSplit = Array.from(serviceStats.entries())
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));

    return {
      totalSales,
      totalVat,
      totalOrders,
      avgTicket,
      topItems,
      categoryMix,
      busyHours,
      serviceOptionSplit
    };
  }
};
