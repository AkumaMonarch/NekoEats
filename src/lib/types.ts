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

export interface StoreSettings {
  id: string;
  restaurant_name: string;
  is_open: boolean;
  opening_time: string; // Deprecated, kept for backward compatibility if needed
  closing_time: string; // Deprecated
  schedule?: WeeklySchedule;
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
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  created_at: string;
  payment_method: 'cash' | 'card';
}
