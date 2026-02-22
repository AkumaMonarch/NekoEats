import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { categoryService } from '../../services/categoryService';
import { storageService } from '../../services/storageService';
import { CategoryItem } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryToEdit?: CategoryItem;
}

function CategoryFormModal({ isOpen, onClose, onSuccess, categoryToEdit }: CategoryFormModalProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CategoryItem>();
  const [uploading, setUploading] = useState(false);
  const imageUrl = watch('image_url');

  useEffect(() => {
    if (categoryToEdit) {
      reset(categoryToEdit);
    } else {
      reset({
        name: '',
        slug: '',
        image_url: '',
        display_order: 0
      });
    }
  }, [categoryToEdit, reset, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    try {
      const file = e.target.files[0];
      const url = await storageService.uploadImage(file);
      setValue('image_url', url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: CategoryItem) => {
    try {
      if (categoryToEdit) {
        await categoryService.updateCategory(categoryToEdit.id, data);
      } else {
        await categoryService.createCategory(data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative z-10 w-full max-w-md bg-white dark:bg-[#1e1411] rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {categoryToEdit ? 'Edit Category' : 'Add Category'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-sm"
                placeholder="e.g. Signature Burgers"
              />
              {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Slug (ID)</label>
              <input
                {...register('slug', { required: 'Slug is required' })}
                className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-sm"
                placeholder="e.g. burgers"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Display Order</label>
              <input
                type="number"
                {...register('display_order', { valueAsNumber: true })}
                className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Image</label>
              <div className="space-y-3">
                {imageUrl && (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setValue('image_url', '')}
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
                          Upload Image
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
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || uploading}
                className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function AdminCategories() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | undefined>(undefined);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (category: CategoryItem) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoryService.deleteCategory(id);
      setCategories(items => items.filter(i => i.id !== id));
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#120c0a] text-slate-900 dark:text-white">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#120c0a]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-4 py-4 flex items-center justify-between">
        <button 
            onClick={handleLogout} 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 active:bg-gray-200 dark:active:bg-white/20"
            title="Logout"
        >
            <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
        <h1 className="text-lg font-bold">Categories</h1>
        <button 
            onClick={handleCreate}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary active:bg-primary/20"
        >
            <span className="material-symbols-outlined text-[22px]">add</span>
        </button>
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto">
        {loading ? (
            <div className="space-y-4">
                {[1,2,3].map(i => (
                    <div key={i} className="h-20 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        ) : (
            <div className="space-y-3">
                {categories.map((category) => (
                    <div key={category.id} className="bg-white dark:bg-[#1e1411] border border-gray-200 dark:border-white/5 rounded-2xl p-3 flex items-center gap-4 shadow-sm">
                        <div className="h-16 w-16 rounded-xl bg-gray-100 dark:bg-white/5 overflow-hidden shrink-0">
                            {category.image_url ? (
                                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined">image</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm truncate">{category.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Slug: {category.slug}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Order: {category.display_order}</p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleEdit(category)}
                                className="h-9 w-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-slate-600 dark:text-white/70"
                            >
                                <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button 
                                onClick={() => handleDelete(category.id)}
                                className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>

      <CategoryFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCategories}
        categoryToEdit={editingCategory}
      />
    </div>
  );
}
