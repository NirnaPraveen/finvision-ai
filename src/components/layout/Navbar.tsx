import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Bell, 
  Sun, 
  Moon,
  LayoutDashboard, 
  Receipt, 
  Users, 
  BarChart3, 
  Settings,
  CreditCard,
  Sparkles,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { ProfileSettingsDialog } from '@/components/account/ProfileSettingsDialog';
import { BillingDialog } from '@/components/account/BillingDialog';
import { SecurityDialog } from '@/components/account/SecurityDialog';
import { AccountSwitcherDialog } from '@/components/account/AccountSwitcherDialog';

const navItems = [
  { icon: LayoutDashboard, label: 'Dash', path: '/', mobileLabel: 'Home' },
  { icon: Receipt, label: 'Expenses', path: '/expenses', mobileLabel: 'Pay' },
  { icon: Users, label: 'Splits', path: '/shared', mobileLabel: 'Splits' },
  { icon: BarChart3, label: 'Trends', path: '/insights', mobileLabel: 'Trends' },
  { icon: CreditCard, label: 'Subs', path: '/subscriptions', mobileLabel: 'Subs' },
];

export const Navbar: React.FC = () => {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [hoveredPath, setHoveredPath] = React.useState<string | null>(null);

  // Modal states
  const [activeModal, setActiveModal] = React.useState<'profile' | 'billing' | 'security' | 'switcher' | null>(null);

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-nav border-b border-white/20 dark:border-white/5 transition-all duration-300">
        <div className="px-4 lg:px-10 h-16 lg:h-20 flex items-center justify-between gap-4 lg:gap-8">
          {/* Left: Logo & Desktop Navigation */}
          <div className="flex items-center gap-6 lg:gap-12 flex-1 min-w-0">
            <NavLink to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 lg:w-10 lg:h-10 premium-gradient rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform">
                <Sparkles className="text-white w-4 h-4 lg:w-6 lg:h-6" />
              </div>
              <span className="text-lg lg:text-2xl font-display font-black text-slate-900 dark:text-white tracking-tighter shrink-0">FinVision</span>
            </NavLink>
            
            {/* Desktop Navigation Items */}
            <nav className="hidden md:flex items-center gap-1 min-w-0 h-full">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const isHovered = hoveredPath === item.path;
                const showIndicator = isHovered || (isActive && hoveredPath === null);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onMouseEnter={() => setHoveredPath(item.path)}
                    onMouseLeave={() => setHoveredPath(null)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap group",
                      isActive 
                        ? "text-brand-600 dark:text-white" 
                        : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 relative z-10",
                      isActive && "scale-110"
                    )} />
                    <span className="relative z-10">{item.label}</span>
                    
                    {showIndicator && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute bottom-[-10px] lg:bottom-[-20px] left-0 right-0 h-[3px] premium-gradient rounded-full"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right: Theme, Profile */}
          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
            <button 
              onClick={toggleTheme}
              className="p-2 lg:p-2.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl lg:rounded-2xl transition-all active:scale-90 group"
              title="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 lg:w-5 lg:h-5 text-slate-600 group-hover:text-brand-600 transition-colors" />
              ) : (
                <Sun className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 group-hover:text-yellow-400 transition-colors" />
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl lg:rounded-2xl transition-all pr-3 cursor-pointer active:scale-95 outline-none group">
                <Avatar className="w-8 h-8 lg:w-9 lg:h-9 border-2 border-white dark:border-white/10 shadow-md group-hover:scale-105 transition-transform">
                  <AvatarImage src={profile?.photoURL} />
                  <AvatarFallback className="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-bold">
                    {profile?.displayName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none">{profile?.displayName}</p>
                  <p className="text-[8px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mt-1">Premium</p>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 mt-4 p-2 glass-card border-white/20 dark:border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl">
                <div className="px-3 py-2 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">My Account</div>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5 mx-2" />
                <DropdownMenuItem 
                  className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-white/10 focus:text-brand-600 dark:focus:text-white transition-colors cursor-pointer dark:text-gray-300 font-bold"
                  onClick={() => setActiveModal('profile')}
                >
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-white/10 focus:text-brand-600 dark:focus:text-white transition-colors cursor-pointer dark:text-gray-300 font-bold"
                  onClick={() => setActiveModal('billing')}
                >
                  Billing & Plans
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-white/10 focus:text-brand-600 dark:focus:text-white transition-colors cursor-pointer dark:text-gray-300 font-bold"
                  onClick={() => setActiveModal('security')}
                >
                  Security
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5 mx-2" />
                <DropdownMenuItem 
                  className="rounded-xl px-3 py-2.5 focus:bg-brand-50 dark:focus:bg-white/10 focus:text-brand-600 dark:focus:text-white transition-colors cursor-pointer dark:text-gray-300 font-bold" 
                  onClick={() => setActiveModal('switcher')}
                >
                  Switch Account
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-600 transition-colors cursor-pointer font-bold" onClick={() => signOut(auth)}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ProfileSettingsDialog open={activeModal === 'profile'} onOpenChange={(open) => !open && setActiveModal(null)} />
            <BillingDialog open={activeModal === 'billing'} onOpenChange={(open) => !open && setActiveModal(null)} />
            <SecurityDialog open={activeModal === 'security'} onOpenChange={(open) => !open && setActiveModal(null)} />
            <AccountSwitcherDialog open={activeModal === 'switcher'} onOpenChange={(open) => !open && setActiveModal(null)} />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-8 pt-3 h-auto glass-nav border-t border-white/20 dark:border-white/5 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-0.5 max-w-md mx-auto">
          {navItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center justify-center p-2 rounded-2xl w-full gap-1 transition-all
                ${isActive ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 scale-105 shadow-sm' : 'text-slate-400 dark:text-gray-500'}
              `}
            >
              <item.icon className="w-5 h-5 transition-transform active:scale-90" />
              <span className="text-[7px] font-black uppercase tracking-[0.1em] leading-none">{item.mobileLabel}</span>
            </NavLink>
          ))}
          <NavLink
            to="/subscriptions"
            className={({ isActive }) => `
              flex flex-col items-center justify-center p-2 rounded-2xl w-full gap-1 transition-all
              ${isActive ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 scale-105 shadow-sm' : 'text-slate-400 dark:text-gray-500'}
            `}
          >
            <CreditCard className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[7px] font-black uppercase tracking-[0.1em] leading-none">Vault</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => `
              flex flex-col items-center justify-center p-2 rounded-2xl w-full gap-1 transition-all
              ${isActive ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 scale-105 shadow-sm' : 'text-slate-400 dark:text-gray-500'}
            `}
          >
            <Settings className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[7px] font-black uppercase tracking-[0.1em] leading-none">Hub</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
};
