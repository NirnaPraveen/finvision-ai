import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Check, 
  TrendingUp, 
  History, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BillingDialog: React.FC<BillingDialogProps> = ({ open, onOpenChange }) => {
  const currentPlan = {
    name: 'Premium',
    price: 499,
    interval: 'month',
    renewalDate: '2026-06-01',
    status: 'active'
  };

  const history = [
    { date: '2026-05-01', amount: 499, status: 'Success', id: 'INV-001' },
    { date: '2026-04-01', amount: 499, status: 'Success', id: 'INV-002' },
    { date: '2026-03-01', amount: 499, status: 'Success', id: 'INV-003' },
  ];

  const benefits = [
    'Unlimited shared splits',
    'Real-time AI insights',
    'Priority customer support',
    'Custom categorization',
    'Multi-device sync'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-[3rem] glass-card border-none p-0 overflow-hidden shadow-3xl bg-white dark:bg-slate-900">
        <div className="p-10 space-y-8">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-brand-500 text-white border-none rounded-lg px-3 py-1 font-black uppercase text-[10px] tracking-widest">
                Premium Active
              </Badge>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Billing Cycle: Monthly</span>
            </div>
            <DialogTitle className="text-3xl font-display font-black dark:text-white tracking-tight leading-tight">Billing & Plans</DialogTitle>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest">Manage your subscription and payments.</p>
          </DialogHeader>

          {/* Plan Card */}
          <Card className="rounded-[2.5rem] bg-slate-950 text-white border-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Zap className="w-48 h-48 text-brand-500" />
            </div>
            <CardContent className="p-8 relative z-10 flex flex-col md:flex-row justify-between gap-8 h-full">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">Current Plan</p>
                  <h3 className="text-4xl font-display font-black tracking-tight">{currentPlan.name}</h3>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium opacity-80">Renews on {currentPlan.renewalDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium opacity-80">{formatCurrency(currentPlan.price)}/month</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-end gap-2">
                <Button className="rounded-2xl bg-white text-slate-950 hover:bg-white/90 font-black text-xs uppercase tracking-widest h-12 px-6">
                  Manage Plan
                </Button>
                <Button variant="link" className="text-brand-400 font-bold text-xs p-0 h-auto">
                  Downgrade to Free
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Benefits */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plan Benefits</h4>
              <ul className="space-y-3">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-500/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-brand-501" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment History */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Recent Invoices</h4>
              <div className="space-y-2">
                {history.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 group hover:border-brand-500/30 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <History className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.date}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">{item.id}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-brand-500/5 dark:bg-white/2 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Payment Method</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visa ending in •••• 4421</p>
            </div>
          </div>
          <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest hover:bg-brand-500/10">
            Edit <ArrowRight className="w-3 h-3 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
