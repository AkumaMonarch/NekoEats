import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { reportsService } from '../../services/reportsService';
import { StoreSettings } from '../../lib/types';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { 
  generateAnnualIncomeSummary, 
  generateDailySalesLedger, 
  generateMonthlySummary, 
  generateGstVatReturn, 
  generateItemSalesAnalysis 
} from '../../utils/reportGenerators';

export default function AdminReports() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Date States
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await reportsService.getStoreSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const fetchOrders = async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const orders = await reportsService.getCompletedOrders(start, end);
      return orders;
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      alert('Failed to fetch data for report');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAnnual = async () => {
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 0, 1));
    const orders = await fetchOrders(start, end);
    if (orders.length > 0) {
      generateAnnualIncomeSummary(orders, year, settings);
    } else {
      alert('No completed orders found for this year.');
    }
  };

  const handleGenerateMonthly = async () => {
    const start = startOfMonth(new Date(year, month, 1));
    const end = endOfMonth(new Date(year, month, 1));
    const orders = await fetchOrders(start, end);
    if (orders.length > 0) {
      generateMonthlySummary(orders, month, year, settings);
    } else {
      alert('No completed orders found for this month.');
    }
  };

  const handleGenerateDailyLedger = async () => {
    const start = startOfDay(new Date(dateRange.start));
    const end = endOfDay(new Date(dateRange.end));
    const orders = await fetchOrders(start, end);
    if (orders.length > 0) {
      generateDailySalesLedger(orders, settings);
    } else {
      alert('No completed orders found for this period.');
    }
  };

  const handleGenerateVatReturn = async () => {
    const start = startOfDay(new Date(dateRange.start));
    const end = endOfDay(new Date(dateRange.end));
    const orders = await fetchOrders(start, end);
    if (orders.length > 0) {
      generateGstVatReturn(orders, settings);
    } else {
      alert('No completed orders found for this period.');
    }
  };

  const handleGenerateItemAnalysis = async () => {
    const start = startOfDay(new Date(dateRange.start));
    const end = endOfDay(new Date(dateRange.end));
    const orders = await fetchOrders(start, end);
    if (orders.length > 0) {
      generateItemSalesAnalysis(orders, settings);
    } else {
      alert('No completed orders found for this period.');
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#0c0605] text-slate-900 dark:text-white pb-28">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0c0605]/95 backdrop-blur-xl px-5 py-4 border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/admin')} className="h-10 w-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight">Tax Reports</h1>
            </div>
            <div className="flex gap-2">
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
        
        {/* Annual Income Summary */}
        <section className="bg-white dark:bg-[#160e0c] border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <span className="material-symbols-outlined">calendar_today</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-base">Annual Income Summary</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">PDF • Corporate Tax Return</p>
                    </div>
                </div>
            </div>
            <div className="space-y-3">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Year</label>
                    <select 
                        value={year} 
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl text-sm font-bold p-3 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <option key={y} value={y} className="bg-white text-slate-900 dark:bg-[#160e0c] dark:text-white">{y}</option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={handleGenerateAnnual}
                    disabled={loading}
                    className="w-full h-[44px] px-6 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span> : <span className="material-symbols-outlined">download</span>}
                    Generate Report
                </button>
            </div>
        </section>

        {/* Monthly Summary */}
        <section className="bg-white dark:bg-[#160e0c] border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <span className="material-symbols-outlined">date_range</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-base">Monthly Summary</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">PDF • Bank Statements</p>
                    </div>
                </div>
            </div>
            <div className="space-y-3">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Period</label>
                    <div className="flex gap-2">
                        <select 
                            value={month} 
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="flex-[2] bg-gray-50 dark:bg-white/5 border-none rounded-xl text-sm font-bold p-3 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                        >
                            {Array.from({ length: 12 }, (_, i) => i).map(m => (
                                <option key={m} value={m} className="bg-white text-slate-900 dark:bg-[#160e0c] dark:text-white">{format(new Date(2000, m, 1), 'MMMM')}</option>
                            ))}
                        </select>
                        <select 
                            value={year} 
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-xl text-sm font-bold p-3 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y} className="bg-white text-slate-900 dark:bg-[#160e0c] dark:text-white">{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button 
                    onClick={handleGenerateMonthly}
                    disabled={loading}
                    className="w-full h-[44px] px-6 bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span> : <span className="material-symbols-outlined">download</span>}
                    Generate Report
                </button>
            </div>
        </section>

        {/* Date Range Reports */}
        <section className="space-y-4">
            <div className="bg-white dark:bg-[#160e0c] border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-base mb-4">Custom Range Reports</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Start Date</label>
                        <input 
                            type="date" 
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl text-sm font-bold p-3 dark:[color-scheme:dark]"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">End Date</label>
                        <input 
                            type="date" 
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl text-sm font-bold p-3 dark:[color-scheme:dark]"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Daily Sales Ledger */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                                <span className="material-symbols-outlined">table_chart</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Daily Sales Ledger</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Excel • VAT + Audit Trail</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleGenerateDailyLedger}
                            disabled={loading}
                            className="h-10 w-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">download</span>
                        </button>
                    </div>

                    {/* GST/VAT Return */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
                                <span className="material-symbols-outlined">receipt_long</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">GST/VAT Return</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Excel • Quarterly Filing</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleGenerateVatReturn}
                            disabled={loading}
                            className="h-10 w-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">download</span>
                        </button>
                    </div>

                    {/* Item Sales Analysis */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center">
                                <span className="material-symbols-outlined">bar_chart</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Item Sales Analysis</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Excel • Cost Analysis</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleGenerateItemAnalysis}
                            disabled={loading}
                            className="h-10 w-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">download</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>

      </main>
    </div>
  );
}
