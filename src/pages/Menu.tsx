import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { menuService } from '../services/menuService';
import { categoryService } from '../services/categoryService';
import { MenuItem, CategoryItem } from '../lib/types';
import { ItemModal } from '../components/ItemModal';
import { CartFooter } from '../components/CartFooter';
import { cn } from '../lib/utils';
import { useDraggableScroll } from '../hooks/useDraggableScroll';
import { useStoreSettings } from '../hooks/useStoreSettings';

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { settings } = useStoreSettings();
  
  const scrollRef = useDraggableScroll();
  
  const categoryParam = searchParams.get('category');
  const itemParam = searchParams.get('item');
  const searchParam = searchParams.get('search');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [items, cats] = await Promise.all([
          menuService.getMenuItems(),
          categoryService.getCategories()
        ]);
        setMenuItems(items);
        setCategories(cats);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam);
      setIsSearchOpen(true);
    }
  }, [searchParam]);

  useEffect(() => {
    if (itemParam && menuItems.length > 0) {
        const item = menuItems.find(i => i.id === itemParam);
        if (item) setSelectedItem(item);
    }
  }, [itemParam, menuItems]);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-24 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
        {isSearchOpen ? (
            <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Search menu..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-gray-100 dark:bg-white/5 border-none rounded-full text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <button 
                    onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                    }}
                    className="h-10 w-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center active:scale-95 transition-transform text-slate-500 dark:text-white/70"
                >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>
        ) : (
            <>
                <button onClick={() => window.history.back()} className="h-10 w-10 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_back_ios_new</span>
                </button>
                <h1 className="font-bold text-lg text-slate-900 dark:text-white uppercase tracking-wider">{settings?.restaurant_name || 'The Burger House'}</h1>
                <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="h-10 w-10 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined text-slate-900 dark:text-white">search</span>
                </button>
            </>
        )}
      </header>

      {/* Categories */}
      <div className="py-6 overflow-x-auto hide-scrollbar" ref={scrollRef}>
        <div className="flex px-4 gap-4 cursor-grab select-none">
            <button 
                onClick={() => {
                    setActiveCategory('all');
                    setSearchParams({});
                }}
                className="flex flex-col items-center gap-2 min-w-[70px]"
            >
                <div className={cn(
                    "h-16 w-16 rounded-full flex items-center justify-center border-2 transition-all",
                    activeCategory === 'all' 
                        ? "border-primary bg-white dark:bg-white/10" 
                        : "border-transparent bg-gray-200 dark:bg-white/5"
                )}>
                    <span className={cn(
                        "material-symbols-outlined text-2xl",
                        activeCategory === 'all' ? "text-primary" : "text-gray-400"
                    )}>favorite</span>
                </div>
                <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    activeCategory === 'all' ? "text-slate-900 dark:text-white" : "text-gray-400"
                )}>For You</span>
            </button>
            
            {categories.map(cat => (
                <button 
                    key={cat.id}
                    onClick={() => {
                        setActiveCategory(cat.slug);
                        setSearchParams({ category: cat.slug });
                    }}
                    className="flex flex-col items-center gap-2 min-w-[70px]"
                >
                    <div className={cn(
                        "h-16 w-16 rounded-full flex items-center justify-center border-2 transition-all overflow-hidden",
                        activeCategory === cat.slug 
                            ? "border-primary bg-white dark:bg-white/10" 
                            : "border-transparent bg-gray-200 dark:bg-white/5"
                    )}>
                        {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className={cn(
                                "material-symbols-outlined text-2xl",
                                activeCategory === cat.slug ? "text-primary" : "text-gray-400"
                            )}>restaurant</span>
                        )}
                    </div>
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider truncate max-w-[70px]",
                        activeCategory === cat.slug ? "text-slate-900 dark:text-white" : "text-gray-400"
                    )}>{cat.name}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-4">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Products</h2>
        
        {loading ? (
            <div className="grid grid-cols-2 gap-4">
                {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="bg-gray-100 dark:bg-white/5 rounded-2xl h-56 animate-pulse"></div>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
                {filteredItems.map(item => (
                    <div 
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 pb-4 cursor-pointer active:scale-[0.98] transition-transform"
                    >
                        <div className="aspect-[4/3] relative">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            {item.popular && (
                                <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded uppercase">Trending</span>
                            )}
                        </div>
                        <div className="px-3 pt-3">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mb-1">{item.name}</h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 mb-3">{item.description}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-base font-bold text-slate-900 dark:text-white">Rs {item.price.toFixed(2)}</span>
                                    {settings?.vat_enabled && <span className="text-[9px] text-slate-400 font-medium leading-none">+ VAT</span>}
                                </div>
                                <button className="h-8 w-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-lg">add</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Item Modal */}
      {selectedItem && (
        <ItemModal 
            item={selectedItem} 
            isOpen={!!selectedItem} 
            onClose={() => {
                setSelectedItem(null);
                setSearchParams({});
            }} 
        />
      )}
      
      <CartFooter />
    </div>
  );
}
