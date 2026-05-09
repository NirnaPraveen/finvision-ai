import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CreditCard, 
  Wallet, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  recipientEmail: string;
  reason: string;
  onConfirm: (method: 'simulated' | 'upi') => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onOpenChange,
  amount,
  recipientEmail,
  reason,
  onConfirm
}) => {
  const [method, setMethod] = useState<'simulated' | 'upi'>('simulated');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate bank lag
    setIsProcessing(false);
    onConfirm(method);
    onOpenChange(false);
  };

  const upiUrl = `upi://pay?pa=${recipientEmail}&pn=${recipientEmail.split('@')[0]}&am=${amount}&tn=${encodeURIComponent(reason)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-[3rem] glass-card border-none p-10 shadow-3xl">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight text-center">Checkout</DialogTitle>
          <p className="text-slate-500 dark:text-gray-400 font-medium text-center">Securely settle your balance.</p>
        </DialogHeader>

        <div className="space-y-8">
          {/* Amount Display */}
          <div className="p-8 bg-brand-600 rounded-[2rem] text-white flex flex-col items-center shadow-2xl shadow-brand-500/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-500">
               <ShieldCheck className="w-12 h-12" />
            </div>
            <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-2">Total Payable</p>
            <h2 className="text-5xl font-display font-black">{formatCurrency(amount)}</h2>
            <p className="text-[10px] mt-4 font-bold bg-white/10 px-4 py-1.5 rounded-full uppercase tracking-tighter truncate max-w-full">
               To: {recipientEmail}
            </p>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setMethod('simulated')}
              className={cn(
                "p-5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group",
                method === 'simulated' 
                  ? "border-brand-600 bg-brand-50/50 dark:bg-brand-900/20" 
                  : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:border-slate-200"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  method === 'simulated' ? "bg-brand-600 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-500"
                )}>
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">Simulated Balance</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Instant Settlement</p>
                </div>
              </div>
              {method === 'simulated' && <CheckCircle2 className="w-5 h-5 text-brand-600 animate-in zoom-in" />}
            </button>

            <button
              onClick={() => setMethod('upi')}
              className={cn(
                "p-5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group",
                method === 'upi' 
                  ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20" 
                  : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:border-slate-200"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  method === 'upi' ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-500"
                )}>
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">UPI Deep Link</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Connect Apps</p>
                </div>
              </div>
              {method === 'upi' && <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-in zoom-in" />}
            </button>
          </div>

          <Button 
            disabled={isProcessing}
            onClick={handleConfirm}
            className={cn(
              "w-full h-20 rounded-[1.75rem] text-2xl font-black shadow-2xl transition-all active:scale-95 group",
              method === 'simulated' ? "premium-gradient shadow-brand-500/30" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30 font-display"
            )}
          >
            {isProcessing ? (
               <div className="flex items-center gap-3">
                 <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                 Processing...
               </div>
            ) : method === 'upi' ? (
               <a href={upiUrl} className="flex items-center justify-center gap-3 w-full">
                 Pay via UPI <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
               </a>
            ) : (
               <div className="flex items-center justify-center gap-3 w-full">
                 Confirm Settlement <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
               </div>
            )}
          </Button>
          
          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-[0.2em]">
            Encrypted & Secure Transaction
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
