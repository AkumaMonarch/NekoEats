import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { settingsService } from '../../services/settingsService';
import { storageService } from '../../services/storageService';
import { StoreSettings, WeeklySchedule, DaySchedule } from '../../lib/types';
import { useTheme } from '../../contexts/ThemeContext';

const defaultSchedule: WeeklySchedule = {
  monday: { isOpen: true, open: '09:00', close: '22:00' },
  tuesday: { isOpen: true, open: '09:00', close: '22:00' },
  wednesday: { isOpen: true, open: '09:00', close: '22:00' },
  thursday: { isOpen: true, open: '09:00', close: '22:00' },
  friday: { isOpen: true, open: '09:00', close: '23:00' },
  saturday: { isOpen: true, open: '10:00', close: '23:00' },
  sunday: { isOpen: true, open: '10:00', close: '22:00' },
};

export default function AdminSettings() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isWebhookOpen, setIsWebhookOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(true);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.getSettings();
      // Ensure schedule exists
      if (data && !data.schedule) {
        data.schedule = defaultSchedule;
      }
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (day: keyof WeeklySchedule, field: keyof DaySchedule, value: any) => {
    if (!settings) return;
    setSettings(prev => {
        if (!prev) return null;
        const currentSchedule = prev.schedule || defaultSchedule;
        return {
            ...prev,
            schedule: {
                ...currentSchedule,
                [day]: {
                    ...currentSchedule[day],
                    [field]: value
                }
            }
        };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    try {
      const file = e.target.files[0];
      const url = await storageService.uploadImage(file, 'menu-items'); // Reusing menu-items bucket for simplicity
      setSettings(prev => prev ? ({ ...prev, logo_url: url }) : null);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleWebhookTest = async () => {
    if (!settings?.webhook_url) return;
    setTestingWebhook(true);
    try {
      const response = await fetch(settings.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: 'test',
            timestamp: new Date().toISOString(),
            message: 'This is a test message from The Burger House Admin Panel'
        })
      });
      
      if (response.ok) {
        alert('Webhook test successful! Status: ' + response.status);
      } else {
        alert('Webhook test failed. Status: ' + response.status);
      }
    } catch (error) {
      console.error('Webhook test error:', error);
      alert('Webhook test failed. Check console for details.');
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsService.updateSettings(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#120c0a] text-slate-900 dark:text-white">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#120c0a]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-4 py-4 flex items-center justify-between">
        <button onClick={() => window.history.back()} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 active:bg-gray-200 dark:active:bg-white/20">
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">Admin Settings</h1>
        <button 
            onClick={handleSave}
            disabled={saving}
            className="text-primary font-bold text-sm disabled:opacity-50"
        >
            {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      <main className="p-4 space-y-6 max-w-md mx-auto">
        <section>
            <div 
                onClick={() => setIsBrandingOpen(!isBrandingOpen)}
                className="flex justify-between items-center mb-4 cursor-pointer"
            >
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Branding</h2>
                <span className={`material-symbols-outlined text-slate-400 transition-transform ${isBrandingOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </div>
            
            <div className={`bg-white dark:bg-[#1e1411] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden transition-all duration-300 ease-in-out ${isBrandingOpen ? 'max-h-[800px] opacity-100 p-4' : 'max-h-0 opacity-0 border-none'}`}>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Restaurant Name</label>
                        <input 
                            type="text" 
                            value={settings?.restaurant_name || ''} 
                            onChange={(e) => setSettings(prev => prev ? ({ ...prev, restaurant_name: e.target.value }) : null)}
                            className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl p-3 text-sm font-medium" 
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Business Phone Number</label>
                        <input 
                            type="tel" 
                            value={settings?.business_phone || ''} 
                            onChange={(e) => setSettings(prev => prev ? ({ ...prev, business_phone: e.target.value }) : null)}
                            className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl p-3 text-sm font-medium" 
                            placeholder="e.g. 57665303"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Used for WhatsApp/Telegram order links</p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Logo</label>
                        <div className="space-y-3">
                            {settings?.logo_url && (
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5">
                                    <img src={settings.logo_url} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                                    <button 
                                        type="button"
                                        onClick={() => setSettings(prev => prev ? ({ ...prev, logo_url: '' }) : null)}
                                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-3">
                                <label className="flex-1 cursor-pointer">
                                    <div className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-dashed border-gray-300 dark:border-white/20 hover:border-primary hover:text-primary transition-colors text-slate-500 dark:text-slate-400 text-sm font-medium">
                                        {uploading ? (
                                            <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined">cloud_upload</span>
                                                Upload Logo
                                            </>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Upload an image for your logo (PNG, JPG, GIF, SVG)</p>
                        </div>
                    </div>
                    
                    <div className="mt-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Appearance</label>
                        <div 
                            onClick={toggleTheme}
                            className="flex items-center justify-between p-4 bg-white dark:bg-[#1e1411] border border-gray-200 dark:border-white/5 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform shadow-sm dark:shadow-none"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-[#FF5C00] flex items-center justify-center text-white shadow-lg shadow-[#FF5C00]/20">
                                    <span className="material-symbols-outlined text-[20px]">
                                        {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                                        Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Currently in {theme} mode
                                    </p>
                                </div>
                            </div>
                            <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-[#FF5C00]' : 'bg-gray-200 dark:bg-slate-700'}`}>
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section>
            <div 
                onClick={() => setIsWebhookOpen(!isWebhookOpen)}
                className="flex justify-between items-center mb-4 cursor-pointer"
            >
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Outbound Connectivity</h2>
                <span className={`material-symbols-outlined text-slate-400 transition-transform ${isWebhookOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </div>
            
            <div className={`bg-white dark:bg-[#1e1411] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden transition-all duration-300 ease-in-out ${isWebhookOpen ? 'max-h-[300px] opacity-100 p-4' : 'max-h-0 opacity-0 border-none'}`}>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Webhook URL</label>
                    <div className="flex gap-2">
                        <input 
                            type="url" 
                            value={settings?.webhook_url || ''} 
                            onChange={(e) => setSettings(prev => prev ? ({ ...prev, webhook_url: e.target.value }) : null)}
                            className="flex-1 bg-gray-100 dark:bg-white/5 border-none rounded-xl p-3 text-sm font-medium" 
                            placeholder="https://api.example.com/webhook"
                        />
                        <button 
                            onClick={handleWebhookTest}
                            disabled={!settings?.webhook_url || testingWebhook}
                            className="px-4 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {testingWebhook ? 'Testing...' : 'Test'}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">URL to receive order updates via POST requests</p>
                </div>
            </div>
        </section>

        <section>
            <div 
                onClick={() => setIsScheduleOpen(!isScheduleOpen)}
                className="flex justify-between items-center mb-4 cursor-pointer"
            >
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Operating Hours</h2>
                <span className={`material-symbols-outlined text-slate-400 transition-transform ${isScheduleOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </div>
            
            <div className={`bg-white dark:bg-[#1e1411] rounded-2xl border border-gray-200 dark:border-white/5 divide-y divide-gray-200 dark:divide-white/5 overflow-hidden transition-all duration-300 ease-in-out ${isScheduleOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 border-none'}`}>
                {(Object.entries(settings?.schedule || defaultSchedule) as [keyof WeeklySchedule, DaySchedule][]).map(([day, schedule]) => (
                    <div key={day} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleScheduleChange(day, 'isOpen', !schedule.isOpen);
                                }}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${schedule.isOpen ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'}`}
                            >
                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${schedule.isOpen ? 'translate-x-4' : 'translate-x-0.5'}`}></span>
                            </div>
                            <span className="font-bold text-sm capitalize w-20 text-slate-700 dark:text-slate-200">{day}</span>
                        </div>
                        
                        {schedule.isOpen ? (
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-lg px-2 py-1 border border-gray-100 dark:border-white/5">
                                <input 
                                    type="time" 
                                    value={schedule.open}
                                    onChange={(e) => handleScheduleChange(day, 'open', e.target.value)}
                                    className="bg-transparent border-none text-xs font-medium p-0 w-auto text-center focus:ring-0 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                                />
                                <span className="text-xs text-slate-400">to</span>
                                <input 
                                    type="time" 
                                    value={schedule.close}
                                    onChange={(e) => handleScheduleChange(day, 'close', e.target.value)}
                                    className="bg-transparent border-none text-xs font-medium p-0 w-auto text-center focus:ring-0 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                                />
                            </div>
                        ) : (
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4">Closed</span>
                        )}
                    </div>
                ))}
            </div>
        </section>

        <section>
            <div className={`rounded-2xl p-5 border transition-colors ${settings?.is_open ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center gap-2 ${settings?.is_open ? 'text-red-500' : 'text-green-500'}`}>
                        <span className="material-symbols-outlined">{settings?.is_open ? 'emergency_home' : 'door_open'}</span>
                        <h3 className="font-bold text-sm uppercase tracking-wider">{settings?.is_open ? 'Force Close Store' : 'Open Store'}</h3>
                    </div>
                    <button 
                        onClick={() => setSettings(prev => prev ? ({ ...prev, is_open: !prev.is_open }) : null)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${settings?.is_open ? 'bg-red-500' : 'bg-green-500'}`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.is_open ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
                    </button>
                </div>
                <p className={`text-xs leading-relaxed ${settings?.is_open ? 'text-red-400' : 'text-green-600'}`}>
                    {settings?.is_open 
                        ? "Immediately marks the store as closed on all customer platforms. Use only for emergencies." 
                        : "Store is currently closed. Toggle to open immediately."}
                </p>
            </div>
        </section>

        <section>
            <button 
                onClick={handleLogout}
                className="w-full bg-gray-200 dark:bg-white/10 text-slate-900 dark:text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
            >
                <span className="material-symbols-outlined">logout</span>
                Log Out
            </button>
        </section>
      </main>
    </div>
  );
}
