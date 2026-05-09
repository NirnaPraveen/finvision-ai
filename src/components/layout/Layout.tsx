import React from 'react';
import { Navbar } from './Navbar';
import { useAuth } from '@/context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export const Layout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-gray-400 font-medium animate-pulse">Initializing FinVision AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black transition-colors duration-500 overflow-x-hidden">
      <Navbar />
      
      <main className="p-4 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
};
