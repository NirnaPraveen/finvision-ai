import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Check, 
  X, 
  CreditCard, 
  Calendar, 
  Info,
  Clock,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';

export const NotificationsPage: React.FC = () => {
  const { notifications, acceptSubscription, rejectSubscription } = useFinance();

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    if (action === 'accept') {
      await acceptSubscription(id);
    } else {
      await rejectSubscription(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 text-white">
              <Bell className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600">Action Center</span>
          </div>
          <h1 className="text-5xl font-display font-black text-slate-900 dark:text-white tracking-tight leading-tight">Notifications</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-2 font-medium">Accept pending requests and stay updated on your financial circle.</p>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 flex flex-col items-center justify-center text-center glass-card border-none rounded-[3rem]"
            >
              <div className="w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-8">
                <Clock className="w-16 h-16 text-slate-200 dark:text-gray-800" />
              </div>
              <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white mb-2 tracking-tight">All clear!</h3>
              <p className="text-slate-500 dark:text-gray-400 font-medium max-w-xs mx-auto">
                No pending requests or alerts at the moment.
              </p>
            </motion.div>
          ) : (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "p-6 rounded-[2rem] border transition-all duration-300 relative overflow-hidden group",
                  notif.read ? "glass-card opacity-70" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-xl"
                )}
              >
                {!notif.read && (
                  <div className="absolute top-0 right-0 p-4">
                    <div className="w-2 h-2 rounded-full bg-brand-600 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                      notif.type === 'subscription_request' ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20" : "bg-slate-50 text-slate-600 dark:bg-white/5"
                    )}>
                      {notif.type === 'subscription_request' ? <UserPlus className="w-7 h-7" /> : <Info className="w-7 h-7" />}
                    </div>
                    
                    <div>
                      <h4 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight">{notif.title}</h4>
                      <p className="text-slate-500 dark:text-gray-400 font-medium text-sm mt-1 leading-relaxed">{notif.message}</p>
                      
                      {notif.payload && notif.type === 'subscription_request' && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-slate-600 dark:text-gray-300">Share: {formatCurrency(notif.payload.amount)}</span>
                          </div>
                          <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">Master: {notif.payload.name}</span>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-3 font-bold uppercase tracking-widest">
                        {format(parseISO(notif.createdAt), 'MMM dd, yyyy • hh:mm a')}
                      </p>
                    </div>
                  </div>

                  {notif.type === 'subscription_request' && notif.status === 'pending' && (
                    <div className="flex items-center gap-3">
                      <Button 
                        onClick={() => handleAction(notif.id, 'reject')}
                        variant="outline" 
                        className="rounded-xl h-14 px-8 border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/10 dark:border-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/20 font-black tracking-tight"
                      >
                        <X className="w-4 h-4 mr-2" /> Reject
                      </Button>
                      <Button 
                        onClick={() => handleAction(notif.id, 'accept')}
                        className="premium-gradient rounded-xl h-14 px-10 font-black shadow-lg shadow-brand-500/20 tracking-tight"
                      >
                        <Check className="w-4 h-4 mr-2" /> Accept & Join
                      </Button>
                    </div>
                  )}

                  {notif.status && notif.status !== 'pending' && (
                    <div className={cn(
                      "px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px]",
                      notif.status === 'accepted' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 shadow-none border-none"
                    )}>
                      {notif.status}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
