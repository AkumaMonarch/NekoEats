import React, { useState, useEffect } from 'react';
import { menuService } from '../../services/menuService';
import { categoryService } from '../../services/categoryService';
import { MenuItem, CategoryItem } from '../../lib/types';
import { cn } from '../../lib/utils';
import { MenuFormModal } from '../../components/MenuFormModal';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminMenu() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  
  const scrollRef = useDraggableScroll();

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleCreate = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleToggleStock = async (id: string, currentStatus: boolean) => {
    try {
        // Optimistic update
        setMenuItems(items => items.map(i => 
            i.id === id ? { ...i, in_stock: !currentStatus } : i
        ));
        await menuService.toggleStock(id, !currentStatus);
    } catch (error) {
        console.error('Failed to toggle stock:', error);
        fetchData(); // Revert on error
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
        await menuService.deleteItem(id);
        setMenuItems(items => items.filter(i => i.id !== id));
    } catch (error) {
        console.error('Failed to delete item:', error);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#120c0a] text-slate-900 dark:text-white">
      <header className="sticky top-0 z-30 bg-[#120c0a] border-b border-white/5 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
            <button 
                onClick={handleLogout} 
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20 text-white"
                title="Logout"
            >
                <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF5C00]">Admin Panel</span>
                <h1 className="text-lg font-extrabold leading-tight tracking-tight text-white">Unified Menu</h1>
            </div>
            <button 
                onClick={handleCreate}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF5C00]/20 text-[#FF5C00] active:bg-[#FF5C00]/30"
            >
                <span className="material-symbols-outlined text-[22px]">add</span>
            </button>
        </div>
        <div className="space-y-4">
            <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-white/40 text-[20px]">search</span>
                <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF5C00]/50 placeholder:text-white/30 text-white" 
                    placeholder="Search menu items..." 
                    type="text"
                />
            </div>
            <div 
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto hide-scrollbar py-1 -mx-4 px-4 cursor-grab select-none"
            >
                <button 
                    onClick={() => setActiveCategory('all')}
                    className={cn(
                        "px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors shrink-0",
                        activeCategory === 'all'
                            ? "bg-[#FF5C00] text-white shadow-lg shadow-[#FF5C00]/20"
                            : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
                    )}
                >
                    All Items
                </button>
                {categories.map((cat) => (
                    <button 
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.slug)}
                        className={cn(
                            "px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors shrink-0",
                            activeCategory === cat.slug
                                ? "bg-[#FF5C00] text-white shadow-lg shadow-[#FF5C00]/20"
                                : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
                        )}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-4 max-w-md mx-auto">
        <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">Total Items: {menuItems.length}</p>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Syncing Live
            </div>
        </div>

        {loading ? (
            <div className="space-y-4">
                {[1,2,3,4].map(i => (
                    <div key={i} className="h-28 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        ) : (
            <div className="grid gap-4">
                {filteredItems.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-[#1e1411] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm transition-all">
                        <div className="p-3.5 flex gap-4">
                            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
                                <img src={item.image_url} alt={item.name} className={`h-full w-full object-cover ${!item.in_stock ? 'grayscale opacity-50' : ''}`} />
                                {!item.in_stock && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Out</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col justify-between py-0.5">
                                <div className="flex justify-between items-start">
                                    <div className={!item.in_stock ? 'opacity-60' : ''}>
                                        <h4 className="text-[15px] font-bold leading-snug line-clamp-1">{item.name}</h4>
                                        <p className="text-[13px] font-medium text-primary mt-0.5">
                                            Rs {item.price.toFixed(2)} 
                                            <span className="text-slate-400 dark:text-white/30 mx-1.5">/</span> 
                                            <span className="text-slate-500 capitalize">{item.category}</span>
                                        </p>
                                    </div>
                                    <button className="text-slate-300 dark:text-white/20"><span className="material-symbols-outlined">more_horiz</span></button>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className={`text-[11px] font-bold uppercase tracking-wider ${item.in_stock ? 'text-green-500' : 'text-slate-400'}`}>
                                            {item.in_stock ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                        <button 
                                            onClick={() => handleToggleStock(item.id, item.in_stock)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${item.in_stock ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.in_stock ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleEdit(item)}
                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 text-slate-600 dark:text-white/70 active:bg-gray-200 dark:active:bg-white/20"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 active:bg-red-500/20"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>

      <MenuFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        itemToEdit={editingItem}
      />
    </div>
  );
}
