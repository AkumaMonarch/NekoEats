import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  isVisible: boolean;
  logoUrl?: string;
  restaurantName?: string;
}

export function SplashScreen({ isVisible, logoUrl, restaurantName }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background-light dark:bg-[#120c0a]"
        >
          <div className="flex flex-col items-center gap-6">
            {logoUrl ? (
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                src={logoUrl}
                alt="Logo"
                className="w-32 h-32 object-contain"
              />
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-32 w-32 rounded-full bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/30"
              >
                <span className="material-symbols-outlined text-6xl">lunch_dining</span>
              </motion.div>
            )}
            
            <div className="flex flex-col items-center gap-2">
                {restaurantName && (
                <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight"
                >
                    {restaurantName}
                </motion.h1>
                )}
                
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="h-1 w-32 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden"
                >
                    <motion.div 
                        className="h-full bg-primary"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    />
                </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
