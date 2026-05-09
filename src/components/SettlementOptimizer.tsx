import React, { useState } from 'react';
import { OptimizedTransaction } from '@/lib/settlement';
import { Card, CardContent } from './ui/card';
import { ArrowRight, User, Users, Info, CheckCircle2, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { useFinance } from '@/context/FinanceContext';
import { SettlePaymentDialog } from './SettlePaymentDialog';

interface SettlementOptimizerProps {
  transactions: OptimizedTransaction[];
  currentUserEmail: string;
}

export const SettlementOptimizer: React.FC<SettlementOptimizerProps> = ({ transactions, currentUserEmail }) => {
  const { completePayment } = useFinance();
  const [settleModal, setSettleModal] = useState<{ open: boolean; tx: OptimizedTransaction | null }>({
    open: false, tx: null
  });

  if (transactions.length === 0) return null;

  const handleSettle = (tx: OptimizedTransaction) => {
    setSettleModal({ open: true, tx });
  };

  const confirmSettle = async (proofUrl?: string) => {
    if (!settleModal.tx) return;
    const { tx } = settleModal;
    await completePayment(
      tx.from,
      tx.to,
      tx.amount,
      `Optimized Settlement from ${tx.from.split('@')[0]} to ${tx.to.split('@')[0]}`,
      proofUrl
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Payment Optimization</h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-500/10 rounded-full border border-brand-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            <p className="text-[10px] font-black text-brand-600 uppercase tracking-wider">Engine Active</p>
        </div>
      </div>

      <Card className="glass-card border-none overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-brand-50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/10">
            <Info className="w-5 h-5 text-brand-500 mt-1 shrink-0" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                Our <span className="text-brand-600 font-black">Settlement Engine</span> has analyzed your circle's debts. By following this sequence, you can resolve all balances with <span className="font-bold underline">{transactions.length} transactions</span> instead of separate individual splits.
            </p>
          </div>

          <div className="space-y-4">
            {transactions.map((tx, idx) => {
              const isRelevant = tx.from === currentUserEmail || tx.to === currentUserEmail;
              
              return (
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx} 
                    className={`flex items-center justify-between p-5 rounded-2xl transition-all border ${
                        isRelevant 
                        ? 'bg-slate-900 text-white border-transparent shadow-xl shadow-brand-500/10 scale-[1.02]' 
                        : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 opacity-60'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRelevant ? 'bg-white/10' : 'bg-slate-200 dark:bg-white/10'}`}>
                            <User className="w-5 h-5 text-brand-500" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-tighter mt-1 opacity-50">{tx.from === currentUserEmail ? 'YOU' : tx.from.split('@')[0]}</p>
                    </div>

                    <ArrowRight className={`w-4 h-4 ${isRelevant ? 'text-brand-400' : 'text-slate-300'}`} />

                    <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRelevant ? 'bg-white/10' : 'bg-slate-200 dark:bg-white/10'}`}>
                            <User className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-tighter mt-1 opacity-50">{tx.to === currentUserEmail ? 'YOU' : tx.to.split('@')[0]}</p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                        <p className={`text-sm font-black ${isRelevant ? 'text-brand-400' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(tx.amount)}</p>
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Single Settlement</p>
                    </div>
                    {tx.from === currentUserEmail && (
                        <Button 
                            onClick={() => handleSettle(tx)}
                            size="sm" 
                            className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-black text-[10px] h-9 px-4"
                        >
                            <Zap className="w-3 h-3 mr-2" />
                            Settle Now
                        </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 justify-center pt-2">
            <CheckCircle2 className="w-4 h-4 text-brand-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All indirect debts optimized</p>
          </div>
        </CardContent>
      </Card>

      <SettlePaymentDialog 
        open={settleModal.open}
        onOpenChange={(open) => setSettleModal(prev => ({ ...prev, open }))}
        amount={settleModal.tx?.amount || 0}
        recipient={settleModal.tx?.to || ''}
        reason={`Optimized Settlement`}
        onConfirm={confirmSettle}
      />
    </div>
  );
};
