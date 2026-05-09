import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Check, X, Calculator, Zap, Sparkles, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from './ui/badge';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  isShared: boolean;
  splitAmount?: number;
}

interface WhatIfSimulatorProps {
  subscriptions: Subscription[];
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ subscriptions }) => {
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [sharedIds, setSharedIds] = useState<string[]>([]);

  const toggleRemove = (id: string) => {
    setRemovedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleShare = (id: string) => {
    setSharedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const currentMonthly = useMemo(() => {
    return subscriptions.reduce((acc, sub) => {
      const monthly = sub.billingCycle === 'monthly' ? sub.amount : sub.amount / 12;
      const share = sub.isShared ? (sub.splitAmount || monthly) : monthly;
      return acc + share;
    }, 0);
  }, [subscriptions]);

  const simulatedMonthly = useMemo(() => {
    return subscriptions.reduce((acc, sub) => {
      if (removedIds.includes(sub.id)) return acc;
      
      let monthly = sub.billingCycle === 'monthly' ? sub.amount : sub.amount / 12;
      
      // If we "share" it, assume 50% discount if not already shared
      if (sharedIds.includes(sub.id) && !sub.isShared) {
        monthly = monthly / 2;
      } else if (sub.isShared) {
        monthly = sub.splitAmount || (monthly / 2);
      }

      return acc + monthly;
    }, 0);
  }, [subscriptions, removedIds, sharedIds]);

  const savings = currentMonthly - simulatedMonthly;
  const yearlySavings = savings * 12;

  return (
    <Card className="glass-card border-none overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Calculator className="w-24 h-24" />
      </div>

      <CardContent className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-display font-black text-slate-900 dark:text-white">What-If Simulator</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plan your next move</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-brand-500 tracking-[0.2em] mb-1">Impact</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-display font-black text-slate-900 dark:text-white">
                {savings > 0 ? '-' : ''}{formatCurrency(Math.abs(savings))}/mo
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-bold text-slate-500">How can we optimize your digital life?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map(sub => (
              <motion.div 
                layout
                key={sub.id}
                className={`p-4 rounded-2xl border transition-all ${
                  removedIds.includes(sub.id) 
                    ? 'bg-red-50/50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20 grayscale opacity-50' 
                    : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{sub.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{formatCurrency(sub.amount)}/{sub.billingCycle === 'monthly' ? 'mo' : 'yr'}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={() => toggleRemove(sub.id)}
                  >
                    {removedIds.includes(sub.id) ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-slate-400" />}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`cursor-pointer h-7 px-3 rounded-full text-[10px] font-black tracking-wider uppercase transition-colors ${
                      sharedIds.includes(sub.id) || sub.isShared ? 'bg-brand-500 text-white border-transparent' : 'bg-slate-200 text-slate-500 dark:bg-white/10'
                    }`}
                    onClick={() => !sub.isShared && toggleShare(sub.id)}
                  >
                    {sub.isShared ? 'Already Shared' : (sharedIds.includes(sub.id) ? 'Simulating Split' : 'Try Sharing')}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {yearlySavings > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 rounded-3xl premium-gradient text-white flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">Yearly Savings Potential</p>
                  <h4 className="text-2xl font-display font-black">{formatCurrency(yearlySavings)}</h4>
                </div>
              </div>
              <div className="text-right">
                <TrendingDown className="w-8 h-8 opacity-20 ml-auto" />
                <p className="text-[10px] font-black uppercase mt-1">Ready to commit?</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
