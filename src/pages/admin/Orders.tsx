import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { orderService } from '../../services/orderService';
import { riderService } from '../../services/riderService';
import { deliveryService } from '../../services/deliveryService';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import { ReceiptPrinter } from '../../components/ReceiptPrinter';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import OrderStatusHistoryModal from '../../components/OrderStatusHistoryModal';
import { Order as BaseOrder, Rider } from '../../lib/types';

interface Order extends Omit<BaseOrder, 'items'> {
  order_items: any[];
  delivery?: any;
}

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null);
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<Order | null>(null);
  const [availableRiders, setAvailableRiders] = useState<Rider[]>([]);
  const [assigningRider, setAssigningRider] = useState(false);
  const [orderCounts, setOrderCounts] = useState({
    pending: 0,
    received: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0
  });
  const { settings } = useStoreSettings();
  
  const scrollRef = useDraggableScroll();

  const fetchOrders = React.useCallback(async () => {
    try {
      let statusFilter = activeTab === 'all' ? undefined : activeTab;
      
      // Special handling for 'delivery' tab - we fetch all active orders and filter client-side or use a custom query
      // For simplicity, if tab is 'delivery', we fetch 'all' (or active) and filter in the UI, 
      // BUT getOrders logic currently filters by status if provided.
      // So if tab is 'delivery', we pass undefined to get all active orders, then filter.
      if (activeTab === 'delivery') {
          statusFilter = undefined;
      }

      const [ordersData, countsData] = await Promise.all([
        orderService.getOrders(statusFilter, searchQuery),
        orderService.getOrderCounts()
      ]);
      
      let finalOrders = ordersData as any[];
      
      if (activeTab === 'delivery') {
          finalOrders = finalOrders.filter((o: any) => o.service_option === 'delivery' && o.status !== 'completed' && o.status !== 'cancelled');
      }

      setOrders(finalOrders);
      setOrderCounts(countsData as any);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchOrders();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders(); // Refresh data on any change
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchOrders]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
        await orderService.updateOrderStatus(id, status);
        fetchOrders(); // Refresh list
    } catch (error) {
        console.error('Failed to update status:', error);
    }
  };

  const handleRevertStatus = async (id: string, status: string) => {
    try {
      await orderService.updateOrderStatus(id, status);
      fetchOrders();
      setHistoryOrder(null);
    } catch (error) {
      console.error('Failed to revert status:', error);
      alert('Failed to revert status');
    }
  };

  const openAssignRiderModal = async (order: Order) => {
    setSelectedOrderForDelivery(order);
    try {
      const riders = await riderService.getAvailableRiders();
      setAvailableRiders(riders);
      setIsRiderModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch riders:', error);
      alert('Failed to fetch available riders');
    }
  };

  const handleAssignRider = async (riderId: string) => {
    if (!selectedOrderForDelivery) return;
    setAssigningRider(true);
    try {
      // Use delivery_lat/lng if available, otherwise fallback to 0,0 (which will fail distance calc if not handled)
      // We assume order has coordinates or we can't calculate fee accurately.
      // If not, we might need to geocode or just use 0 distance.
      const lat = selectedOrderForDelivery.delivery_lat || 0;
      const lng = selectedOrderForDelivery.delivery_lng || 0;
      const address = selectedOrderForDelivery.delivery_address || 'Unknown Address';

      if (lat === 0 && lng === 0) {
        if (!window.confirm("This order has no delivery coordinates (Google Maps Link was not provided). The delivery fee calculation might be inaccurate. Proceed?")) {
            setAssigningRider(false);
            return;
        }
      }

      await deliveryService.createDelivery(
        selectedOrderForDelivery.id,
        riderId,
        address,
        lat,
        lng
      );
      
      setIsRiderModalOpen(false);
      setSelectedOrderForDelivery(null);
      fetchOrders();
      alert('Rider assigned successfully!');
    } catch (error) {
      console.error('Failed to assign rider:', error);
      alert('Failed to assign rider. Ensure restaurant location is set in settings.');
    } finally {
      setAssigningRider(false);
    }
  };

  const filteredOrders = orders; // Filtering is now handled by the API/Supabase query

  const statusColors = {
    all: { bg: 'bg-primary', text: 'text-primary', border: 'border-primary/50', shadow: 'shadow-primary/20', ring: 'ring-primary/20', bgLight: 'bg-primary/10', textLight: 'text-primary' },
    received: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500/50', shadow: 'shadow-blue-500/20', ring: 'ring-blue-500/20', bgLight: 'bg-blue-500/10', textLight: 'text-blue-600 dark:text-blue-400' },
    preparing: { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500/50', shadow: 'shadow-amber-500/20', ring: 'ring-amber-500/20', bgLight: 'bg-amber-500/10', textLight: 'text-amber-600 dark:text-amber-400' },
    ready: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500/50', shadow: 'shadow-emerald-500/20', ring: 'ring-emerald-500/20', bgLight: 'bg-emerald-500/10', textLight: 'text-emerald-600 dark:text-emerald-400' },
    delivery: { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500/50', shadow: 'shadow-purple-500/20', ring: 'ring-purple-500/20', bgLight: 'bg-purple-500/10', textLight: 'text-purple-600 dark:text-purple-400' },
    completed: { bg: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-500/50', shadow: 'shadow-slate-500/20', ring: 'ring-slate-500/20', bgLight: 'bg-slate-500/10', textLight: 'text-slate-600 dark:text-slate-400' },
    cancelled: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500/50', shadow: 'shadow-red-500/20', ring: 'ring-red-500/20', bgLight: 'bg-red-500/10', textLight: 'text-red-600 dark:text-red-400' },
  };

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
            {['All', 'Received', 'Preparing', 'Ready', 'Delivery', 'Completed', 'Cancelled'].map((tab) => {
                const statusKey = tab.toLowerCase();
                // For 'delivery' tab, we might need a custom count or just rely on filtering
                const count = statusKey === 'all' ? 0 : 
                              statusKey === 'delivery' ? orders.filter(o => o.service_option === 'delivery' && o.status !== 'completed' && o.status !== 'cancelled').length :
                              orderCounts[statusKey as keyof typeof orderCounts] || 0;
                
                const colors = statusColors[statusKey as keyof typeof statusColors] || statusColors.all;
                
                return (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(statusKey)}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors flex items-center gap-2",
                            activeTab === tab.toLowerCase()
                                ? `${colors.bg} text-white shadow-lg ${colors.shadow}`
                                : "bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                        )}
                    >
                        {tab}
                        {tab !== 'All' && count > 0 && (
                            <span className={cn(
                                "h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-[10px]",
                                activeTab === tab.toLowerCase()
                                    ? `bg-white ${colors.textLight}`
                                    : "bg-gray-200 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                            )}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        ) : filteredOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
                <p>{searchQuery ? 'No matching orders found' : 'No orders found'}</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                {filteredOrders.map((order) => {
                    const cardColors = statusColors[order.status as keyof typeof statusColors] || statusColors.all;
                    
                    return (
                    <div 
                        key={order.id}
                        className={cn(
                            "rounded-2xl border transition-all overflow-hidden relative",
                            expandedOrder === order.id 
                                ? `bg-white dark:bg-[#160e0c] ${cardColors.border} shadow-lg ring-1 ${cardColors.ring}` 
                                : `bg-white dark:bg-[#160e0c] border-gray-200 dark:border-white/5 hover:${cardColors.border}`
                        )}
                    >
                        {/* Left border accent */}
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", cardColors.bg)}></div>

                    <div 
                        className="p-4 pl-5 cursor-pointer"
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                        <div className="flex gap-4">
                            {/* Left: Large Icon */}
                            <div className={cn(
                                "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
                                cardColors.bgLight, cardColors.textLight, cardColors.border
                            )}>
                                <span className="material-symbols-outlined text-3xl">
                                    {order.service_option === 'delivery' ? 'two_wheeler' : 'shopping_bag'}
                                </span>
                            </div>

                            {/* Right: Content */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                {/* Top Line: Code & Time */}
                                <div className="flex justify-between items-center mb-1">
                                    <span className={cn("px-2.5 py-1 rounded-lg text-base font-black", cardColors.bgLight, cardColors.textLight)}>
                                        {order.order_code}
                                    </span>
                                    <span className="text-xs font-medium text-slate-400">
                                        {(() => {
                                            const diffInMinutes = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);
                                            if (diffInMinutes < 60) return `${diffInMinutes} mins`;
                                            const hours = Math.floor(diffInMinutes / 60);
                                            const mins = diffInMinutes % 60;
                                            return `${hours}h ${mins}m`;
                                        })()}
                                    </span>
                                </div>

                                {/* Middle Line: Name */}
                                <h3 className="font-bold text-sm truncate text-slate-700 dark:text-slate-300 mb-1">
                                    {order.customer_name}
                                </h3>

                                {/* Bottom Line: Details & Expand */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="font-medium">{order.order_items.length} {order.order_items.length === 1 ? 'Item' : 'Items'}</span>
                                        <span className="text-[10px]">•</span>
                                        <span className="font-bold text-slate-900 dark:text-white">Rs {(order.total + (order.delivery_fee || 0)).toFixed(2)}</span>
                                    </div>
                                    {expandedOrder !== order.id && (
                                        <span className="material-symbols-outlined text-slate-400 text-lg">expand_more</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {expandedOrder === order.id && (
                        <div className="px-4 pb-4 pt-0 border-t border-dashed border-gray-200 dark:border-white/10 mt-2">
                            {/* Status Tracker */}
                            <div className="flex justify-between items-center py-6 px-2 relative">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-white/10 -z-10 -translate-y-1/2"></div>
                                {['received', 'preparing', 'ready', 'completed'].map((step, idx) => {
                                    const steps = ['received', 'preparing', 'ready', 'completed'];
                                    let currentIdx = steps.indexOf(order.status);
                                    
                                    // Adjust current index for delivery orders that are picked up
                                    if (order.service_option === 'delivery' && order.delivery?.status === 'picked_up' && order.status === 'ready') {
                                        // We stay at 'ready' step but label changes to 'Out for Delivery'
                                        // If we want to show it as "further along", we'd need more steps.
                                        // For now, keeping it at 'ready' index is fine as long as label is clear.
                                    }
                                    // If order status is not in the list (e.g. cancelled), handle gracefully
                                    if (currentIdx === -1 && order.status !== 'cancelled') return null;
                                    
                                    const stepIdx = steps.indexOf(step);
                                    const isActive = stepIdx <= currentIdx;
                                    const isCurrent = stepIdx === currentIdx;

                                    let label = step;
                                    if (step === 'received') label = 'Received';
                                    if (step === 'preparing') label = 'Preparing';
                                    if (step === 'ready') {
                                        if (order.service_option === 'delivery') {
                                            if (order.delivery?.status === 'picked_up') label = 'Out for Delivery';
                                            else if (order.delivery?.status === 'delivered') label = 'Delivered';
                                            else label = 'Ready for Rider';
                                        } else {
                                            label = 'Ready for Pickup';
                                        }
                                    }
                                    if (step === 'completed') label = 'Done';
                                    
                                    return (
                                        <div key={step} className="flex flex-col items-center gap-2 bg-white dark:bg-[#160e0c] px-1 z-10">
                                            <div className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center relative transition-all duration-500",
                                                isActive ? "bg-primary text-white" : "bg-gray-200 dark:bg-white/10 text-slate-400",
                                                isCurrent && "ring-4 ring-primary/20 shadow-[0_0_15px_rgba(238,91,43,0.5)] scale-110"
                                            )}>
                                                {isCurrent && (
                                                    <span className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping"></span>
                                                )}
                                                <span className="material-symbols-outlined text-sm">
                                                    {step === 'received' && 'receipt_long'}
                                                    {step === 'preparing' && 'skillet'}
                                                    {step === 'ready' && (
                                                        order.service_option === 'delivery' ? 'two_wheeler' : 'shopping_bag'
                                                    )}
                                                    {step === 'completed' && 'done_all'}
                                                </span>
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase transition-colors duration-300",
                                                isActive ? "text-primary" : "text-slate-400"
                                            )}>
                                                {label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Actions */}
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Customer</p>
                                    <p className="font-bold text-base">{order.customer_phone}</p>
                                </div>
                                <a href={`tel:${order.customer_phone}`} className="bg-green-500 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5">
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
                                                            {item.selected_variant.price > 0 && ` (+ Rs ${item.selected_variant.price.toFixed(2)})`}
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
                                        <span className="font-bold text-slate-400">
                                            {item.price === 0 ? 'Free' : `Rs ${item.price.toFixed(2)}`}
                                        </span>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-dashed border-gray-200 dark:border-white/10 space-y-2">
                                    {order.vat_amount > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-xs text-slate-400 uppercase">VAT</span>
                                            <span className="font-bold text-sm text-slate-500 dark:text-slate-400">Rs {order.vat_amount?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {order.delivery_fee > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-xs text-slate-400 uppercase">Delivery Fee</span>
                                            <span className="font-bold text-sm text-slate-500 dark:text-slate-400">Rs {order.delivery_fee?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-sm">TOTAL</span>
                                        <span className="font-black text-lg text-primary">
                                            {(order.total + (order.delivery_fee || 0)) === 0 ? 'Free' : `Rs ${(order.total + (order.delivery_fee || 0)).toFixed(2)}`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        <button 
                                            onClick={() => setPrintingOrder(order)}
                                            className="py-3 rounded-xl border border-gray-200 dark:border-white/10 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-white/5"
                                        >
                                            <span className="material-symbols-outlined text-lg">print</span>
                                            PRINT
                                        </button>
                                        <button 
                                            onClick={() => setHistoryOrder(order)}
                                            className="py-3 rounded-xl border border-gray-200 dark:border-white/10 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-white/5"
                                        >
                                            <span className="material-symbols-outlined text-lg">history</span>
                                            HISTORY
                                        </button>
                                        <button 
                                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                            className="py-3 rounded-xl border border-red-500/20 text-red-500 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-red-500/10"
                                        >
                                            <span className="material-symbols-outlined text-lg">close</span>
                                            REJECT
                                        </button>
                                    </div>
                                    
                                    {order.status === 'received' && (
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
                                    
                                    {order.service_option === 'delivery' && order.status !== 'completed' && order.status !== 'cancelled' && (
                                        <div className="flex gap-2">
                                            {!order.delivery ? (
                                                <button 
                                                    onClick={() => openAssignRiderModal(order)}
                                                    className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                                                >
                                                    <span className="material-symbols-outlined text-lg">two_wheeler</span>
                                                    ASSIGN RIDER
                                                </button>
                                            ) : (
                                                <a 
                                                    href={`/track/${order.delivery.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                                >
                                                    <span className="material-symbols-outlined text-lg">location_on</span>
                                                    TRACK RIDER
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                );
                })}
            </div>
        )}
      </main>
      
      <ReceiptPrinter 
        order={printingOrder} 
        settings={settings} 
        onAfterPrint={() => setPrintingOrder(null)} 
      />

      {historyOrder && (
        <OrderStatusHistoryModal
          order={historyOrder}
          isOpen={!!historyOrder}
          onClose={() => setHistoryOrder(null)}
          onRevert={handleRevertStatus}
        />
      )}

      {isRiderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e1411] w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">Assign Rider</h2>
            <p className="text-sm text-slate-500 mb-6">Select an available rider for this delivery.</p>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {availableRiders.length === 0 ? (
                <p className="text-center text-slate-400 py-4">No riders available.</p>
              ) : (
                availableRiders.map(rider => (
                  <button
                    key={rider.id}
                    onClick={() => handleAssignRider(rider.id)}
                    disabled={assigningRider}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                  >
                    <div>
                      <p className="font-bold">{rider.name}</p>
                      <p className="text-xs text-slate-500">{rider.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold bg-green-100 text-green-600 px-2 py-1 rounded-lg">AVAILABLE</span>
                      <p className="text-[10px] text-slate-400 mt-1">{rider.total_deliveries} deliveries</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setIsRiderModalOpen(false)}
              className="w-full mt-6 py-3 rounded-xl font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
