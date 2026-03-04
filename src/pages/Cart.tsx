import React, { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { Link } from 'react-router-dom';
import { cn, extractCoordinates } from '../lib/utils';
import { orderService } from '../services/orderService';
import { useStoreSettings } from '../hooks/useStoreSettings';
import LocationPicker from '../components/LocationPicker';

export default function Cart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
  const [step, setStep] = useState<'cart' | 'service' | 'contact' | 'review' | 'success'>('cart');
  const [contact, setContact] = useState({ name: '', phone: '', address: '', notes: '', googleMapsLink: '' });
  const [loading, setLoading] = useState(false);
  const [serviceOption, setServiceOption] = useState<'delivery' | 'pickup'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile'>('cash');
  const { settings } = useStoreSettings();
  const [hasScrolledBottom, setHasScrolledBottom] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  
  // New state for delivery
  const [deliveryFee, setDeliveryFee] = useState(50); // Base fee default
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);

  useEffect(() => {
    const checkScroll = () => {
      const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;
      const isShort = document.documentElement.scrollHeight <= window.innerHeight;
      setHasScrolledBottom(isBottom || isShort);
    };

    window.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    
    // Check initially
    checkScroll();

    return () => {
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [step, items]);

  const cartTotal = total();
  const currentDeliveryFee = serviceOption === 'delivery' ? deliveryFee : 0;
  const vatAmount = settings?.vat_enabled ? (cartTotal * (settings.vat_percentage || 0) / 100) : 0;
  const finalTotal = cartTotal + currentDeliveryFee + vatAmount;
  const isOpen = settings?.is_open ?? true;

  const handleCheckout = () => {
    if (items.length === 0) return;
    if (!isOpen) {
        alert('Sorry, the store is currently closed.');
        return;
    }
    setStep('service');
  };

  const handleLocationSelect = (location: { address: string; lat: number; lng: number; distance: number; deliveryFee: number }) => {
      setContact(prev => ({ ...prev, address: location.address }));
      setDeliveryLat(location.lat);
      setDeliveryLng(location.lng);
      setDeliveryDistance(location.distance);
      setDeliveryFee(location.deliveryFee);
  };

  const handlePlaceOrder = async () => {
    if (!contact.name || !contact.phone) return;
    if (serviceOption === 'delivery' && !contact.address) {
        alert('Please provide a delivery address');
        return;
    }
    setLoading(true);

    try {
        // Create order in Supabase
        const order = await orderService.createOrder({
            customer_name: contact.name,
            customer_phone: contact.phone,
            total: finalTotal,
            vat_amount: vatAmount,
            items: items,
            payment_method: paymentMethod,
            service_option: serviceOption,
            delivery_address: contact.address,
            delivery_lat: deliveryLat || undefined,
            delivery_lng: deliveryLng || undefined,
            google_maps_link: contact.googleMapsLink,
            notes: contact.notes,
            // We could also save delivery_fee if the schema supported it, but it's part of total usually or separate
        });

        setOrderCode(order.order_code);
        setStep('success');
        
        setTimeout(() => {
            clearCart();
        }, 3000);
    } catch (error) {
        console.error('Failed to place order:', error);
        alert('Failed to place order. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  const handleClearCart = () => {
    clearCart();
    setStep('cart');
    setContact({ name: '', phone: '', address: '', notes: '', googleMapsLink: '' });
    setServiceOption('pickup');
    setPaymentMethod('cash');
    setDeliveryFee(50);
    setDeliveryLat(null);
    setDeliveryLng(null);
  };

  if (step === 'success') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 text-center">
            <div className="mb-8 h-32 w-32 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                <span className="material-symbols-outlined text-white text-[72px]">check_circle</span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">Order Placed!</h1>
            {orderCode && (
                <div className="bg-white dark:bg-white/10 px-6 py-3 rounded-xl border border-gray-100 dark:border-white/10 mb-6 shadow-sm">
                    <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1">Order Number</p>
                    <p className="text-3xl font-black text-primary tracking-widest">{orderCode}</p>
                </div>
            )}
            <p className="text-lg text-slate-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
                You will receive a confirmation shortly.
            </p>
            <Link to="/" className="bg-gray-100 dark:bg-white/10 text-slate-900 dark:text-white font-bold px-8 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                Back to Home
            </Link>
        </div>
    );
  }

  if (step === 'review') {
    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
            <header className="bg-white dark:bg-[#1c110c] border-b border-gray-200 dark:border-white/5 sticky top-0 z-10 px-4 py-4 flex items-center justify-between">
                <button onClick={() => setStep('contact')} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-primary">arrow_back_ios_new</span>
                </button>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Review Order</h1>
                <button onClick={handleClearCart} className="h-10 w-10 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                </button>
            </header>

            <main className="flex-1 px-6 pt-6 max-w-md mx-auto w-full pb-32">
                <div className="flex justify-center gap-2 mb-8">
                    <div className="h-1.5 w-8 rounded-full bg-primary/20"></div>
                    <div className="h-1.5 w-8 rounded-full bg-primary/20"></div>
                    <div className="h-1.5 w-12 rounded-full bg-primary"></div>
                </div>

                <div className="space-y-6">
                    <section className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">Contact Details</h2>
                            <button onClick={() => setStep('contact')} className="text-primary text-sm font-bold uppercase tracking-wider">Edit</button>
                        </div>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-gray-400 uppercase tracking-wider font-bold">Name</p>
                                <p className="text-slate-900 dark:text-white font-medium text-base">{contact.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-gray-400 uppercase tracking-wider font-bold">Phone</p>
                                <p className="text-slate-900 dark:text-white font-medium text-base">{contact.phone}</p>
                            </div>
                            {serviceOption === 'delivery' && (
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-gray-400 uppercase tracking-wider font-bold">Address</p>
                                    <p className="text-slate-900 dark:text-white font-medium text-base">{contact.address}</p>
                                </div>
                            )}
                            {contact.notes && (
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-gray-400 uppercase tracking-wider font-bold">Notes</p>
                                    <p className="text-slate-900 dark:text-white font-medium text-base">{contact.notes}</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">Order Details</h2>
                            <button onClick={() => setStep('service')} className="text-primary text-sm font-bold uppercase tracking-wider">Edit</button>
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1">Service Option</p>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">
                                        {serviceOption === 'delivery' ? 'local_shipping' : 'store'}
                                    </span>
                                    <p className="text-slate-900 dark:text-white font-medium capitalize">{serviceOption}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1">Payment</p>
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="material-symbols-outlined text-primary text-lg">
                                        {paymentMethod === 'cash' ? 'payments' : 'account_balance_wallet'}
                                    </span>
                                    <p className="text-slate-900 dark:text-white font-medium capitalize">{paymentMethod === 'mobile' ? 'Mobile Pay' : 'Cash'}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Order Summary</h2>
                            <button onClick={() => setStep('cart')} className="text-primary text-xs font-bold uppercase tracking-wider">Edit</button>
                        </div>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.cartId} className="flex gap-3">
                                    <div className="h-12 w-12 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                <span className="text-primary mr-1">{item.quantity}x</span>
                                                {item.name}
                                            </h3>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {(item.price * item.quantity) === 0 ? 'Free' : `Rs ${(item.price * item.quantity).toFixed(2)}`}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-1">
                                            {item.selectedVariant?.name}
                                            {item.selectedAddons.length > 0 && `, ${item.selectedAddons.map(a => a.name).join(', ')}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-white/10 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-gray-400">Subtotal</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {cartTotal === 0 ? 'Free' : `Rs ${cartTotal.toFixed(2)}`}
                                </span>
                            </div>
                            {settings?.vat_enabled && (
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-slate-500 dark:text-gray-400 font-medium">VAT ({settings.vat_percentage}%)</span>
                                    <span className="font-bold text-slate-900 dark:text-white">Rs {vatAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-gray-400">Delivery Fee</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {currentDeliveryFee === 0 ? 'Free' : `Rs ${currentDeliveryFee.toFixed(2)}`}
                                </span>
                            </div>
                            <div className="flex justify-between items-end pt-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Total</span>
                                <span className="text-xl font-black text-primary">
                                    {finalTotal === 0 ? 'Free' : `Rs ${finalTotal.toFixed(2)}`}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-gray-100 dark:border-white/10 z-30">
                {!hasScrolledBottom && (
                    <div className="absolute bottom-full left-0 right-0 h-24 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none animate-pulse" />
                )}
                <div className="max-w-md mx-auto">
                    <button 
                        onClick={handlePlaceOrder}
                        disabled={loading || !hasScrolledBottom}
                        className={cn(
                            "w-full h-14 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all",
                            (loading || !hasScrolledBottom) && "opacity-50 cursor-not-allowed grayscale"
                        )}
                    >
                        {loading ? (
                            <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span>{hasScrolledBottom ? "Confirm Order" : "Scroll to Confirm"}</span>
                                <span className="material-symbols-outlined">{hasScrolledBottom ? "check" : "keyboard_double_arrow_down"}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
  }

  if (step === 'service') {
    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
            <header className="bg-white dark:bg-[#1c110c] border-b border-gray-200 dark:border-white/5 sticky top-0 z-10 px-4 py-4 flex items-center justify-between">
                <button onClick={() => setStep('cart')} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-primary">arrow_back_ios_new</span>
                </button>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Service Option</h1>
                <button onClick={handleClearCart} className="h-10 w-10 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                </button>
            </header>

            <main className="flex-1 px-6 pt-6 max-w-md mx-auto w-full pb-40">
                <div className="flex justify-center gap-2 mb-8">
                    <div className="h-1.5 w-12 rounded-full bg-primary"></div>
                    <div className="h-1.5 w-8 rounded-full bg-primary/20"></div>
                    <div className="h-1.5 w-8 rounded-full bg-primary/20"></div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">How would you like it?</h2>
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-8">Choose between pickup or delivery.</p>

                <div className="space-y-6">
                    {/* Service Option */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setServiceOption('pickup')}
                                className={cn(
                                    "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                                    serviceOption === 'pickup' 
                                        ? "border-primary bg-primary/5" 
                                        : "border-gray-100 dark:border-white/5 bg-white dark:bg-white/5"
                                )}
                            >
                                <span className="material-symbols-outlined text-2xl">store</span>
                                <span className="font-bold text-base">Pickup</span>
                            </button>
                            <button 
                                onClick={() => setServiceOption('delivery')}
                                className={cn(
                                    "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                                    serviceOption === 'delivery' 
                                        ? "border-primary bg-primary/5" 
                                        : "border-gray-100 dark:border-white/5 bg-white dark:bg-white/5"
                                )}
                            >
                                <span className="material-symbols-outlined text-2xl">local_shipping</span>
                                <span className="font-bold text-base">Delivery</span>
                            </button>
                        </div>
                    </div>

                    {serviceOption === 'delivery' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="space-y-2">
                                <label className="text-base font-bold text-slate-900 dark:text-white ml-1">Delivery Location</label>
                                <LocationPicker onLocationSelect={handleLocationSelect} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-base font-bold text-slate-900 dark:text-white ml-1">Address Details</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-4 text-gray-400">location_on</span>
                                    <textarea 
                                        value={contact.address}
                                        onChange={(e) => setContact({...contact, address: e.target.value})}
                                        className="w-full h-24 pl-12 pt-3 rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:ring-primary focus:border-primary resize-none"
                                        placeholder="Confirm or edit your address (e.g. Add Apt/Floor)"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-gray-100 dark:border-white/10 z-30">
                {!hasScrolledBottom && (
                    <div className="absolute bottom-full left-0 right-0 h-24 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none animate-pulse" />
                )}
                <div className="max-w-md mx-auto space-y-3">
                    <div className="flex justify-between px-2">
                        <span className="text-slate-500 font-medium">Total</span>
                        <span className="text-slate-900 dark:text-white font-bold text-lg">Rs {finalTotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={() => setStep('contact')}
                        disabled={(serviceOption === 'delivery' && !contact.address) || !hasScrolledBottom}
                        className={cn(
                            "w-full h-14 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all",
                            ((serviceOption === 'delivery' && !contact.address) || !hasScrolledBottom) && "opacity-50 cursor-not-allowed grayscale"
                        )}
                    >
                        <span>{hasScrolledBottom ? "Next Step" : "Scroll to Continue"}</span>
                        <span className="material-symbols-outlined">{hasScrolledBottom ? "arrow_forward" : "keyboard_double_arrow_down"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
  }

  if (step === 'contact') {
    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
            <header className="bg-white dark:bg-[#1c110c] border-b border-gray-200 dark:border-white/5 sticky top-0 z-10 px-4 py-4 flex items-center justify-between">
                <button onClick={() => setStep('service')} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-primary">arrow_back_ios_new</span>
                </button>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Contact Details</h1>
                <button onClick={handleClearCart} className="h-10 w-10 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                </button>
            </header>

            <main className="flex-1 px-6 pt-6 max-w-md mx-auto w-full pb-40">
                <div className="flex justify-center gap-2 mb-8">
                    <div className="h-1.5 w-8 rounded-full bg-primary/20"></div>
                    <div className="h-1.5 w-12 rounded-full bg-primary"></div>
                    <div className="h-1.5 w-8 rounded-full bg-primary/20"></div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verify contact details</h2>
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-8">We'll use these details to send you order tracking updates.</p>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-base font-bold text-slate-900 dark:text-white ml-1">Full Name</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</span>
                            <input 
                                type="text" 
                                value={contact.name}
                                onChange={(e) => setContact({...contact, name: e.target.value})}
                                className="w-full h-14 pl-12 rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-base font-bold text-slate-900 dark:text-white ml-1">Phone Number</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">smartphone</span>
                            <input 
                                type="tel" 
                                value={contact.phone}
                                onChange={(e) => setContact({...contact, phone: e.target.value})}
                                className="w-full h-14 pl-12 rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-3 pt-4 border-t border-dashed border-gray-200 dark:border-white/10">
                        <label className="text-base font-bold text-slate-900 dark:text-white ml-1">Payment Method</label>
                        <div className="space-y-3">
                            <button 
                                onClick={() => setPaymentMethod('cash')}
                                className={cn(
                                    "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all",
                                    paymentMethod === 'cash' 
                                        ? "border-primary bg-primary/5" 
                                        : "border-gray-100 dark:border-white/5 bg-white dark:bg-white/5"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-2xl text-primary">payments</span>
                                    <div className="text-left">
                                        <p className="font-bold text-base">Cash</p>
                                        <p className="text-xs text-slate-500">Pay with physical currency</p>
                                    </div>
                                </div>
                                {paymentMethod === 'cash' && <span className="material-symbols-outlined text-primary">check_circle</span>}
                            </button>
                            <button 
                                onClick={() => setPaymentMethod('mobile')}
                                className={cn(
                                    "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all",
                                    paymentMethod === 'mobile' 
                                        ? "border-primary bg-primary/5" 
                                        : "border-gray-100 dark:border-white/5 bg-white dark:bg-white/5"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-2xl text-primary">account_balance_wallet</span>
                                    <div className="text-left">
                                        <p className="font-bold text-base">Mobile Payment</p>
                                        <p className="text-xs text-slate-500">Apple Pay or Digital Wallets</p>
                                    </div>
                                </div>
                                {paymentMethod === 'mobile' && <span className="material-symbols-outlined text-primary">check_circle</span>}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-base font-bold text-slate-900 dark:text-white ml-1">Special Notes (Optional)</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-4 text-gray-400">chat</span>
                            <textarea 
                                value={contact.notes}
                                onChange={(e) => setContact({...contact, notes: e.target.value})}
                                className="w-full h-24 pl-12 pt-3 rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:ring-primary focus:border-primary resize-none"
                                placeholder="Any special instructions for the kitchen?"
                            />
                        </div>
                    </div>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-gray-100 dark:border-white/10 z-30">
                {!hasScrolledBottom && (
                    <div className="absolute bottom-full left-0 right-0 h-24 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none animate-pulse" />
                )}
                <div className="max-w-md mx-auto space-y-3">
                    <div className="flex justify-between px-2">
                        <span className="text-slate-500 font-medium">Total</span>
                        <span className="text-slate-900 dark:text-white font-bold text-lg">Rs {finalTotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={() => setStep('review')}
                        disabled={!contact.name || !contact.phone || !hasScrolledBottom}
                        className={cn(
                            "w-full h-14 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all",
                            (!contact.name || !contact.phone || !hasScrolledBottom) && "opacity-50 cursor-not-allowed grayscale"
                        )}
                    >
                        <span>{hasScrolledBottom ? "Review Order" : "Scroll to Review"}</span>
                        <span className="material-symbols-outlined">{hasScrolledBottom ? "arrow_forward" : "keyboard_double_arrow_down"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-32">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
        <button onClick={() => window.history.back()} className="h-10 w-10 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_back_ios_new</span>
        </button>
        <h1 className="font-bold text-xl text-slate-900 dark:text-white">Checkout</h1>
        {items.length > 0 ? (
            <button onClick={handleClearCart} className="h-10 w-10 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <span className="material-symbols-outlined">delete</span>
            </button>
        ) : (
            <div className="w-10"></div>
        )}
      </header>

      <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
        {items.length === 0 ? (
            <div className="text-center py-20">
                <div className="h-24 w-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-4xl text-gray-400">shopping_cart_off</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your cart is empty</h2>
                <p className="text-slate-500 mb-8">Looks like you haven't added anything yet.</p>
                <Link to="/menu" className="bg-primary text-white font-bold px-8 py-3 rounded-full">Browse Menu</Link>
            </div>
        ) : (
            <>
                <section className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 px-1">Order Summary</h2>
                    {items.map((item) => (
                        <div key={item.cartId} className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex gap-4">
                            <div className="h-16 w-16 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{item.name}</h3>
                                    <p className="text-base font-bold text-primary">
                                        {(item.price + item.selectedAddons.reduce((s, a) => s + a.price, 0)) === 0 ? 'Free' : `Rs ${(item.price + item.selectedAddons.reduce((s, a) => s + a.price, 0)).toFixed(2)}`}
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 line-clamp-1">
                                    {item.selectedVariant?.name}
                                    {item.selectedAddons.length > 0 && `, ${item.selectedAddons.map(a => a.name).join(', ')}`}
                                </p>
                                <div className="flex items-center justify-between mt-3">
                                    <button onClick={() => removeItem(item.cartId)} className="text-gray-400 hover:text-red-500">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-full px-2 py-1">
                                        <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)} className="h-6 w-6 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm">
                                            <span className="material-symbols-outlined text-sm">remove</span>
                                        </button>
                                        <span className="text-sm font-bold min-w-[12px] text-center text-slate-900 dark:text-white">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)} className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                                            <span className="material-symbols-outlined text-sm">add</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Service Option and Payment Method moved to Contact step */}

                <section className="bg-white dark:bg-white/5 rounded-2xl p-4 space-y-2 border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-gray-400">Subtotal</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                            {cartTotal === 0 ? 'Free' : `Rs ${cartTotal.toFixed(2)}`}
                        </span>
                    </div>
                    {settings?.vat_enabled && (
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-slate-500 dark:text-gray-400 font-medium">VAT ({settings.vat_percentage}%)</span>
                            <span className="font-bold text-slate-900 dark:text-white">Rs {vatAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="pt-3 border-t border-dashed border-gray-200 dark:border-white/10 flex justify-between items-end">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Total (excl. delivery)</p>
                            <p className="text-2xl font-black text-primary">
                                {finalTotal === 0 ? 'Free' : `Rs ${finalTotal.toFixed(2)}`}
                            </p>
                        </div>
                    </div>
                </section>
            </>
        )}
      </main>

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-gray-100 dark:border-white/10 z-30">
            {!hasScrolledBottom && (
                <div className="absolute bottom-full left-0 right-0 h-24 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none animate-pulse" />
            )}
            <div className="mx-auto max-w-md">
                {isOpen ? (
                    <div className="space-y-3">
                        <button 
                            onClick={handleCheckout}
                            disabled={!hasScrolledBottom}
                            className={cn(
                                "w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.97] transition-all",
                                !hasScrolledBottom && "opacity-50 cursor-not-allowed grayscale"
                            )}
                        >
                            <span className="text-lg">{hasScrolledBottom ? "Place Order" : "Scroll to Continue"}</span>
                            <span className="h-5 w-px bg-white/30 mx-2"></span>
                            <span className="text-lg">Rs {finalTotal.toFixed(2)}</span>
                        </button>
                        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider">Verification will follow on the next screen</p>
                    </div>
                ) : (
                    <button 
                        disabled
                        className="w-full bg-gray-300 dark:bg-white/10 text-slate-500 dark:text-slate-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined">lock</span>
                        <span className="text-lg">Store Closed</span>
                    </button>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
