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
          className="relative z-10 w-full max-w-md bg-white dark:bg-[#221510] h-[100dvh] sm:h-[90vh] sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        >
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/30 transition-colors active:scale-90"
            >
                <span className="material-symbols-outlined">close</span>
            </button>

            {/* Content */}
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-24">
                {/* Header Image */}
                <div className="relative h-64 w-full shrink-0">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-6 right-6">
                        <h2 className="text-2xl font-black text-white leading-tight mb-1">{item.name}</h2>
                        <span className="text-white/90 font-bold text-lg">
                            Rs {basePrice.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="px-6 pt-4 pb-3">
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                        {item.description}
                    </p>
                </div>

                <div className="h-px bg-black/5 dark:bg-white/5 mx-6"></div>

                {/* Variants */}
                {item.variants && (
                    <div className="px-6 py-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Choose size</h3>
                            <span className="bg-[#E25E3E]/10 text-[#E25E3E] text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">Required</span>
                        </div>
                        <div className="space-y-2">
                            {item.variants.map((variant) => (
                                <div 
                                    key={variant.id}
                                    onClick={() => setSelectedVariant(variant)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.99]",
                                        selectedVariant?.id === variant.id 
                                            ? "border-[#E25E3E] bg-[#E25E3E]/5" 
                                            : "border-black/5 dark:border-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                                            selectedVariant?.id === variant.id ? "border-[#E25E3E]" : "border-slate-300"
                                        )}>
                                            {selectedVariant?.id === variant.id && <div className="h-2 w-2 rounded-full bg-[#E25E3E]" />}
                                        </div>
                                        <span className="font-bold text-sm text-slate-900 dark:text-white">{variant.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">Rs {variant.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="h-px bg-black/5 dark:bg-white/5 mx-6"></div>

                {/* Addons */}
                {item.addons && (
                    <div className="px-6 py-4 space-y-3">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Add toppings</h3>
                        <div className="space-y-1">
                            {item.addons.map((addon) => {
                                const isSelected = !!selectedAddons.find(a => a.id === addon.id);
                                return (
                                    <label key={addon.id} className="flex items-center justify-between py-2 cursor-pointer active:opacity-70" onClick={() => toggleAddon(addon)}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-5 h-5 rounded flex items-center justify-center transition-colors border-2",
                                                isSelected ? "border-[#E25E3E] bg-[#E25E3E]" : "border-slate-300 dark:border-white/20"
                                            )}>
                                                {isSelected && <span className="material-symbols-outlined text-white text-xs font-bold">check</span>}
                                            </div>
                                            <span className="text-sm text-slate-900 dark:text-white font-bold">{addon.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">+ Rs {addon.price.toFixed(2)}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="h-px bg-black/5 dark:bg-white/5 mx-6"></div>

                {/* Instructions */}
                <div className="px-6 py-4 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Special Instructions</h3>
                    <textarea 
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="w-full rounded-xl border-none bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#E25E3E]/50 text-sm p-3 placeholder-slate-400 font-medium resize-none"
                        placeholder="Add a note (e.g., no onions, sauce on the side...)"
                        rows={3}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 inset-x-0 bg-white dark:bg-[#221510] border-t border-black/5 dark:border-white/5 px-4 py-3 pb-6 sm:pb-4 z-20">
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-xl p-1 h-10">
                        <button 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-8 h-full flex items-center justify-center rounded-lg bg-white dark:bg-white/10 shadow-sm active:scale-90 transition-transform"
                        >
                            <span className="material-symbols-outlined text-base text-slate-900 dark:text-white">remove</span>
                        </button>
                        <span className="w-8 text-center font-bold text-sm text-slate-900 dark:text-white">{quantity}</span>
                        <button 
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-8 h-full flex items-center justify-center rounded-lg bg-white dark:bg-white/10 shadow-sm active:scale-90 transition-transform"
                        >
                            <span className="material-symbols-outlined text-base text-slate-900 dark:text-white">add</span>
                        </button>
                    </div>
                    <button 
                        onClick={handleAddToCart}
                        className="flex-1 bg-[#E25E3E] h-10 rounded-xl flex items-center justify-center gap-2 px-4 text-white font-bold transition-transform active:scale-[0.98] shadow-lg shadow-[#E25E3E]/20"
                    >
                        <span className="material-symbols-outlined text-lg">shopping_basket</span>
                        <span className="text-sm uppercase tracking-wider">Add</span>
                        <span className="text-sm opacity-50">•</span>
                        <span className="text-sm">Rs {totalPrice.toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
