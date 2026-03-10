import { supabase } from '../lib/supabase';
import { Order, CartItem } from '../lib/types';

export const orderService = {
  async createOrder(order: {
    customer_name: string;
    customer_phone: string;
    total: number;
    vat_amount?: number;
    items: CartItem[];
    payment_method: string;
    service_option: string;
    delivery_address?: string;
    delivery_lat?: number;
    delivery_lng?: number;
    google_maps_link?: string;
    delivery_fee?: number;
    notes?: string;
  }) {
    // 1. Create Order
    // Generate a 6-digit order code using timestamp and random numbers to avoid collisions
    const timestampPart = Date.now().toString().slice(-3);
    const randomPart = Math.floor(100 + Math.random() * 900).toString();
    const orderCode = '#' + timestampPart + randomPart;
    const initialStatus = 'pending'; // Changed to pending for MVP simplicity
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_code: orderCode,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        total: order.total,
        vat_amount: order.vat_amount || 0,
        status: initialStatus,
        payment_method: order.payment_method,
        service_option: order.service_option,
        delivery_address: order.delivery_address,
        delivery_lat: order.delivery_lat,
        delivery_lng: order.delivery_lng,
        google_maps_link: order.google_maps_link,
        delivery_fee: order.delivery_fee,
        notes: order.notes,
        items: order.items // Save full items details as JSONB
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create Order Items
    const orderItems = order.items.map(item => ({
      order_id: orderData.id,
      menu_item_id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      selected_variant: item.selectedVariant,
      selected_addons: item.selectedAddons,
      instructions: item.instructions
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return orderData;
  },

  async getOrders(status?: string, searchQuery?: string) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        deliveries (*)
      `)
      .order('created_at', { ascending: false });

    // If there is a search query, search across ALL orders regardless of status
    if (searchQuery) {
      // Search by order code, customer name, or phone
      // Note: We use ilike for case-insensitive search
      query = query.or(`order_code.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%`);
    } else {
      // Normal filtering logic when NOT searching
      if (status && status !== 'all') {
        query = query.eq('status', status);
      } else {
        // By default, exclude awaiting_confirmation AND cancelled AND pending AND completed orders from the main list
        // This keeps the "All" view focused on active orders only
        query = query.neq('status', 'awaiting_confirmation');
        query = query.neq('status', 'cancelled');
        query = query.neq('status', 'pending');
        query = query.neq('status', 'completed');
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Transform data to attach the latest delivery if multiple exist (though usually 1)
    return data.map((order: any) => ({
      ...order,
      delivery: order.deliveries && order.deliveries.length > 0 ? order.deliveries[0] : null
    }));
  },

  async updateOrderStatus(id: string, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  async updateOrderDetails(id: string, updates: Partial<Order>) {
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async getOrderHistory(orderId: string) {
    const { data, error } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getOrderCounts() {
    const { data, error } = await supabase
      .from('orders')
      .select('status, service_option');

    if (error) throw error;

    const counts = {
      pending: 0,
      received: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
      delivery: 0
    };

    data?.forEach((order: any) => {
      if (order.status in counts) {
        counts[order.status as keyof typeof counts]++;
      }
      if (order.service_option === 'delivery' && order.status !== 'completed' && order.status !== 'cancelled') {
        counts.delivery++;
      }
    });

    return counts;
  },

  subscribeToOrders(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        callback(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }
};
