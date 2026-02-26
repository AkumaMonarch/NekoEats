import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dashboardService, DashboardStats } from '../../services/dashboardService';
import { formatCurrency } from '../../lib/utils';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

const COLORS = ['#E25E3E', '#FF9F1C', '#2EC4B6', '#CBF3F0', '#2B2D42'];

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const scrollRef = useDraggableScroll();

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-[#0c0605]">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#0c0605] text-slate-900 dark:text-white pb-28">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0c0605]/95 backdrop-blur-xl px-5 py-4 border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/30 ring-2 ring-primary/10">
                    <span className="material-symbols-outlined text-primary">storefront</span>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.1em]">Admin Panel</p>
                    <h1 className="text-lg font-bold tracking-tight">Unified Admin Analytics</h1>
                </div>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => navigate('/admin/reports')}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 active:scale-95 transition-transform"
                    title="Reports"
                >
                    <span className="material-symbols-outlined text-xl">description</span>
                </button>
                <button 
                    onClick={handleLogout}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 active:scale-95 transition-transform"
                    title="Logout"
                >
                    <span className="material-symbols-outlined text-xl">logout</span>
                </button>
            </div>
        </div>
      </header>

      <main className="p-5 space-y-6 max-w-md mx-auto">
        {/* Stats Row */}
        <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto hide-scrollbar -mx-5 px-5 pb-4 cursor-grab select-none"
        >
            <div className="flex-none w-[160px] p-5 rounded-3xl bg-[#160e0c] border border-white/5 shadow-sm shrink-0">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Total Sales</p>
                <p className="text-3xl font-bold text-white tracking-tight">{formatCurrency(stats?.totalSales || 0)}</p>
                <div className="flex items-center gap-1.5 mt-3 text-emerald-500">
                    <span className="material-symbols-outlined text-base font-bold">trending_up</span>
                    <span className="text-xs font-bold">Live</span>
                </div>
            </div>
            {settings?.vat_enabled && (
                <div className="flex-none w-[160px] p-5 rounded-3xl bg-[#160e0c] border border-white/5 shadow-sm shrink-0">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Total VAT</p>
                    <p className="text-3xl font-bold text-white tracking-tight">{formatCurrency(stats?.totalVat || 0)}</p>
                    <div className="flex items-center gap-1.5 mt-3 text-emerald-500">
                        <span className="material-symbols-outlined text-base font-bold">trending_up</span>
                        <span className="text-xs font-bold">Collected</span>
                    </div>
                </div>
            )}
            <div className="flex-none w-[160px] p-5 rounded-3xl bg-[#160e0c] border border-white/5 shadow-sm shrink-0">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Total Orders</p>
                <p className="text-3xl font-bold text-white tracking-tight">{stats?.totalOrders || 0}</p>
                <div className="flex items-center gap-1.5 mt-3 text-emerald-500">
                    <span className="material-symbols-outlined text-base font-bold">trending_up</span>
                    <span className="text-xs font-bold">Live</span>
                </div>
            </div>
            <div className="flex-none w-[160px] p-5 rounded-3xl bg-[#160e0c] border border-white/5 shadow-sm shrink-0">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Avg Ticket</p>
                <p className="text-3xl font-bold text-white tracking-tight">{formatCurrency(stats?.avgTicket || 0)}</p>
                <div className="flex items-center gap-1.5 mt-3 text-emerald-500">
                    <span className="material-symbols-outlined text-base font-bold">trending_up</span>
                    <span className="text-xs font-bold">Live</span>
                </div>
            </div>
            {/* Spacer to ensure last item is visible */}
            <div className="w-5 shrink-0"></div>
        </div>

        {/* Top Selling Items (Pie Chart) */}
        <section className="bg-white dark:bg-[#160e0c] border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-base tracking-tight mb-4">Top Selling Items</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats?.topItems}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="quantity"
                        >
                            {stats?.topItems.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#160e0c', border: 'none', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
                {stats?.topItems.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{item.name}</span>
                    </div>
                ))}
            </div>
        </section>

        {/* Busy Hours (Bar Chart) */}
        <section className="bg-white dark:bg-[#160e0c] border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-base tracking-tight mb-4">Busy Hours</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.busyHours}>
                        <XAxis 
                            dataKey="hour" 
                            tick={{ fontSize: 10, fill: '#94a3b8' }} 
                            axisLine={false}
                            tickLine={false}
                            interval={3}
                        />
                        <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#160e0c', border: 'none', borderRadius: '8px', color: '#fff' }}
                        />
                        <Bar dataKey="count" fill="#E25E3E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>

        {/* Delivery vs Pickup Split (Donut Chart) */}
        <section className="bg-white dark:bg-[#160e0c] border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-base tracking-tight mb-4">Delivery vs Pickup</h3>
            <div className="flex items-center gap-6">
                <div className="h-40 w-40 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats?.serviceOptionSplit}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats?.serviceOptionSplit.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#E25E3E' : '#2B2D42'} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#160e0c', border: 'none', borderRadius: '8px', color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                    {stats?.serviceOptionSplit.map((option, index) => (
                        <div key={option.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-[#E25E3E]' : 'bg-[#2B2D42]'}`}></div>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">{option.name}</span>
                            </div>
                            <span className="text-sm font-bold">{option.value}</span>
                        </div>
                    ))}
                    {stats?.serviceOptionSplit.length === 0 && (
                        <p className="text-xs text-slate-400">No data available</p>
                    )}
                </div>
            </div>
        </section>

        {/* Revenue Mix (Existing) */}
        <section className="bg-white dark:bg-[#160e0c] border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-base tracking-tight">Revenue Mix</h3>
            </div>
            <div className="flex items-center gap-6">
                <div className="relative h-36 w-36 shrink-0 flex items-center justify-center">
                    {/* Simple Pie Chart Representation */}
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <circle className="text-gray-100 dark:text-white/5" cx="18" cy="18" fill="transparent" r="15.915" stroke="currentColor" strokeWidth="3.5"></circle>
                        {stats?.categoryMix.map((cat, index) => {
                            // Calculate stroke dash array based on percentage
                            // This is a simplified visualization, ideally we'd calculate offsets
                            const color = index === 0 ? '#ee5b2b' : index === 1 ? '#8b5cf6' : index === 2 ? '#06b6d4' : '#eab308';
                            return (
                                <circle 
                                    key={cat.category}
                                    cx="18" cy="18" 
                                    fill="transparent" 
                                    r="15.915" 
                                    stroke={color}
                                    strokeDasharray={`${cat.percentage} ${100 - cat.percentage}`}
                                    strokeDashoffset={-index * 25} // Simplified offset
                                    strokeLinecap="round" 
                                    strokeWidth="4"
                                    className="opacity-80"
                                ></circle>
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold tracking-tighter">{formatCurrency(stats?.totalSales || 0)}</span>
                        <span className="text-[9px] text-slate-400 font-medium uppercase">Total</span>
                    </div>
                </div>
                <div className="flex-1 space-y-2.5">
                    {stats?.categoryMix.map((cat, index) => {
                        const colors = ['bg-primary', 'bg-violet-500', 'bg-cyan-500', 'bg-yellow-500'];
                        const color = colors[index % colors.length];
                        return (
                            <div key={cat.category} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2.5 w-2.5 rounded-full ${color}`}></div>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">{cat.category}</span>
                                </div>
                                <span className="text-xs font-bold">{cat.percentage}%</span>
                            </div>
                        );
                    })}
                    {stats?.categoryMix.length === 0 && (
                        <p className="text-xs text-slate-400">No sales data yet</p>
                    )}
                </div>
            </div>
        </section>

        {/* Top Items List (Existing) */}
        <section className="space-y-4">
            <div className="flex justify-between items-end px-1">
                <h3 className="font-bold text-base tracking-tight">Top Performing Items List</h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unit Sales</span>
            </div>
            <div className="space-y-3">
                {stats?.topItems.map((item) => (
                    <div key={item.name} className="flex items-center gap-4 p-3 bg-white dark:bg-[#160e0c] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm">
                        <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-white/5 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined text-sm">restaurant</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold tracking-tight line-clamp-1">{item.name}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.quantity} units • {formatCurrency(item.revenue / item.quantity)} avg</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">{formatCurrency(item.revenue)}</p>
                        </div>
                    </div>
                ))}
                {stats?.topItems.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No items sold yet.
                    </div>
                )}
            </div>
        </section>
      </main>
    </div>
  );
}
