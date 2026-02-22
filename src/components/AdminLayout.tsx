import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AdminNavbar } from './AdminNavbar';
import { useAuth } from '../contexts/AuthContext';

export function AdminLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-[#0c0605]">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#0c0605] text-slate-900 dark:text-white pb-28">
      <Outlet />
      <AdminNavbar />
    </div>
  );
}
