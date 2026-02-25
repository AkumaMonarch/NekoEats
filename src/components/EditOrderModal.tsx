import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Order } from '../lib/types';

interface EditOrderModalProps {
  order: {
    id: string;
    order_code: string;
    customer_name: string;
    customer_phone: string;
    delivery_address?: string;
    notes?: string;
    service_option: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Order>) => Promise<void>;
}

interface OrderFormData {
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  notes?: string;
}

export default function EditOrderModal({ order, isOpen, onClose, onSave }: EditOrderModalProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<OrderFormData>();

  useEffect(() => {
    if (order) {
      reset({
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        delivery_address: order.delivery_address || '',
        notes: order.notes || ''
      });
    }
  }, [order, reset]);

  if (!isOpen || !order) return null;

  const onSubmit = async (data: OrderFormData) => {
    await onSave(order.id, data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1c110c] rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Order #{order.order_code}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-white ml-1">Customer Name</label>
            <input
              {...register('customer_name', { required: 'Name is required' })}
              className="w-full h-12 px-4 rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              placeholder="John Doe"
            />
            {errors.customer_name && <p className="text-red-500 text-xs ml-1">{errors.customer_name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-white ml-1">Phone Number</label>
            <input
              {...register('customer_phone', { required: 'Phone is required' })}
              className="w-full h-12 px-4 rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              placeholder="+1234567890"
            />
            {errors.customer_phone && <p className="text-red-500 text-xs ml-1">{errors.customer_phone.message}</p>}
          </div>

          {order.service_option === 'delivery' && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 dark:text-white ml-1">Delivery Address</label>
              <textarea
                {...register('delivery_address', { required: 'Address is required for delivery' })}
                className="w-full h-24 p-4 rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-slate-900 dark:text-white focus:ring-primary focus:border-primary resize-none"
                placeholder="Enter delivery address"
              />
              {errors.delivery_address && <p className="text-red-500 text-xs ml-1">{errors.delivery_address.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-white ml-1">Notes</label>
            <textarea
              {...register('notes')}
              className="w-full h-24 p-4 rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-slate-900 dark:text-white focus:ring-primary focus:border-primary resize-none"
              placeholder="Special instructions..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-white/10 font-bold text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
