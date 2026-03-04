import { supabase } from '../lib/supabase';
import { Delivery, Order, Rider, StoreSettings } from '../lib/types';
import { mapService } from './mapService';
import { settingsService } from './settingsService';

export const deliveryService = {
  async createDelivery(orderId: string, riderId: string, customerAddress: string, customerLat: number, customerLng: number) {
    // 1. Get Store Settings for Restaurant Location and Fee Params
    const settings = await settingsService.getSettings();
    if (!settings.latitude || !settings.longitude) {
      throw new Error('Restaurant location not set in settings');
    }

    // 2. Get Route from OSRM (Distance & Time)
    const route = await mapService.getRoute(
      settings.latitude,
      settings.longitude,
      customerLat,
      customerLng
    );

    let distanceKm = 0;
    let estimatedMinutes = 0;

    if (route) {
        distanceKm = route.distance_km;
        estimatedMinutes = route.estimated_minutes;
    } else {
        // Fallback to straight line
        distanceKm = mapService.calculateDistance(
            settings.latitude,
            settings.longitude,
            customerLat,
            customerLng
        );
        estimatedMinutes = Math.ceil(distanceKm * 5); // Fallback: 5 mins per km
    }

    // 3. Get Order to check if fee is already set
    const { data: order } = await supabase
        .from('orders')
        .select('delivery_fee')
        .eq('id', orderId)
        .single();

    let deliveryFee = 0;

    if (order && order.delivery_fee !== undefined && order.delivery_fee !== null) {
        deliveryFee = order.delivery_fee;
    } else {
        // Calculate Fee if not in order
        const baseFee = settings.delivery_base_fee || 0;
        const perKmFee = settings.delivery_per_km_fee || 0;
        deliveryFee = parseFloat((baseFee + (perKmFee * distanceKm)).toFixed(2));
    }

    // 4. Create Delivery Record
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .insert([{
        order_id: orderId,
        rider_id: riderId,
        restaurant_lat: settings.latitude,
        restaurant_lng: settings.longitude,
        customer_lat: customerLat,
        customer_lng: customerLng,
        customer_address: customerAddress,
        distance_km: distanceKm,
        delivery_fee: deliveryFee,
        estimated_minutes: estimatedMinutes,
        status: 'assigned',
        tracking_url: '', // Will update after getting ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (deliveryError) throw deliveryError;

    // 5. Update Tracking URL
    const trackingUrl = `${window.location.origin}/track/${delivery.id}`;
    await supabase
      .from('deliveries')
      .update({ tracking_url: trackingUrl })
      .eq('id', delivery.id);

    // 6. Update Order with Delivery Fee (ensure it's saved if it wasn't)
    await supabase
      .from('orders')
      .update({ 
        delivery_fee: deliveryFee,
      })
      .eq('id', orderId);

    // 7. Update Rider Status
    await supabase
      .from('riders')
      .update({ status: 'busy' })
      .eq('id', riderId);

    return { ...delivery, tracking_url: trackingUrl };
  },

  async getDelivery(id: string) {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        rider:riders(*),
        order:orders(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Delivery;
  },

  async updateRiderLocation(deliveryId: string, lat: number, lng: number, heading?: number) {
    const { error } = await supabase
      .from('deliveries')
      .update({
        rider_current_lat: lat,
        rider_current_lng: lng,
        rider_heading: heading,
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryId);
    
    if (error) throw error;
  },

  async updateStatus(deliveryId: string, status: Delivery['status']) {
    const { data: delivery, error: fetchError } = await supabase
      .from('deliveries')
      .select('rider_id')
      .eq('id', deliveryId)
      .single();
      
    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('deliveries')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryId);
    
    if (error) throw error;

    // If delivered or cancelled, free up the rider
    if (status === 'delivered' || status === 'cancelled') {
      await supabase
        .from('riders')
        .update({ 
          status: 'available',
          total_deliveries: status === 'delivered' ? undefined : undefined // We might want to increment total_deliveries if delivered
        })
        .eq('id', delivery.rider_id);
      
      if (status === 'delivered') {
        // Increment total deliveries manually since we don't have RPC
        const { data: rider } = await supabase
          .from('riders')
          .select('total_deliveries')
          .eq('id', delivery.rider_id)
          .single();
        
        if (rider) {
          await supabase
            .from('riders')
            .update({ total_deliveries: (rider.total_deliveries || 0) + 1 })
            .eq('id', delivery.rider_id);
        }
      }
    }
  }
};
