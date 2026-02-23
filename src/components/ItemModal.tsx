import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem, Addon, Variant } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import { cn } from '../lib/utils';

interface ItemModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemModal({ item, isOpen, onClose }: ItemModalProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
    item.variants ? item.variants[0] : undefined
  );
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [instructions, setInstructions] = useState('');

  const basePrice = selectedVariant ? selectedVariant.price : item.price;
  const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const totalPrice = (basePrice + addonsPrice) * quantity;

  const handleAddToCart = () => {
    addItem(item, quantity, selectedVariant, selectedAddons, instructions);
    onClose();
  };

  const toggleAddon = (addon: Addon) => {
    if (selectedAddons.find((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-md bg-white dark:bg-[#221510] rounded-t-3xl sm:rounded-2xl overflow-hidden h-[90vh] flex flex-col shadow-2xl"
        >
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-50 h-8 w-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/30 transition-colors"
            >
                <span className="material-symbols-outlined">close</span>
            </button>

            {/* Content */}
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-32">
                {/* Header Image */}
                <div className="relative h-64 w-full shrink-0">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                </div>

                <div className="px-6 pt-6 pb-4">
                    <div className="flex justify-between items-start gap-4 mb-2">
                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight flex-1">{item.name}</h2>
                        <span className="bg-primary/10 text-primary text-sm font-bold px-2 py-1 rounded-lg shrink-0">
                            ${basePrice.toFixed(2)}
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        {item.description}
                    </p>
                </div>

                <div className="h-px bg-gray-100 dark:bg-white/5 mx-6"></div>

                {/* Variants */}
                {item.variants && (
                    <div className="px-6 py-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Choose your size</h3>
                            <span className="bg-gray-100 dark:bg-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">Required</span>
                        </div>
                        <div className="space-y-3">
                            {item.variants.map((variant) => (
                                <label 
                                    key={variant.id}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        selectedVariant?.id === variant.id 
                                            ? "border-primary bg-primary/5" 
                                            : "border-gray-200 dark:border-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="radio" 
                                            name="variant" 
                                            className="hidden" 
                                            checked={selectedVariant?.id === variant.id}
                                            onChange={() => setSelectedVariant(variant)}
                                        />
                                        <span className={cn(
                                            "material-symbols-outlined",
                                            selectedVariant?.id === variant.id ? "text-primary" : "text-gray-300"
                                        )}>
                                            {selectedVariant?.id === variant.id ? 'radio_button_checked' : 'radio_button_unchecked'}
                                        </span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{variant.name}</span>
                                    </div>
                                    <span className="text-sm font-medium text-primary">${variant.price.toFixed(2)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="h-px bg-gray-100 dark:bg-white/5 mx-6"></div>

                {/* Addons */}
                {item.addons && (
                    <div className="px-6 py-6 space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add toppings</h3>
                        <div className="space-y-1">
                            {item.addons.map((addon) => {
                                const isSelected = !!selectedAddons.find(a => a.id === addon.id);
                                return (
                                    <div key={addon.id} className="flex items-center justify-between py-3">
                                        <label className="flex items-center gap-3 cursor-pointer select-none" onClick={() => toggleAddon(addon)}>
                                            <div className={cn(
                                                "w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-colors",
                                                isSelected ? "border-primary bg-primary" : "border-gray-300 dark:border-white/20"
                                            )}>
                                                {isSelected && <span className="material-symbols-outlined text-white text-sm font-bold">check</span>}
                                            </div>
                                            <span className="text-slate-800 dark:text-slate-200 font-medium">{addon.name}</span>
                                        </label>
                                        <span className="text-sm font-semibold text-primary">+${addon.price.toFixed(2)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="h-px bg-gray-100 dark:bg-white/5 mx-6"></div>

                {/* Instructions */}
                <div className="px-6 py-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Special Instructions</h3>
                    <textarea 
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:border-primary focus:ring-primary text-sm p-4 placeholder-gray-400"
                        placeholder="Add a note (e.g., no onions, sauce on the side...)"
                        rows={3}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 inset-x-0 bg-white dark:bg-[#221510] border-t border-gray-100 dark:border-white/5 px-6 py-4 pb-8 sm:pb-4 z-20">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-full p-1 h-14">
                        <button 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-white/10 shadow-sm active:scale-90 transition-transform"
                        >
                            <span className="material-symbols-outlined text-xl text-slate-600 dark:text-white">remove</span>
                        </button>
                        <span className="w-10 text-center font-bold text-slate-900 dark:text-white">{quantity}</span>
                        <button 
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-white/10 shadow-sm active:scale-90 transition-transform"
                        >
                            <span className="material-symbols-outlined text-xl text-slate-600 dark:text-white">add</span>
                        </button>
                    </div>
                    <button 
                        onClick={handleAddToCart}
                        className="flex-1 bg-primary h-14 rounded-full flex items-center justify-center gap-2 px-6 text-white font-bold transition-transform active:scale-[0.98] shadow-lg shadow-primary/20"
                    >
                        <span className="text-base">Add</span>
                        <span className="text-base">•</span>
                        <span className="text-base">${totalPrice.toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
