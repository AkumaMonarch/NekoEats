import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export function AdminNavbar() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#120c0a]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 px-4 pt-3 pb-8 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <Link to="/admin" className="group flex flex-col items-center gap-1">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
            location.pathname === '/admin' ? "bg-primary/10 text-primary" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/admin' && "fill-1")}>analytics</span>
          </div>
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-[0.05em]",
            location.pathname === '/admin' ? "text-primary" : "text-slate-400 dark:text-white/40"
          )}>Analytics</span>
        </Link>

        <Link to="/admin/orders" className="group flex flex-col items-center gap-1">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
            location.pathname === '/admin/orders' ? "bg-primary/10 text-primary" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/admin/orders' && "fill-1")}>receipt_long</span>
          </div>
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-[0.05em]",
            location.pathname === '/admin/orders' ? "text-primary" : "text-slate-400 dark:text-white/40"
          )}>Orders</span>
        </Link>

        <Link to="/admin/menu" className="group flex flex-col items-center gap-1">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
            location.pathname === '/admin/menu' ? "bg-primary/10 text-primary" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/admin/menu' && "fill-1")}>restaurant_menu</span>
          </div>
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-[0.05em]",
            location.pathname === '/admin/menu' ? "text-primary" : "text-slate-400 dark:text-white/40"
          )}>Menu</span>
        </Link>

        <Link to="/admin/categories" className="group flex flex-col items-center gap-1">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
            location.pathname === '/admin/categories' ? "bg-primary/10 text-primary" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/admin/categories' && "fill-1")}>category</span>
          </div>
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-[0.05em]",
            location.pathname === '/admin/categories' ? "text-primary" : "text-slate-400 dark:text-white/40"
          )}>Cats</span>
        </Link>

        <Link to="/admin/settings" className="group flex flex-col items-center gap-1">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
            location.pathname === '/admin/settings' ? "bg-primary/10 text-primary" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/admin/settings' && "fill-1")}>settings</span>
          </div>
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-[0.05em]",
            location.pathname === '/admin/settings' ? "text-primary" : "text-slate-400 dark:text-white/40"
          )}>Settings</span>
        </Link>
      </div>
    </nav>
  );
}
