import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Check, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface AccountSwitcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AccountSwitcherDialog: React.FC<AccountSwitcherDialogProps> = ({ open, onOpenChange }) => {
  const { user, profile } = useAuth();

  const linkedAccounts = [
    { name: profile?.displayName, email: user?.email, photo: profile?.photoURL, active: true },
    { name: 'Praveen Patil (Work)', email: 'praveen.work@gmail.com', photo: '', active: false },
  ];

  const handleSwitch = async () => {
    // In a real app, this would handle multi-account session
    // Here we simulate by just showing the UI
    onOpenChange(false);
  };

  const addNewAccount = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-[3rem] glass-card border-none p-10 shadow-3xl bg-white dark:bg-slate-900">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-3xl font-display font-black dark:text-white tracking-tight uppercase">Switch Account</DialogTitle>
          <p className="text-[11px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest">Seamlessly transition between ecosystems.</p>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            {linkedAccounts.map((acc, i) => (
              <div 
                key={i} 
                onClick={acc.active ? undefined : handleSwitch}
                className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group ${
                  acc.active 
                    ? 'bg-brand-500/10 border-brand-500/30' 
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-brand-500/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-white dark:border-white/10 shadow-md">
                    <AvatarImage src={acc.photo} />
                    <AvatarFallback className="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-bold">
                      {acc.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                       <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{acc.name}</p>
                       {acc.active && <Badge className="h-4 px-1.5 bg-emerald-500 text-[8px] font-black uppercase text-white border-none">Active</Badge>}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{acc.email}</p>
                  </div>
                </div>
                {acc.active ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-all opacity-0 group-hover:opacity-100" />
                )}
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            onClick={addNewAccount}
            className="w-full rounded-2xl border-dashed border-slate-300 dark:border-white/10 h-16 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-[10px]">Link another account</span>
          </Button>

          <div className="p-4 rounded-2xl bg-brand-500/5 flex items-center gap-3 border border-brand-500/10">
            <ShieldCheck className="w-5 h-5 text-brand-500 shrink-0" />
            <p className="text-[10px] font-bold text-slate-600 dark:text-gray-400 leading-tight">
              Switching accounts will keep your settings but reload your financial data securely.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
