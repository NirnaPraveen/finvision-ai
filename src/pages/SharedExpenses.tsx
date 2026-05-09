import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Users, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock,
  UserPlus,
  Info,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  History,
  LayoutGrid,
  List
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { SharedExpenseCard } from '@/components/finance/SharedExpenseCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SettlePaymentDialog } from '@/components/SettlePaymentDialog';

export const SharedExpensesPage: React.FC = () => {
  const { sharedExpenses, settlements, completePayment } = useFinance();
  const { user } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [settleModal, setSettleModal] = useState<{ open: boolean; amount: number; recipient: string; reason: string; id: string | null }>({
    open: false, amount: 0, recipient: '', reason: '', id: null
  });

  const [newShared, setNewShared] = useState({
    amount: '',
    description: '',
    participants: '', // comma separated emails for now
    category: 'Entertainment'
  });

  const summary = useMemo(() => {
    if (!user) return { owed: 0, owe: 0, net: 0 };
    
    return sharedExpenses
      .filter(e => e.status === 'pending')
      .reduce((acc, exp) => {
        const isCreator = exp.creatorId === user.uid;
        const myShare = exp.splits[user.email?.replace(/\./g, '_') || ''] || 0;
        
        if (isCreator) {
          acc.owed += (exp.amount - myShare);
        } else {
          acc.owe += myShare;
        }
        acc.net = acc.owed - acc.owe;
        return acc;
      }, { owed: 0, owe: 0, net: 0 });
  }, [sharedExpenses, user]);

  const personWiseBalances = useMemo(() => {
    if (!user) return [];
    
    const balances: Record<string, number> = {};
    
    sharedExpenses
      .filter(e => e.status === 'pending')
      .forEach(exp => {
        const isCreator = exp.creatorId === user.uid;
        const myEmail = user.email || '';
        
        if (isCreator) {
          // If I paid, then all other participants owe me their share
          exp.participants?.forEach((email: string) => {
            if (email !== myEmail) {
              const share = exp.splits[email.replace(/\./g, '_')] || 0;
              balances[email] = (balances[email] || 0) + share;
            }
          });
        } else {
          // If someone else paid, I owe the creator my share
          const share = exp.splits[myEmail.replace(/\./g, '_')] || 0;
          const creatorEmail = exp.creatorEmail || 'creator@finvision.ai';
          balances[creatorEmail] = (balances[creatorEmail] || 0) - share;
        }
      });
      
    return Object.entries(balances)
      .map(([id, amount]) => ({ id, amount }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, [sharedExpenses, user]);

  const handleAddShared = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    const participantList = newShared.participants.split(',').map(p => p.trim().toLowerCase()).filter(p => p && p !== user.email);
    participantList.push(user.email); // Add self by email

    const participantStatuses: Record<string, string> = {};
    participantList.forEach(email => {
      participantStatuses[email.replace(/\./g, '_')] = email === user.email ? 'settled' : 'pending';
    });

    try {
      await addDoc(collection(db, 'shared_expenses'), {
        amount: parseFloat(newShared.amount),
        description: newShared.description,
        category: newShared.category,
        creatorId: user.uid,
        creatorEmail: user.email,
        participants: participantList,
        date: new Date().toISOString(),
        status: 'pending',
        participantStatuses,
        splits: participantList.reduce((acc: any, email) => {
          acc[email.replace(/\./g, '_')] = parseFloat(newShared.amount) / participantList.length;
          return acc;
        }, {})
      });
      setIsAddOpen(false);
      setNewShared({ amount: '', description: '', participants: '', category: 'Entertainment' });
      toast.success("Shared expense created!");
    } catch (error) {
      toast.error("Failed to create shared expense.");
    }
  };

  const handleSettle = async (id: string, customInfo?: any) => {
    if (!user || !user.email) return;
    
    if (customInfo) {
      setSettleModal({
        open: true,
        amount: customInfo.amount,
        recipient: customInfo.creatorEmail || 'creator@finvision.ai',
        reason: `Settlement: ${customInfo.description}`,
        id: id
      });
    } else {
      // Default settle logic if no custom info (fallback)
      try {
        const emailKey = user.email.replace(/\./g, '_');
        await updateDoc(doc(db, 'shared_expenses', id), { 
          [`participantStatuses.${emailKey}`]: 'settled' 
        });
        toast.success("Share settled!");
      } catch (error) {
        toast.error("Failed to settle.");
      }
    }
  };

  const confirmIndividualSettle = async (proofUrl?: string) => {
    if (!user || !user.email || !settleModal.id) return;
    try {
      const emailKey = user.email.replace(/\./g, '_');
      await updateDoc(doc(db, 'shared_expenses', settleModal.id), { 
        [`participantStatuses.${emailKey}`]: 'settled' 
      });
      
      await completePayment(
        user.email,
        settleModal.recipient,
        settleModal.amount,
        settleModal.reason,
        proofUrl
      );
      
      toast.success("Share settled with proof!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to settle expense.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shared_expenses', id));
      toast.success("Expense deleted.");
    } catch (error) {
      toast.error("Failed to delete.");
    }
  };

  const filteredExpenses = sharedExpenses.filter(e => {
    const matchesTab = activeTab === 'all' ? true : e.status === activeTab;
    const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8 lg:space-y-12 pb-32 md:pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative overflow-hidden p-1 bg-gradient-to-r from-transparent via-brand-50/10 to-transparent dark:via-brand-500/5">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <ArrowRightLeft className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Collaborative Wallet</span>
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 dark:text-white tracking-tight leading-tight">Shared Expenses</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 mt-2 font-medium max-w-lg">Manage splits, track settlements, and maintain balance with your inner circle.</p>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button 
            className="ios-btn premium-gradient px-8 py-7 rounded-[1.5rem] font-black shadow-2xl shadow-brand-500/40 text-base"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="w-5 h-5 mr-3" />
            New Split Bill
          </Button>
        </div>
      </div>

      {/* Summary Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
      >
        <div className="glass-card p-6 rounded-[2rem] border-white/40 dark:border-white/5 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
            <TrendingUp className="w-12 h-12 text-emerald-600" />
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1">Owed to you</p>
          <h3 className="text-3xl md:text-4xl font-display font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.owed)}</h3>
          <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/40 font-bold mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Incoming Balance
          </p>
        </div>
        <div className="glass-card p-6 rounded-[2rem] border-white/40 dark:border-white/5 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
            <TrendingDown className="w-12 h-12 text-rose-600" />
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1">You owe</p>
          <h3 className="text-3xl md:text-4xl font-display font-black text-rose-600 dark:text-rose-400">{formatCurrency(summary.owe)}</h3>
          <p className="text-[10px] text-rose-600/60 dark:text-rose-400/40 font-bold mt-2 flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3" /> Outgoing Balance
          </p>
        </div>
        <div className={cn(
          "p-6 rounded-[2rem] border-none flex flex-col justify-between relative overflow-hidden shadow-2xl transition-all duration-500 sm:col-span-2 md:col-span-1",
          summary.net >= 0 
            ? "bg-brand-600 text-white shadow-brand-500/30" 
            : "bg-rose-600 text-white shadow-rose-500/30"
        )}>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Net Balance</p>
          <h3 className="text-3xl md:text-4xl font-display font-black text-white">
            {summary.net >= 0 ? "+" : ""}{formatCurrency(summary.net)}
          </h3>
          <p className="text-[10px] text-white/50 font-bold mt-2 uppercase tracking-widest">
            {summary.net >= 0 ? "Profit Position" : "Deficit Position"}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-8">
          {/* Controls & Filtration */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-[1.25rem]">
              {['all', 'pending', 'settled'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                    activeTab === tab 
                      ? "bg-white dark:bg-white/10 text-brand-600 dark:text-white shadow-sm" 
                      : "text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description..." 
                className="w-full pl-12 pr-4 py-3 rounded-[1.25rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 dark:focus:ring-brand-500/40 transition-all font-display"
              />
            </div>
          </div>

          {/* Settle All Recommendation */}
          {summary.owe > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-[2rem] bg-indigo-900 border-none relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-20 transform group-hover:rotate-12 transition-transform duration-500">
                <Sparkles className="w-24 h-24 text-indigo-300" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center shrink-0">
                    <History className="w-8 h-8 text-indigo-200" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold tracking-tight">One-Tap Settlement</h3>
                    <p className="text-indigo-200 mt-1 max-w-sm font-medium leading-relaxed">
                      Wipe your debt slate clean. You can settle everything with exactly <span className="text-white font-black">{formatCurrency(summary.owe)}</span> right now.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => toast.success(`Smart settlement suggested: Settle everything with ${formatCurrency(summary.owe)}`)}
                  className="ios-btn bg-white text-indigo-900 hover:bg-indigo-50 px-10 py-7 rounded-2xl font-black text-base shadow-2xl shadow-black/20 shrink-0"
                >
                  Settle All Debts
                </Button>
              </div>
            </motion.div>
          )}

          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredExpenses.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-32 flex flex-col items-center justify-center text-center glass-card border-none rounded-[3rem]"
                >
                  <div className="w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-8">
                    <Clock className="w-16 h-16 text-slate-200 dark:text-gray-800" />
                  </div>
                  <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white mb-2 tracking-tight">No expenses found</h3>
                  <p className="text-slate-500 dark:text-gray-400 font-medium max-w-xs mx-auto">
                    Try adjusting your filters or add a new split to get started.
                  </p>
                  <Button 
                    onClick={() => setIsAddOpen(true)}
                    className="mt-8 ios-btn premium-gradient px-8 py-6 rounded-2xl font-bold"
                  >
                    Track First Split
                  </Button>
                </motion.div>
              ) : (
                filteredExpenses.map((expense) => (
                  <SharedExpenseCard 
                    key={expense.id} 
                    expense={expense} 
                    currentUserId={user?.uid || ''}
                    currentUserEmail={user?.email || ''}
                    onSettle={handleSettle}
                    onDelete={handleDelete}
                    onEdit={(exp) => {
                      setNewShared({
                        amount: exp.amount.toString(),
                        description: exp.description,
                        participants: (exp.participants || []).filter((p: string) => p !== user?.email).join(', '),
                        category: exp.category
                      });
                      setIsAddOpen(true);
                    }}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-10">
          <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden">
            <CardHeader className="border-b border-white/40 dark:border-white/5 pb-6">
              <CardTitle className="text-lg font-display font-black flex items-center gap-3 text-slate-900 dark:text-white">
                <Users className="w-5 h-5 text-brand-600" />
                Individual Balances
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-8 space-y-6">
              {personWiseBalances.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium italic text-center py-6">All accounts balanced.</p>
              ) : (
                personWiseBalances.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10 border-2 border-slate-100 dark:border-white/10 shadow-sm">
                        <AvatarFallback className="bg-slate-100 dark:bg-white/10 text-[10px] font-black uppercase">
                          {item.id.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-gray-200">
                          {item.id.slice(0, 8)}...
                        </p>
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          item.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        )}>
                          {item.amount > 0 ? "owes you" : "you owe"}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-display font-black",
                      item.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                      {formatCurrency(Math.abs(item.amount))}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-none rounded-[2.5rem] bg-brand-50/50 dark:bg-brand-500/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display font-black flex items-center gap-3 text-slate-900 dark:text-white">
                <Sparkles className="w-5 h-5 text-brand-600" />
                Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-8">
              <div className="relative space-y-8">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200 dark:bg-white/10" />
                {settlements.slice(0, 4).map((s, i) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 z-10 border-4 border-white dark:border-black shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                        Settlement processed for <span className="text-emerald-600">{formatCurrency(s.amount)}</span>.
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium mt-1">Just now</p>
                    </div>
                  </div>
                ))}
                {sharedExpenses.slice(0, 3).map((e, i) => (
                  <div key={`exp-${i}`} className="flex gap-4 relative">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0 z-10 border-4 border-white dark:border-black shadow-sm">
                      <LayoutGrid className="w-3.5 h-3.5 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                        Split created: <span className="font-medium opacity-70 italic">{e.description}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium mt-1">2 hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAddOpen(true)}
        className="md:hidden fixed bottom-24 right-6 w-16 h-16 rounded-full premium-gradient shadow-3xl shadow-brand-500/40 flex items-center justify-center text-white z-50 group transition-all duration-500"
      >
        <Plus className="w-8 h-8 group-hover:scale-125 transition-transform duration-500" />
      </motion.button>

      {/* Split Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[3rem] glass-card border-none p-10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)]">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-4xl font-display font-black dark:text-white tracking-tight leading-tight">Create Split Bill</DialogTitle>
            <p className="text-slate-500 dark:text-gray-400 font-medium">Equal distribution across your circle.</p>
          </DialogHeader>
          <form onSubmit={handleAddShared} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 ml-1">Total Amount (₹)</Label>
              <Input 
                id="amount" 
                type="number" 
                placeholder="0.00" 
                required 
                value={newShared.amount}
                onChange={e => setNewShared({...newShared, amount: e.target.value})}
                className="rounded-2xl ios-input h-16 text-xl font-bold dark:text-white px-6 transition-all focus:ring-4 focus:ring-brand-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 ml-1">Context / Description</Label>
              <Input 
                id="desc" 
                placeholder="e.g. Weekend Roadtrip" 
                required 
                value={newShared.description}
                onChange={e => setNewShared({...newShared, description: e.target.value})}
                className="rounded-2xl ios-input h-16 font-semibold dark:text-white px-6 transition-all focus:ring-4 focus:ring-brand-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participants" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 ml-1">Collaborators (Emails)</Label>
              <Input 
                id="participants" 
                placeholder="ashwin@example.com, neha@example.com" 
                required 
                value={newShared.participants}
                onChange={e => setNewShared({...newShared, participants: e.target.value})}
                className="rounded-2xl ios-input h-16 font-semibold dark:text-white px-6 transition-all focus:ring-4 focus:ring-brand-500/20"
              />
              <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold ml-1 uppercase tracking-widest opacity-50">Separate with commas</p>
            </div>
            <Button type="submit" className="w-full rounded-2xl premium-gradient h-16 text-xl font-black shadow-2xl shadow-brand-500/20 active:scale-95 transition-all">Launch Split</Button>
          </form>
        </DialogContent>
      </Dialog>

      <SettlePaymentDialog 
        open={settleModal.open}
        onOpenChange={(open) => setSettleModal(prev => ({ ...prev, open }))}
        amount={settleModal.amount}
        recipient={settleModal.recipient}
        reason={settleModal.reason}
        onConfirm={confirmIndividualSettle}
      />
    </div>
  );
};

