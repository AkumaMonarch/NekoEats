import React, { useEffect, useState } from 'react';
import { riderService } from '../../services/riderService';
import { Rider } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminRiders() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadRiders();
  }, []);

  const loadRiders = async () => {
    try {
      const data = await riderService.getRiders();
      setRiders(data);
    } catch (error) {
      console.error('Failed to load riders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRider) {
        await riderService.updateRider(editingRider.id, formData);
      } else {
        await riderService.createRider(formData);
      }
      setIsModalOpen(false);
      setEditingRider(null);
      setFormData({ name: '', phone: '', email: '' });
      loadRiders();
    } catch (error) {
      console.error('Failed to save rider:', error);
      alert('Failed to save rider');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this rider?')) return;
    try {
      await riderService.deleteRider(id);
      loadRiders();
    } catch (error) {
      console.error('Failed to delete rider:', error);
      alert('Failed to delete rider');
    }
  };

  const handleToggleStatus = async (rider: Rider) => {
    try {
      await riderService.toggleAvailability(rider.id, rider.status);
      loadRiders();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const openModal = (rider?: Rider) => {
    if (rider) {
      setEditingRider(rider);
      setFormData({ name: rider.name, phone: rider.phone, email: rider.email || '' });
    } else {
      setEditingRider(null);
      setFormData({ name: '', phone: '', email: '' });
    }
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center">Loading riders...</div>;

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#120c0a] text-slate-900 dark:text-white">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#120c0a]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-4 py-4 flex items-center justify-between">
        <button onClick={() => window.history.back()} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 active:bg-gray-200 dark:active:bg-white/20">
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">Rider Management</h1>
        <button 
            onClick={() => openModal()}
            className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2"
        >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Rider
        </button>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {riders.map(rider => (
            <div key={rider.id} className="bg-white dark:bg-[#1e1411] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{rider.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{rider.phone}</p>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  rider.status === 'available' ? 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400' :
                  rider.status === 'busy' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400'
                }`}>
                  {rider.status}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <span className="material-symbols-outlined text-base">local_shipping</span>
                <span>{rider.total_deliveries} deliveries</span>
              </div>

              <div className="flex gap-2 mt-auto">
                <button 
                  onClick={() => handleToggleStatus(rider)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                    rider.status === 'offline' 
                      ? 'border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10' 
                      : 'border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5'
                  }`}
                >
                  {rider.status === 'offline' ? 'Go Online' : 'Go Offline'}
                </button>
                <button 
                  onClick={() => openModal(rider)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button 
                  onClick={() => handleDelete(rider.id)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {riders.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">two_wheeler</span>
            <p>No riders found. Add your first rider to get started.</p>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e1411] w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-6">{editingRider ? 'Edit Rider' : 'Add New Rider'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl p-3 font-medium"
                  placeholder="Rider Name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl p-3 font-medium"
                  placeholder="Phone Number"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl p-3 font-medium"
                  placeholder="Email Address"
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                >
                  Save Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
