import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { orderService } from '../../services/orderService';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
  order_items: any[];
}

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const scrollRef = useDraggableScroll();

  useEffect(() => {
    fetchOrders();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Real-time update:', payload);
        fetchOrders(); // Refresh data on any change
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getOrders(activeTab === 'all' ? undefined : activeTab);
      setOrders(data as any[]);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
        await orderService.updateOrderStatus(id, status);
        fetchOrders(); // Refresh list
    } catch (error) {
        console.error('Failed to update status:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
        order.customer_name.toLowerCase().includes(query) ||
        order.order_code.toLowerCase().includes(query) ||
        order.customer_phone.includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#0c0605] text-slate-900 dark:text-white">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0c0605]/95 backdrop-blur-xl px-5 py-4 border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center justify-between mb-4">
            {isSearchOpen ? (
                <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="Search orders..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-[#160e0c] border border-white/10 rounded-full text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                    </div>
                    <button 
                        onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery('');
                        }}
                        className="h-10 w-10 rounded-full bg-[#160e0c] border border-white/10 flex items-center justify-center active:scale-95 transition-transform text-white/70 hover:text-white"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>
            ) : (
                <>
                    <div>
                        <h1 className="text-xl font-bold">Live Orders</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-bold text-primary uppercase tracking-wider">{orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length} Active</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={fetchOrders} 
                            className="h-10 w-10 rounded-full bg-[#160e0c] border border-white/10 flex items-center justify-center active:scale-95 transition-transform text-white/70 hover:text-white"
                            title="Refresh Orders"
                        >
                            <span className="material-symbols-outlined text-[20px]">refresh</span>
                        </button>
                        <button 
                            onClick={() => setIsSearchOpen(true)}
                            className="h-10 w-10 rounded-full bg-[#160e0c] border border-white/10 flex items-center justify-center active:scale-95 transition-transform text-white/70 hover:text-white"
                            title="Search Orders"
                        >
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </button>
                    </div>
                </>
            )}
        </div>
        
        <div 
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto hide-scrollbar cursor-grab select-none"
        >
            {['All', 'Pending', 'Preparing', 'Ready', 'Completed'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={cn(
                        "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors",
                        activeTab === tab.toLowerCase()
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                    )}
                >
                    {tab}
                </button>
            ))}
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto">
        {loading ? (
            <div className="space-y-4">
                {[1,2,3].map(i => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        ) : filteredOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
                <p>{searchQuery ? 'No matching orders found' : 'No orders found'}</p>
            </div>
        ) : (
            filteredOrders.map((order) => (
                <div 
                    key={order.id}
                    className={cn(
                        "rounded-2xl border transition-all overflow-hidden",
                        expandedOrder === order.id 
                            ? "bg-white dark:bg-[#160e0c] border-primary/50 shadow-lg ring-1 ring-primary/20" 
                            : "bg-white dark:bg-[#160e0c] border-gray-200 dark:border-white/5"
                    )}
                >
                    <div 
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                                <span className={cn(
                                    "px-2 py-1 rounded-lg text-xs font-bold h-fit",
                                    expandedOrder === order.id ? "bg-primary text-white" : "bg-gray-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                                )}>
                                    {order.order_code}
                                </span>
                                <div>
                                    <h3 className="font-bold text-base">{order.customer_name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        <span className="material-symbols-outlined text-sm">call</span>
                                        <span>{order.customer_phone}</span>
                                        <span>•</span>
                                        <span>{order.order_items.length} Items</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider",
                                    order.status === 'pending' ? "text-primary" : "text-slate-400"
                                )}>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
                                {expandedOrder !== order.id && (
                                    <span className="material-symbols-outlined text-slate-400">expand_more</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {expandedOrder === order.id && (
                        <div className="px-4 pb-4 pt-0 border-t border-dashed border-gray-200 dark:border-white/10 mt-2">
                            {/* Status Tracker */}
                            <div className="flex justify-between items-center py-6 px-2 relative">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-white/10 -z-10 -translate-y-1/2"></div>
                                {['pending', 'preparing', 'ready', 'completed'].map((step, idx) => {
                                    const steps = ['pending', 'preparing', 'ready', 'completed'];
                                    const currentIdx = steps.indexOf(order.status);
                                    const stepIdx = steps.indexOf(step);
                                    const isActive = stepIdx <= currentIdx;
                                    const isCurrent = stepIdx === currentIdx;

                                    return (
                                        <div key={step} className="flex flex-col items-center gap-2 bg-white dark:bg-[#160e0c] px-1 z-10">
                                            <div className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center relative transition-colors",
                                                isActive ? "bg-primary text-white" : "bg-gray-200 dark:bg-white/10 text-slate-400"
                                            )}>
                                                <span className="material-symbols-outlined text-sm">
                                                    {step === 'pending' && 'receipt_long'}
                                                    {step === 'preparing' && 'skillet'}
                                                    {step === 'ready' && 'check'}
                                                    {step === 'completed' && 'done_all'}
                                                </span>
                                                {isCurrent && <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full border border-[#160e0c]"></span>}
                                            </div>
                                            <span className={cn(
                                                "text-[9px] font-bold uppercase",
                                                isActive ? "text-primary" : "text-slate-400"
                                            )}>{step}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Actions */}
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Customer</p>
                                    <p className="font-bold text-lg">{order.customer_phone}</p>
                                </div>
                                <a href={`tel:${order.customer_phone}`} className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">call</span>
                                    CALL
                                </a>
                            </div>

                            {/* Items */}
                            <div className="space-y-4 mb-6">
                                {order.order_items.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-sm uppercase">{item.quantity}x {item.name}</p>
                                            {(item.selected_variant || (item.selected_addons && item.selected_addons.length > 0) || item.instructions) && (
                                                <div className="pl-2 border-l-2 border-gray-200 dark:border-white/10 mt-1 space-y-1">
                                                    {item.selected_variant && (
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                            Variant: {item.selected_variant.name}
                                                        </div>
                                                    )}
                                                    {item.selected_addons && item.selected_addons.map((addon: any) => (
                                                        <div key={addon.id} className="flex items-center gap-1 text-xs text-primary font-bold">
                                                            <span className="material-symbols-outlined text-[10px]">add_circle</span>
                                                            {addon.name.toUpperCase()}
                                                        </div>
                                                    ))}
                                                    {item.instructions && (
                                                        <div className="text-xs text-slate-500 italic">
                                                            "{item.instructions}"
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-bold text-slate-400">${item.price.toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-200 dark:border-white/10">
                                    <span className="font-bold text-sm">TOTAL</span>
                                    <span className="font-black text-lg text-primary">${order.total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="py-3 rounded-xl border border-gray-200 dark:border-white/10 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5">
                                            <span className="material-symbols-outlined text-lg">edit_note</span>
                                            EDIT
                                        </button>
                                        <button 
                                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                            className="py-3 rounded-xl border border-red-500/20 text-red-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-500/10"
                                        >
                                            <span className="material-symbols-outlined text-lg">close</span>
                                            REJECT
                                        </button>
                                    </div>
                                    
                                    {order.status === 'pending' && (
                                        <button 
                                            onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                            className="w-full py-4 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                        >
                                            START PREPARING
                                            <span className="material-symbols-outlined text-lg">skillet</span>
                                        </button>
                                    )}
                                    {order.status === 'preparing' && (
                                        <button 
                                            onClick={() => handleStatusUpdate(order.id, 'ready')}
                                            className="w-full py-4 rounded-xl bg-green-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                        >
                                            MARK AS READY
                                            <span className="material-symbols-outlined text-lg">check_circle</span>
                                        </button>
                                    )}
                                    {order.status === 'ready' && (
                                        <button 
                                            onClick={() => handleStatusUpdate(order.id, 'completed')}
                                            className="w-full py-4 rounded-xl bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
                                        >
                                            COMPLETE ORDER
                                            <span className="material-symbols-outlined text-lg">done_all</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))
        )}
      </main>
    </div>
  );
}
