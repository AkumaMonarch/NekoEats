import React, { useEffect } from 'react';
import { Order, StoreSettings } from '../lib/types';
import { format } from 'date-fns';

interface ReceiptPrinterProps {
  order: any | null; // Using any for flexibility with the joined data structure
  settings: StoreSettings | null;
  onAfterPrint: () => void;
}

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({ order, settings, onAfterPrint }) => {
  useEffect(() => {
    if (order) {
      // Small delay to ensure DOM is updated and images loaded before printing
      const timer = setTimeout(() => {
        window.print();
        // We don't automatically clear the order here to avoid flickering if the user cancels print
        // But the parent can handle it or we can just leave it rendered but hidden
        onAfterPrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [order, onAfterPrint]);

  if (!order) return null;

  return (
    <div className="hidden print:block">
      <style>
        {`
          @media print {
            @page { margin: 0; size: auto; }
            body * {
              visibility: hidden;
            }
            #receipt-root-container, #receipt-root-container * {
              visibility: visible;
            }
            #receipt-root-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
      </style>
      <div id="receipt-root-container">
        <div className="w-[300px] mx-auto p-2 text-black font-mono text-sm leading-tight bg-white">
            {/* Header */}
            <div className="text-center mb-4">
            {settings?.logo_url && (
                <img src={settings.logo_url} alt="Logo" className="w-16 h-16 mx-auto mb-2 grayscale object-contain" />
            )}
            <h1 className="font-bold text-xl uppercase mb-1">{settings?.restaurant_name || 'Restaurant'}</h1>
            {settings?.business_phone && <p className="text-xs">Tel: {settings.business_phone}</p>}
            </div>

            {/* Order Info */}
            <div className="border-b border-dashed border-black pb-2 mb-2">
                <div className="flex justify-between">
                    <span>Order #:</span>
                    <span className="font-bold">{order.order_code}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{order.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy HH:mm') : ''}</span>
                </div>
            </div>

            {/* Customer */}
            <div className="border-b border-dashed border-black pb-2 mb-2">
                <p className="font-bold uppercase">{order.customer_name}</p>
                <p>{order.customer_phone}</p>
                <p className="mt-1 font-bold uppercase">{order.service_option} {order.service_option === 'delivery' && '- DELIVERY'}</p>
                {order.service_option === 'delivery' && order.delivery_address && (
                    <p className="text-xs mt-1">{order.delivery_address}</p>
                )}
            </div>

            {/* Items */}
            <div className="border-b border-dashed border-black pb-2 mb-2 space-y-2">
                {order.order_items?.map((item: any, index: number) => (
                    <div key={index}>
                        <div className="flex justify-between font-bold">
                            <span>{item.quantity}x {item.name}</span>
                            <span>Rs {item.price.toFixed(2)}</span>
                        </div>
                        {/* Variants & Addons */}
                        <div className="pl-4 text-xs">
                            {item.selected_variant && (
                                <div>+ {item.selected_variant.name}</div>
                            )}
                            {item.selected_addons && item.selected_addons.map((addon: any, idx: number) => (
                                <div key={idx}>+ {addon.name}</div>
                            ))}
                            {item.instructions && (
                                <div className="italic">"{item.instructions}"</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Totals */}
            <div className="border-b border-dashed border-black pb-2 mb-2">
                {order.vat_amount > 0 && (
                    <div className="flex justify-between text-xs mb-1">
                        <span>VAT:</span>
                        <span>Rs {order.vat_amount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-1">
                    <span>TOTAL</span>
                    <span>Rs {order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                    <span>Payment:</span>
                    <span className="uppercase">{order.payment_method}</span>
                </div>
            </div>

            {/* Notes */}
            {order.notes && (
                <div className="border-b border-dashed border-black pb-2 mb-2">
                    <p className="font-bold text-xs">NOTES:</p>
                    <p className="text-xs">{order.notes}</p>
                </div>
            )}

            {/* Footer */}
            <div className="text-center mt-4 text-xs">
                <p>Thank you for your order!</p>
            </div>
        </div>
      </div>
    </div>
  );
};
