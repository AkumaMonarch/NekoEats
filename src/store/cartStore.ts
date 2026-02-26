import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem, Variant, Addon } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';

interface CartState {
  items: CartItem[];
  addItem: (item: MenuItem, quantity: number, variant?: Variant, addons?: Addon[], instructions?: string) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity, variant, addons = [], instructions = '') => {
        const cartId = uuidv4();
        // Additive pricing: Base Price + Variant Price
        const price = item.price + (variant ? variant.price : 0);
        const addonsPrice = addons.reduce((sum, addon) => sum + addon.price, 0);
        
        // Check if identical item exists
        // simplified for now, just add new item
        
        const newItem: CartItem = {
          ...item,
          cartId,
          price: price, // This is now the effective unit price (Base + Variant)
          selectedVariant: variant,
          selectedAddons: addons,
          quantity,
          instructions,
        };

        set((state) => ({ items: [...state.items, newItem] }));
      },
      removeItem: (cartId) => {
        set((state) => ({ items: state.items.filter((i) => i.cartId !== cartId) }));
      },
      updateQuantity: (cartId, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.cartId === cartId ? { ...i, quantity: Math.max(0, quantity) } : i
          ).filter(i => i.quantity > 0),
        }));
      },
      clearCart: () => set({ items: [] }),
      total: () => {
        const items = get().items;
        return items.reduce((sum, item) => {
            // item.price is the effective unit price (Base + Variant) set in addItem
            const itemPrice = item.price;
            const addonsPrice = item.selectedAddons.reduce((aSum, addon) => aSum + addon.price, 0);
            return sum + (itemPrice + addonsPrice) * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'neko-eats-cart',
    }
  )
);
