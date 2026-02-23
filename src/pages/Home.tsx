import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { menuService } from '../services/menuService';
import { categoryService } from '../services/categoryService';
import { MenuItem, CategoryItem } from '../lib/types';
import { useStoreSettings } from '../hooks/useStoreSettings';
import { useTheme } from '../contexts/ThemeContext';
import { CartFooter } from '../components/CartFooter';

export default function Home() {
  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { settings, loading: settingsLoading } = useStoreSettings();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [items, cats] = await Promise.all([
          menuService.getPopularItems(),
          categoryService.getCategories()
        ]);
        setPopularItems(items);
        setCategories(cats);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const isOpen = settings?.is_open ?? true;

  return (
    <div className="min-h-screen pb-24 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-lg">lunch_dining</span>
            </div>
            <div>
                <h1 className="text-sm font-bold leading-none text-slate-900 dark:text-white">{settings?.restaurant_name || 'THE BURGER HOUSE'}</h1>
                <div className="flex items-center gap-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-[10px] font-bold uppercase ${isOpen ? 'text-green-500' : 'text-red-500'}`}>
                        {isOpen ? `Open Now • Closes ${settings?.closing_time || '22:00'}` : 'Closed Now'}
                    </span>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={toggleTheme}
                className="h-9 w-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-white transition-colors"
            >
                <span className="material-symbols-outlined text-lg">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
        </div>
      </header>

      {!isOpen && (
        <div className="bg-red-500 text-white px-4 py-3 text-center">
            <p className="text-sm font-bold">⚠️ We are currently closed for orders.</p>
            <p className="text-xs opacity-90">Opens at {settings?.opening_time || '09:00'}</p>
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                        navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
                    }
                }}
                placeholder="Search burgers, sides, shakes..." 
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-gray-100 dark:bg-white/5 border-none text-sm focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
            />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Browse Menu</h3>
            <Link to="/menu" className="text-primary text-sm font-bold">See All</Link>
        </div>
        {loading ? (
            <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => (
                    <div key={i} className="aspect-[16/10] bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse"></div>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                    <Link to={`/menu?category=${cat.slug}`} key={cat.id} className="relative aspect-[16/10] rounded-xl overflow-hidden group bg-gray-100 dark:bg-white/5">
                        {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <span className="material-symbols-outlined text-3xl">restaurant</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-2">
                            <span className="text-white font-bold text-sm uppercase leading-tight">{cat.name}</span>
                        </div>
                    </Link>
                ))}
            </div>
        )}
      </div>

      {/* Popular */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Popular Right Now</h3>
            <span className="material-symbols-outlined text-primary text-lg">trending_up</span>
        </div>
        
        {loading ? (
            <div className="grid grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                    <div key={i} className="bg-gray-100 dark:bg-white/5 rounded-2xl h-48 animate-pulse"></div>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
                {popularItems.map((item) => (
                    <Link to={`/menu?item=${item.id}`} key={item.id} className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 pb-3">
                        <div className="aspect-square relative">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            <button className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                        </div>
                        <div className="px-3 pt-3">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name.toUpperCase()}</h4>
                            <p className="text-primary font-bold text-sm mt-1">${item.price.toFixed(2)}</p>
                        </div>
                    </Link>
                ))}
            </div>
        )}
      </div>

      <CartFooter />
    </div>
  );
}
