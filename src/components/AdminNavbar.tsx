import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

interface AdminNavbarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function AdminNavbar({ isCollapsed = false, onToggle }: AdminNavbarProps) {
  const location = useLocation();

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#120c0a]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 px-4 pt-3 pb-8 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] md:top-0 md:bottom-0 md:border-t-0 md:border-r md:px-0 md:pt-8 md:pb-4 md:flex md:flex-col transition-all duration-300",
      isCollapsed ? "md:w-20" : "md:w-24 lg:w-64"
    )}>
      {/* Logo/Brand for Desktop */}
      <div className={cn(
        "hidden md:flex items-center mb-8 relative",
        isCollapsed ? "justify-center" : "justify-center lg:justify-start lg:px-8"
      )}>
        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0">
          N
        </div>
        <span className={cn(
          "font-bold text-xl tracking-tight ml-3",
          isCollapsed ? "hidden" : "hidden lg:block"
        )}>
          NekoEats
        </span>
        
        {/* Toggle Button */}
        {onToggle && (
          <button 
            onClick={onToggle}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-white dark:bg-[#1e1411] border border-gray-200 dark:border-white/10 rounded-full items-center justify-center text-slate-400 hover:text-primary transition-colors z-50"
          >
            <span className="material-symbols-outlined text-[14px]">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        )}
      </div>

      <div className="flex justify-between items-center max-w-md mx-auto md:flex-col md:max-w-none md:mx-0 md:gap-2 md:px-4 md:w-full">
        <Link to="/admin" className="group flex flex-col items-center gap-1 md:flex-row md:w-full md:px-4 md:py-3 md:rounded-xl md:hover:bg-slate-100 md:dark:hover:bg-white/5 transition-all">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 md:h-auto md:w-auto md:bg-transparent",
            location.pathname === '/admin' ? "bg-primary/10 text-primary md:bg-transparent" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40 md:group-hover:bg-transparent"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/admin' && "fill-1")}>analytics</span>
          </div>
          <span className={cn(
            "text-[9px] md:text-sm font-bold uppercase md:capitalize tracking-[0.05em] md:tracking-normal",
            location.pathname === '/admin' ? "text-primary" : "text-slate-400 dark:text-white/40",
            isCollapsed ? "md:hidden" : ""
          )}>
            <span className="md:hidden">Analytics</span>
            <span className={cn("hidden md:block lg:hidden", isCollapsed && "hidden")}>Stats</span>
            <span className={cn("hidden lg:block", isCollapsed && "lg:hidden")}>Analytics</span>
          </span>
        </Link>

        <Link to="/admin/orders" className="group flex flex-col items-center gap-1 md:flex-row md:w-full md:px-4 md:py-3 md:rounded-xl md:hover:bg-slate-100 md:dark:hover:bg-white/5 transition-all">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 md:h-auto md:w-auto md:bg-transparent",
            location.pathname === '/admin/orders' ? "bg-primary/10 text-primary md:bg-transparent" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40 md:group-hover:bg-transparent"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/admin/orders' && "fill-1")}>receipt_long</span>
          </div>
          <span className={cn(
            "text-[9px] md:text-sm font-bold uppercase md:capitalize tracking-[0.05em] md:tracking-normal",
            location.pathname === '/admin/orders' ? "text-primary" : "text-slate-400 dark:text-white/40",
            isCollapsed ? "md:hidden" : ""
          )}>
            <span className={cn("md:hidden lg:block", isCollapsed && "lg:hidden")}>Orders</span>
            <span className={cn("hidden md:block lg:hidden", isCollapsed && "hidden")}>Orders</span>
          </span>
        </Link>

        <Link to="/admin/riders" className="group flex flex-col items-center gap-1 md:flex-row md:w-full md:px-4 md:py-3 md:rounded-xl md:hover:bg-slate-100 md:dark:hover:bg-white/5 transition-all">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 md:h-auto md:w-auto md:bg-transparent",
            location.pathname === '/admin/riders' ? "bg-primary/10 text-primary md:bg-transparent" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40 md:group-hover:bg-transparent"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/admin/riders' && "fill-1")}>two_wheeler</span>
          </div>
          <span className={cn(
            "text-[9px] md:text-sm font-bold uppercase md:capitalize tracking-[0.05em] md:tracking-normal",
            location.pathname === '/admin/riders' ? "text-primary" : "text-slate-400 dark:text-white/40",
            isCollapsed ? "md:hidden" : ""
          )}>
            <span className={cn("md:hidden lg:block", isCollapsed && "lg:hidden")}>Riders</span>
            <span className={cn("hidden md:block lg:hidden", isCollapsed && "hidden")}>Riders</span>
          </span>
        </Link>

        <Link to="/admin/menu" className="group flex flex-col items-center gap-1 md:flex-row md:w-full md:px-4 md:py-3 md:rounded-xl md:hover:bg-slate-100 md:dark:hover:bg-white/5 transition-all">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 md:h-auto md:w-auto md:bg-transparent",
            location.pathname === '/admin/menu' ? "bg-primary/10 text-primary md:bg-transparent" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40 md:group-hover:bg-transparent"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/admin/menu' && "fill-1")}>restaurant_menu</span>
          </div>
          <span className={cn(
            "text-[9px] md:text-sm font-bold uppercase md:capitalize tracking-[0.05em] md:tracking-normal",
            location.pathname === '/admin/menu' ? "text-primary" : "text-slate-400 dark:text-white/40",
            isCollapsed ? "md:hidden" : ""
          )}>
            <span className={cn("md:hidden lg:block", isCollapsed && "lg:hidden")}>Menu</span>
            <span className={cn("hidden md:block lg:hidden", isCollapsed && "hidden")}>Menu</span>
          </span>
        </Link>

        <Link to="/admin/categories" className="group flex flex-col items-center gap-1 md:flex-row md:w-full md:px-4 md:py-3 md:rounded-xl md:hover:bg-slate-100 md:dark:hover:bg-white/5 transition-all">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 md:h-auto md:w-auto md:bg-transparent",
            location.pathname === '/admin/categories' ? "bg-primary/10 text-primary md:bg-transparent" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40 md:group-hover:bg-transparent"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/admin/categories' && "fill-1")}>category</span>
          </div>
          <span className={cn(
            "text-[9px] md:text-sm font-bold uppercase md:capitalize tracking-[0.05em] md:tracking-normal",
            location.pathname === '/admin/categories' ? "text-primary" : "text-slate-400 dark:text-white/40",
            isCollapsed ? "md:hidden" : ""
          )}>
            <span className={cn("md:hidden lg:block", isCollapsed && "lg:hidden")}>Categories</span>
            <span className={cn("hidden md:block lg:hidden", isCollapsed && "hidden")}>Cats</span>
          </span>
        </Link>

        <Link to="/admin/settings" className="group flex flex-col items-center gap-1 md:flex-row md:w-full md:px-4 md:py-3 md:rounded-xl md:hover:bg-slate-100 md:dark:hover:bg-white/5 transition-all">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 md:h-auto md:w-auto md:bg-transparent",
            location.pathname === '/admin/settings' ? "bg-primary/10 text-primary md:bg-transparent" : "group-hover:bg-slate-100 dark:group-hover:bg-white/5 text-slate-400 dark:text-white/40 md:group-hover:bg-transparent"
          )}>
            <span className={cn("material-symbols-outlined text-[24px]", location.pathname === '/admin/settings' && "fill-1")}>settings</span>
          </div>
          <span className={cn(
            "text-[9px] md:text-sm font-bold uppercase md:capitalize tracking-[0.05em] md:tracking-normal",
            location.pathname === '/admin/settings' ? "text-primary" : "text-slate-400 dark:text-white/40",
            isCollapsed ? "md:hidden" : ""
          )}>
            <span className={cn("md:hidden lg:block", isCollapsed && "lg:hidden")}>Settings</span>
            <span className={cn("hidden md:block lg:hidden", isCollapsed && "hidden")}>Settings</span>
          </span>
        </Link>
      </div>
    </nav>
  );
}
