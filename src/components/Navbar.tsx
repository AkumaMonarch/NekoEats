import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useCartStore } from '../store/cartStore';

export function Navbar() {
  const location = useLocation();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) return null; // Admin has its own nav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#181311]/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 px-6 pt-3 pb-8 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <Link to="/" className="group flex flex-col items-center gap-1">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
            location.pathname === '/' ? "bg-primary/10 text-primary" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/' && "fill-1")}>home</span>
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-[0.05em]",
            location.pathname === '/' ? "text-primary" : "text-slate-400 dark:text-white/40"
          )}>Home</span>
        </Link>

        <Link to="/menu" className="group flex flex-col items-center gap-1">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
            location.pathname === '/menu' ? "bg-primary/10 text-primary" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/menu' && "fill-1")}>restaurant_menu</span>
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-[0.05em]",
            location.pathname === '/menu' ? "text-primary" : "text-slate-400 dark:text-white/40"
          )}>Menu</span>
        </Link>

        <Link to="/cart" className="group flex flex-col items-center gap-1 relative">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
            location.pathname === '/cart' ? "bg-primary/10 text-primary" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/cart' && "fill-1")}>shopping_bag</span>
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-[0.05em]",
            location.pathname === '/cart' ? "text-primary" : "text-slate-400 dark:text-white/40"
          )}>Cart</span>
          {cartCount > 0 && (
            <span className="absolute top-0 right-1 h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-[#181311]">
              {cartCount}
            </span>
          )}
        </Link>

        <Link to="/admin" className="group flex flex-col items-center gap-1">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
            location.pathname.startsWith('/admin') ? "bg-primary/10 text-primary" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40"
          )}>
            <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-[0.05em]",
            location.pathname.startsWith('/admin') ? "text-primary" : "text-slate-400 dark:text-white/40"
          )}>Admin</span>
        </Link>
      </div>
    </nav>
  );
}
