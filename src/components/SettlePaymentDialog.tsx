import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { Camera, ShieldCheck, Sparkles } from 'lucide-react';

interface SettlePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  recipient: string;
  reason: string;
  onConfirm: (proofUrl?: string) => Promise<void>;
}

export const SettlePaymentDialog: React.FC<SettlePaymentDialogProps> = ({
  open,
  onOpenChange,
  amount,
  recipient,
  reason,
  onConfirm
}) => {
  const [proofUrl, setProofUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(proofUrl || undefined);
      onOpenChange(false);
      setProofUrl('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] glass-card border-none p-10 overflow-hidden shadow-2xl">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -z-10" />
        
        <DialogHeader className="space-y-4">
          <div className="w-12 h-12 rounded-2xl premium-gradient flex items-center justify-center shadow-lg shadow-brand-500/20 mb-2">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-3xl font-display font-black dark:text-white tracking-tight leading-tight">Authorize Settlement</DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500 dark:text-gray-400">
            Confirming payment of <span className="font-black text-slate-900 dark:text-white underline decoration-brand-500/30 underline-offset-4">{formatCurrency(amount)}</span> to <span className="font-black text-brand-600">{recipient.split('@')[0]}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 my-8">
            <div className="space-y-3">
                <Label htmlFor="proof" className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Camera className="w-3 h-3" /> Payment Proof (Optional)
                </Label>
                <Input 
                    id="proof" 
                    placeholder="https://imgur.com/screenshot.jpg" 
                    value={proofUrl}
                    onChange={e => setProofUrl(e.target.value)}
                    className="rounded-2xl ios-input h-14 font-semibold dark:text-white px-6 transition-all focus:ring-4 focus:ring-brand-500/10"
                />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-50 ml-1 italic">
                    Attach a screenshot URL for instant verification
                </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    Once verified, this will clear your debt in <span className="font-bold">{recipient.split('@')[0]}'s</span> treasury.
                </p>
            </div>
        </div>

        <DialogFooter className="sm:justify-start gap-4 flex-col sm:flex-row">
          <Button 
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="w-full flex-1 ios-btn premium-gradient h-14 text-lg font-black shadow-xl shadow-brand-500/20 rounded-2xl"
          >
            Confirm & Verify
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-14 rounded-2xl font-bold opacity-50 hover:opacity-100 transition-opacity"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
