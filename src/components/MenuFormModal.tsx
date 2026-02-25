import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem, Category, CategoryItem } from '../lib/types';
import { menuService } from '../services/menuService';
import { storageService } from '../services/storageService';
import { categoryService } from '../services/categoryService';

interface MenuFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemToEdit?: MenuItem;
}

interface FormValues {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  popular: boolean;
  in_stock: boolean;
  variants: { id: string; name: string; price: number }[];
  addons: { id: string; name: string; price: number }[];
}

export function MenuFormModal({ isOpen, onClose, onSuccess, itemToEdit }: MenuFormModalProps) {
  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: 'burgers',
      image_url: '',
      popular: false,
      in_stock: true,
      variants: [],
      addons: []
    }
  });

  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const imageUrl = watch('image_url');

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants'
  });

  const { fields: addonFields, append: appendAddon, remove: removeAddon } = useFieldArray({
    control,
    name: 'addons'
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (itemToEdit) {
      reset({
        name: itemToEdit.name,
        description: itemToEdit.description,
        price: itemToEdit.price,
        category: itemToEdit.category,
        image_url: itemToEdit.image_url,
        popular: itemToEdit.popular,
        in_stock: itemToEdit.in_stock,
        variants: itemToEdit.variants || [],
        addons: itemToEdit.addons || []
      });
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        category: categories.length > 0 ? categories[0].slug : 'burgers',
        image_url: '',
        popular: false,
        in_stock: true,
        variants: [],
        addons: []
      });
    }
  }, [itemToEdit, reset, isOpen, categories]);

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

  const onSubmit = async (data: FormValues) => {
    try {
      if (itemToEdit) {
        await menuService.updateItem(itemToEdit.id, data);
      } else {
        await menuService.createItem(data as any);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save item. Please try again.');
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
          className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#1e1411] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {itemToEdit ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-sm"
                    placeholder="e.g. Classic Burger"
                  />
                  {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price (Rs)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price', { required: 'Price is required', valueAsNumber: true })}
                    className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    {...register('category')}
                    className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#2a201d] p-3 text-sm text-slate-900 dark:text-white"
                  >
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.slug} className="bg-white dark:bg-[#2a201d] text-slate-900 dark:text-white">
                            {cat.name}
                        </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
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
                      <span className="text-xs text-slate-400 font-bold uppercase">OR</span>
                      <input
                        {...register('image_url', { required: 'Image is required' })}
                        className="flex-1 rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-sm"
                        placeholder="Paste URL..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-sm"
                    placeholder="Item description..."
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('popular')} className="rounded text-primary focus:ring-primary" />
                    <span className="text-sm font-medium">Popular</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('in_stock')} className="rounded text-primary focus:ring-primary" />
                    <span className="text-sm font-medium">In Stock</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-white/10 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm">Variants (Optional)</h3>
                <button
                  type="button"
                  onClick={() => appendVariant({ id: crypto.randomUUID(), name: '', price: 0 })}
                  className="text-xs font-bold text-primary flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Add Variant
                </button>
              </div>
              <div className="space-y-3">
                {variantFields.map((field, index) => (
                  <div key={field.id} className="flex gap-3">
                    <input
                      {...register(`variants.${index}.name` as const)}
                      placeholder="Variant Name"
                      className="flex-1 rounded-lg border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2 text-sm"
                    />
                    <input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.price` as const, { valueAsNumber: true })}
                      placeholder="Price"
                      className="w-24 rounded-lg border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2 text-sm"
                    />
                    <button type="button" onClick={() => removeVariant(index)} className="text-red-500">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-white/10 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm">Add-ons (Optional)</h3>
                <button
                  type="button"
                  onClick={() => appendAddon({ id: crypto.randomUUID(), name: '', price: 0 })}
                  className="text-xs font-bold text-primary flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Add Add-on
                </button>
              </div>
              <div className="space-y-3">
                {addonFields.map((field, index) => (
                  <div key={field.id} className="flex gap-3">
                    <input
                      {...register(`addons.${index}.name` as const)}
                      placeholder="Add-on Name"
                      className="flex-1 rounded-lg border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2 text-sm"
                    />
                    <input
                      type="number"
                      step="0.01"
                      {...register(`addons.${index}.price` as const, { valueAsNumber: true })}
                      placeholder="Price"
                      className="w-24 rounded-lg border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2 text-sm"
                    />
                    <button type="button" onClick={() => removeAddon(index)} className="text-red-500">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>

          <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || uploading}
              className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
