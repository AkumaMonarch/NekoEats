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
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'awaiting_confirmation';
  created_at: string;
  payment_method: 'cash' | 'card';
  service_option: string;
  delivery_address?: string;
  notes?: string;
}
