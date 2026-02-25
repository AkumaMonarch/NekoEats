import React, { useEffect, useState } from 'react';
import { orderService } from '../services/orderService';
import { format } from 'date-fns';
import { Order } from '../lib/types';

interface OrderStatusHistoryModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onRevert: (id: string, status: string) => Promise<void>;
}

interface HistoryItem {
  id: string;
  order_id: string;
  old_status: string;
  new_status: string;
  changed_at: string;
}

export default function OrderStatusHistoryModal({ order, isOpen, onClose, onRevert }: OrderStatusHistoryModalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (order && isOpen) {
      fetchHistory();
    }
  }, [order, isOpen]);

  const fetchHistory = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const data = await orderService.getOrderHistory(order.id);
      setHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  const getStatusLabel = (status: string | null) => {
    if (!status) return 'Unknown';
    if (status === 'pending') return 'Received';
    if (status === 'preparing') return 'In Kitchen';
    if (status === 'ready') return 'Ready';
    if (status === 'completed') return 'Done';
    if (status === 'awaiting_confirmation') return 'Confirming';
    if (status === 'cancelled') return 'Cancelled';
    return status.toUpperCase();
  };

  const handleRevert = async (item: HistoryItem) => {
    if (confirm(`Are you sure you want to revert status to ${getStatusLabel(item.old_status)}?`)) {
      await onRevert(order.id, item.old_status);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1c110c] rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#1c110c] sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">History #{order.order_code}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : (
            <div className="relative pl-8 border-l-2 border-gray-200 dark:border-white/10 space-y-8 ml-2">
              {history.length > 0 ? (
                history.map((item, index) => (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-[41px] top-0 h-5 w-5 rounded-full bg-primary border-4 border-white dark:border-[#1c110c] z-10"></div>
                    
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {format(new Date(item.changed_at), 'dd MMM yyyy, HH:mm')}
                      </span>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-500 dark:text-slate-400 line-through text-sm">
                              {getStatusLabel(item.old_status)}
                          </span>
                          <span className="material-symbols-outlined text-sm text-slate-400">arrow_forward</span>
                          <span className="font-bold text-primary text-lg">
                              {getStatusLabel(item.new_status)}
                          </span>
                      </div>

                      {/* Only allow reverting the most recent change */}
                      {index === 0 && item.old_status && (
                          <button 
                              onClick={() => handleRevert(item)}
                              className="mt-1 text-xs bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg w-fit flex items-center gap-2 transition-colors border border-gray-200 dark:border-white/10"
                          >
                              <span className="material-symbols-outlined text-sm">undo</span>
                              Revert to Previous Status
                          </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic text-sm">No status changes recorded yet.</div>
              )}
              
              {/* Initial Creation */}
              <div className="relative">
                  <div className="absolute -left-[41px] top-0 h-5 w-5 rounded-full bg-gray-300 dark:bg-white/20 border-4 border-white dark:border-[#1c110c] z-10"></div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">Order Created</span>
                    <span className="text-xs text-slate-500">Initial status: {getStatusLabel('awaiting_confirmation')}</span>
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
