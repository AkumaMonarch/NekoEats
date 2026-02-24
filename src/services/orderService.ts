import { supabase } from '../lib/supabase';
import { Order, CartItem } from '../lib/types';

export const orderService = {
  async createOrder(order: {
    customer_name: string;
    customer_phone: string;
    total: number;
    items: CartItem[];
    payment_method: string;
    service_option: string;
    delivery_address?: string;
    notes?: string;
    webhookUrl?: string;
  }) {
    // 1. Create Order
    const orderCode = '#' + Math.floor(100 + Math.random() * 900).toString(); // Simple 3 digit code
    const initialStatus = order.webhookUrl ? 'awaiting_confirmation' : 'pending';
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_code: orderCode,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        total: order.total,
        status: initialStatus,
        payment_method: order.payment_method,
        service_option: order.service_option,
        delivery_address: order.delivery_address,
        notes: order.notes
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

    // 3. Trigger Webhook if configured
    if (order.webhookUrl) {
        try {
            // Send the complete order data including items
            await fetch(order.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...orderData,
                    items: order.items // Send the original items structure which is richer
                })
            });
        } catch (error) {
            console.error('Failed to trigger webhook:', error);
            // We don't throw here because the order was created successfully
        }
    }

    return orderData;
  },

  async getOrders(status?: string) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async updateOrderStatus(id: string, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  }
};
