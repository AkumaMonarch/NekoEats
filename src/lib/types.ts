export type Category = string;

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  display_order: number;
}

export interface DaySchedule {
  isOpen: boolean;
  open: string;
  close: string;
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface ClosedDate {
  date: string;
  reason?: string;
}

export interface StoreSettings {
  id: string;
  restaurant_name: string;
  business_phone?: string;
  logo_url?: string;
  webhook_url?: string;
  is_open: boolean;
  opening_time: string; // Deprecated, kept for backward compatibility if needed
  closing_time: string; // Deprecated
  schedule?: WeeklySchedule;
  closed_dates?: ClosedDate[];
  is_delivery_enabled?: boolean;
  is_pickup_enabled?: boolean;
  vat_enabled?: boolean;
  vat_percentage?: number;
  address?: string;
  google_maps_url?: string;
  latitude?: number;
  longitude?: number;
  delivery_base_fee?: number;
  delivery_per_km_fee?: number;
  delivery_max_distance_enabled?: boolean;
  delivery_max_distance_km?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: Category;
  popular?: boolean;
  variants?: Variant[];
  addons?: Addon[];
  in_stock?: boolean;
}

export interface Variant {
  id: string;
  name: string;
  price: number;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem extends MenuItem {
  cartId: string;
  selectedVariant?: Variant;
  selectedAddons: Addon[];
  quantity: number;
  instructions?: string;
}

export interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  items: CartItem[];
  total: number;
  vat_amount?: number;
  status: 'pending' | 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'awaiting_confirmation';
  created_at: string;
  payment_method: 'cash' | 'card';
  service_option: string;
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  google_maps_link?: string;
  delivery_fee?: number;
  notes?: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'available' | 'busy' | 'offline';
  total_deliveries: number;
  created_at: string;
}

export interface Delivery {
  id: string;
  order_id: string;
  rider_id: string;
  restaurant_lat: number;
  restaurant_lng: number;
  customer_lat: number;
  customer_lng: number;
  customer_address: string;
  distance_km: number;
  delivery_fee: number;
  estimated_minutes: number;
  rider_current_lat?: number;
  rider_current_lng?: number;
  rider_heading?: number;
  status: 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  tracking_url: string;
  created_at: string;
  updated_at: string;
  rider?: Rider; // Joined field
  order?: Order; // Joined field
}
