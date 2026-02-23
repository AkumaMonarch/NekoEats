import React from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { AnimatePresence, motion } from 'framer-motion';

export function CartFooter() {
  const { items, total } = useCartStore();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = total();

  if (cartCount === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-white via-white to-transparent dark:from-background-dark dark:via-background-dark pb-8">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="max-w-md mx-auto"
        >
          <Link
            to="/cart"
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-between px-6 active:scale-[0.97] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">
                {cartCount}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium opacity-90 uppercase tracking-wider">Total</span>
                <span className="text-lg leading-none">${cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">Order Now</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </div>
          </Link>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
