import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Users, CreditCard, Calendar, Plus, X, Zap } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  open,
  onOpenChange,
  onSubmit
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly',
    nextRenewal: '',
    category: 'Entertainment',
    isShared: false,
    participants: [] as string[]
  });

  const [participantInput, setParticipantInput] = useState('');

  const splitAmount = useMemo(() => {
    const total = parseFloat(formData.amount) || 0;
    const totalParticipants = formData.participants.length + 1; // Always include owner
    return total / totalParticipants;
  }, [formData.amount, formData.participants]);

  const addParticipant = () => {
    const emailToAdd = participantInput.trim().toLowerCase();
    if (!emailToAdd) return;
    
    // Check if adding own email
    if (user?.email && emailToAdd === user.email.toLowerCase()) {
      toast.error("You are already included as owner", {
        description: "No need to add yourself to the split list."
      });
      return;
    }

    if (formData.participants.some(p => p.toLowerCase() === emailToAdd)) {
      toast.error("Duplicate email", {
        description: "This person is already in the split list."
      });
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToAdd)) {
      toast.error("Invalid email address");
      return;
    }

    setFormData({
      ...formData,
      participants: [...formData.participants, emailToAdd]
    });
    setParticipantInput('');
  };

  const removeParticipant = (email: string) => {
    setFormData({
      ...formData,
      participants: formData.participants.filter(p => p !== email)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.nextRenewal) {
      toast.error("Please fill all required fields");
      return;
    }

    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      splitAmount: formData.isShared ? splitAmount : parseFloat(formData.amount),
      status: 'active'
    });

    setFormData({
      name: '',
      amount: '',
      billingCycle: 'monthly',
      nextRenewal: '',
      category: 'Entertainment',
      isShared: false,
      participants: []
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-[3rem] glass-card border-none p-10 shadow-3xl">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-4xl font-display font-black dark:text-white tracking-tight leading-tight">Add Platform</DialogTitle>
          <p className="text-slate-500 dark:text-gray-400 font-medium">Track recurring expenses and split costs intelligently.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400 dark:text-gray-500 ml-1 tracking-[0.2em]">Platform Name</Label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Netflix..." 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="rounded-2xl h-14 pl-12 ios-input font-bold"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400 dark:text-gray-500 ml-1 tracking-[0.2em]">Total Amount (₹)</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="rounded-2xl h-14 ios-input font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400 dark:text-gray-500 ml-1 tracking-[0.2em]">Billing Cycle</Label>
                <Select value={formData.billingCycle} onValueChange={v => setFormData({...formData, billingCycle: v})}>
                  <SelectTrigger className="rounded-2xl h-14 ios-input font-bold">
                    <SelectValue placeholder="Select Cycle" />
                  </SelectTrigger>
                  <SelectContent className="glass-card rounded-2xl border-white/20">
                    <SelectItem value="monthly" className="font-bold">Monthly Plan</SelectItem>
                    <SelectItem value="yearly" className="font-bold">Annual Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400 dark:text-gray-500 ml-1 tracking-[0.2em]">Next Renewal</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="date" 
                    value={formData.nextRenewal}
                    onChange={e => setFormData({...formData, nextRenewal: e.target.value})}
                    className="rounded-2xl h-14 pl-12 ios-input font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-[1.75rem] border border-slate-100 dark:border-white/10 group hover:border-brand-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Shared Subscription</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Split the bill with your circle</p>
                </div>
              </div>
              <Switch 
                checked={formData.isShared}
                onCheckedChange={v => setFormData({...formData, isShared: v})}
                className="data-[state=checked]:bg-brand-600"
              />
            </div>
          </div>

          <AnimatePresence>
            {formData.isShared && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 pt-2"
              >
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-slate-400 dark:text-gray-500 ml-1 tracking-[0.2em]">Add participants</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter email address" 
                      value={participantInput}
                      onChange={e => setParticipantInput(e.target.value)}
                      className="rounded-xl h-14 ios-input font-bold"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                    />
                    <Button type="button" onClick={addParticipant} className="rounded-xl h-14 w-14 premium-gradient p-0 shadow-xl shadow-brand-500/20 active:scale-95 transition-all">
                      <Plus className="w-6 h-6" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold px-1 uppercase tracking-wider">Participants will receive a request to join this subscription</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-black text-slate-400 dark:text-gray-500 ml-1 tracking-[0.2em]">Participant Status</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-[10px] font-black text-brand-600">ME</div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">You (Owner)</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-none">Active</Badge>
                    </div>
                    {formData.participants.map(p => (
                      <div key={p} className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-slate-400">{p.charAt(0).toUpperCase()}</div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{p}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-400 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-none flex items-center gap-1">
                            Pending <span className="animate-pulse">⏳</span>
                          </Badge>
                          <button onClick={() => removeParticipant(p)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 bg-brand-600 rounded-[2.5rem] text-white shadow-3xl shadow-brand-500/40 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <Zap className="w-24 h-24" />
                  </div>
                  <div className="relative z-10 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Cost</p>
                      <p className="text-2xl font-display font-black">{formatCurrency(parseFloat(formData.amount) || 0)}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Participants</p>
                      <p className="text-2xl font-display font-black">{formData.participants.length + 1}</p>
                    </div>
                    <div className="col-span-2 pt-4 border-t border-white/20 mt-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Each Person Pays</p>
                       <p className="text-4xl font-display font-black tracking-tight">{formatCurrency(splitAmount)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button type="submit" className="w-full h-20 rounded-[2rem] premium-gradient text-2xl font-black shadow-[0_24px_48px_-12px_rgba(37,99,235,0.4)] active:scale-95 transition-all text-white">
            Activate Subscription
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
