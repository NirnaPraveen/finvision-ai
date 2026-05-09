import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp,
  PieChart as PieIcon,
  BarChart as BarIcon,
  TrendingDown, 
  CreditCard, 
  Users, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Plus,
  Receipt,
  Zap,
  Target,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Wallet,
  Calendar,
  History,
  Info,
  ChevronRight,
  Activity,
  DollarSign,
  CheckCircle2,
  Search,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
import { getFinancialInsights } from '@/lib/gemini';
import { format, isToday, isYesterday, subDays, startOfDay, endOfDay, parseISO, isSameMonth } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { SettlementOptimizer } from '@/components/SettlementOptimizer';
import { WhatIfSimulator } from '@/components/WhatIfSimulator';
import { optimizeTransactions } from '@/lib/settlement';
import { Markdown } from '@/components/ui/markdown'; 
import { SettlePaymentDialog } from '@/components/SettlePaymentDialog';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { handleFirestoreError, OperationType } from '@/lib/firebase-utils';

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

// Animated Number Component
const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={value}
      className="inline-block"
    >
      {formatCurrency(value)}
    </motion.span>
  );
};

export const Dashboard: React.FC = () => {
  const { 
    expenses, 
    sharedExpenses, 
    subscriptions, 
    completePayment, 
    loading, 
    smartReminders,
    sendReminders 
  } = useFinance();
  const { user, profile } = useAuth();

  const [insights, setInsights] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [settleModal, setSettleModal] = useState<{ open: boolean; amount: number; recipient: string; reason: string; items: any[] }>({
    open: false, amount: 0, recipient: '', reason: '', items: []
  });

  // Modal states for buttons
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  // Form states copied from pages
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'Food',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    transactionType: 'expense' as 'income' | 'expense'
  });

  const [newShared, setNewShared] = useState({
    amount: '',
    description: '',
    participants: '',
    category: 'Entertainment'
  });

  const auditRef = React.useRef<HTMLDivElement>(null);

  const scrollToAudit = () => {
    auditRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const path = 'expenses';
    try {
      await addDoc(collection(db, path), {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        userId: user.uid,
        type: newExpense.transactionType,
        createdAt: new Date().toISOString()
      });
      setIsExpenseModalOpen(false);
      setNewExpense({ 
        amount: '', 
        category: 'Food', 
        description: '', 
        date: format(new Date(), 'yyyy-MM-dd'),
        transactionType: 'expense'
      });
      toast.success("Transaction added successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      toast.error("Failed to add transaction.");
    }
  };

  const handleAddShared = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    const path = 'shared_expenses';
    const participantList = newShared.participants.split(',').map(p => p.trim().toLowerCase()).filter(p => p && p !== user.email);
    participantList.push(user.email);

    const participantStatuses: Record<string, string> = {};
    participantList.forEach(email => {
      participantStatuses[email.replace(/\./g, '_')] = email === user.email ? 'settled' : 'pending';
    });

    try {
      await addDoc(collection(db, path), {
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
      setIsSplitModalOpen(false);
      setNewShared({ amount: '', description: '', participants: '', category: 'Entertainment' });
      toast.success("Shared expense created!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      toast.error("Failed to create shared expense.");
    }
  };

  // 1. Data Processing
  const stats = useMemo(() => {
    if (!user) return null;

    const totalExpenses = expenses
      .filter(e => e.type !== 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const totalIncome = expenses
      .filter(e => e.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    const monthlyExpenses = expenses
      .filter(e => e.type !== 'income' && new Date(e.date).getMonth() === new Date().getMonth())
      .reduce((acc, curr) => acc + curr.amount, 0);

    const myEmailId = (user?.email || '').replace(/\./g, '_');
    const usersWhoOweMe = new Set<string>();
    
    let pendingPayments = 0;
    let owedToMe = 0;

    sharedExpenses.forEach(exp => {
      // Amount I owe others
      const myStatus = exp.participantStatuses?.[myEmailId];
      if (myStatus === 'pending') {
        pendingPayments += (exp.splits[myEmailId] || 0);
      }

      // Amount others owe me
      if (exp.creatorId === user?.uid) {
        Object.entries(exp.participantStatuses || {}).forEach(([emailId, status]) => {
          if (emailId !== myEmailId && status === 'pending') {
            const amount = exp.splits[emailId] || 0;
            if (amount > 0) {
              owedToMe += amount;
              usersWhoOweMe.add(emailId);
            }
          }
        });
      }
    });

    const usersWhoOweMeCount = usersWhoOweMe.size;

    const upcomingRenewals = subscriptions
      .filter(s => {
          const d = parseISO(s.nextRenewal);
          const now = new Date();
          const limit = subDays(now, -7);
          return d >= now && d <= limit;
      })
      .sort((a, b) => new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime());

    // Calculate optimized transactions
    const optimizedPayments = optimizeTransactions(sharedExpenses, user.email || '');

    // 5. Financial Health Score (Feature 4)
    // Base 100
    let healthScore = 100;
    const debtRatio = (pendingPayments / (totalIncome || 1)) * 100;
    const subRatio = (subscriptions.length / 10) * 10; // Penalty of 10 points per 10 subs
    const savingsRatio = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

    healthScore -= Math.min(debtRatio, 30);
    healthScore -= Math.min(subRatio, 20);
    if (savingsRatio < 10) healthScore -= 20;
    else if (savingsRatio > 30) healthScore += 10;
    
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    const scoreMessage = healthScore > 80 ? "Your financial armor is impenetrable." 
                      : healthScore > 50 ? "Healthy, but check your pending splits." 
                      : "Critical: High debt-to-income ratio detected.";

    return { 
      totalExpenses, 
      totalIncome, 
      netBalance, 
      monthlyExpenses, 
      pendingPayments, 
      owedToMe, 
      usersWhoOweMeCount, 
      upcomingRenewals, 
      optimizedPayments, 
      healthScore, 
      scoreMessage,
      socialSummary: {
        owe: pendingPayments,
        owed: owedToMe,
        net: owedToMe - pendingPayments
      }
    };
  }, [expenses, sharedExpenses, subscriptions, user]);

  // Dynamic Tips
  const tips = useMemo(() => [
    { icon: Target, title: "Budget Mastery", text: "You've stayed 15% below your target in Entertainment this month." },
    { icon: Zap, title: "Swift Saver", text: "Switching to an annual Netflix plan could save you ₹480/year." },
    { icon: ShieldCheck, title: "Vault Integrity", text: "Subscription sharing has reduced your monthly overhead by 22%." },
    { icon: Sparkles, title: "Splits Ninja", text: "You've settled 90% of your shared bills within 24 hours. Stellar!" }
  ], []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % tips.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [tips.length]);

  useEffect(() => {
    if (expenses.length > 5 && !insights) {
      generateInsights();
    }
  }, [expenses.length]);

  const generateInsights = async () => {
    setIsGenerating(true);
    const text = await getFinancialInsights(
      expenses.slice(0, 10), 
      subscriptions,
      sharedExpenses.filter(s => s.status === 'pending')
    );
    setInsights(text || "");
    setIsGenerating(false);
  };

  const handleSettleAll = async () => {
    if (!user) return;
    const pending = sharedExpenses.filter(e => e.status === 'pending' && e.creatorId !== user.uid);
    
    if (pending.length === 0) {
        toast.info("No pending dues found.");
        return;
    }

    const total = pending.reduce((acc, exp) => {
        const myEmail = user.email || '';
        return acc + (exp.splits[myEmail.replace(/\./g, '_')] || 0);
    }, 0);

    setSettleModal({
      open: true,
      amount: total,
      recipient: pending[0].creatorEmail, // Using first creator as primary for batch
      reason: "Batch Settlement",
      items: pending
    });
  };

  const confirmSettleBatch = async (proofUrl?: string) => {
    if (!user) return;
    const { items } = settleModal;
    
    try {
        toast.promise(Promise.all(items.map(e => 
            completePayment(user.email!, e.creatorEmail, e.splits[user.email!.replace(/\./g, '_')], `All-settle: ${e.description}`, proofUrl)
        )), {
            loading: 'Processing settlements...',
            success: 'All dues settled and proofs attached!',
            error: 'Failed to settle some dues.'
        });
    } catch (error) {
        console.error(error);
    }
  };

  if (loading || !stats) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    let message = "Welcome back";
    if (hour < 12) message = "Good Morning";
    else if (hour < 17) message = "Good Afternoon";
    else message = "Good Evening";
    
    if (stats.netBalance > 50000) return `${message}, Wealth Architect`;
    if (stats.pendingPayments > 5000) return `${message}, careful with those splits`;
    return `${message}, ${profile?.displayName?.split(' ')[0] || 'Visionary'}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 lg:py-8 space-y-8 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-28 md:pb-12">
      
      {/* 1. Greeting + Summary */}
      <header className="space-y-2">
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
        >
            <div className="w-8 h-8 rounded-xl premium-gradient flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Treasury Overview</span>
        </motion.div>
        <div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {getGreeting()}
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium mt-1">
                Your financial ecosystem is {stats.healthScore > 70 ? 'thriving' : 'recovering'}. You have {smartReminders.length + (stats.pendingPayments > 0 ? 1 : 0)} items requiring attention.
            </p>
        </div>
      </header>

      {/* 2. Action Center (Feature 5 + Notifications) */}
      {(smartReminders.length > 0 || stats.upcomingRenewals.length > 0) && (
        <section className="space-y-6">
            <div className="flex items-center gap-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Action Center</h2>
                <div className="h-px grow bg-slate-100 dark:bg-white/5" />
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
                {smartReminders.map((rem, i) => (
                    <Card key={rem.id} className="inline-flex shrink-0 w-80 glass-card border-none p-6 items-center gap-4 border-l-4 border-l-brand-500 hover:scale-[1.02] transition-transform">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            rem.type === 'warning' ? "bg-amber-500 text-white" : "bg-indigo-500 text-white"
                        )}>
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="grow">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{rem.title}</h4>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">{rem.message}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                    </Card>
                ))}
                {stats.upcomingRenewals.map((sub, i) => (
                    <Card key={sub.id} className="inline-flex shrink-0 w-80 glass-card border-none p-6 items-center gap-4 hover:scale-[1.02] transition-transform">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center font-black text-brand-600">
                            {sub.name.charAt(0)}
                        </div>
                        <div className="grow">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize leading-tight">{sub.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Due {format(parseISO(sub.nextRenewal), 'MMM dd')}</p>
                        </div>
                        <Badge className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border-none font-black text-[8px] uppercase tracking-tighter">Renewing</Badge>
                    </Card>
                ))}
            </div>
        </section>
      )}

      {/* 3. Balance Card */}
      <section className="space-y-4">
        <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Consolidated Treasury</h2>
            <div className="h-px grow bg-slate-100 dark:bg-white/5" />
        </div>
        <Card className="glass-card border-none p-8 md:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <Wallet className="w-72 h-72 text-slate-900 dark:text-white" />
            </div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Asset Value</p>
                        <h2 className="text-6xl md:text-7xl font-display font-black text-slate-900 dark:text-white tracking-tighter">
                            <AnimatedNumber value={stats.netBalance} />
                        </h2>
                        <div className="flex items-center gap-3 pt-2">
                            <Badge className={cn(
                                "rounded-xl px-4 py-2 font-black border-none text-[9px] flex items-center gap-2 uppercase tracking-widest",
                                stats.netBalance >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                            )}>
                                {stats.netBalance >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {stats.netBalance >= 0 ? "Solvent" : "Deficit"}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-white/5">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Income</p>
                            <p className="text-xl font-display font-black text-emerald-600">{formatCurrency(stats.totalIncome)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expenses</p>
                            <p className="text-xl font-display font-black text-rose-600">{formatCurrency(stats.totalExpenses)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-end justify-center">
                    <div className="px-6 py-5 rounded-[2rem] bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 flex flex-col items-center gap-3 backdrop-blur-xl shadow-2xl">
                        <div className="relative w-20 h-20 shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-100 dark:text-white/5" />
                                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray={226} strokeDashoffset={226 - (226 * stats.healthScore) / 100} className="text-brand-500 transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-display font-black text-slate-900 dark:text-white">{stats.healthScore}</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Health Score</p>
                            <p className="text-[10px] font-bold text-slate-900 dark:text-white leading-tight max-w-[120px]">{stats.scoreMessage}</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
      </section>

      {/* 4. Quick Actions */}
      <section className="space-y-4">
        <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Quick Actions</h2>
            <div className="h-px grow bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button onClick={handleSettleAll} className="h-20 rounded-[1.5rem] glass-card border-none bg-brand-600 text-white hover:bg-brand-700 hover:scale-[1.03] transition-all flex flex-col items-center justify-center gap-1.5 group shadow-lg shadow-brand-600/20">
                <Zap className="w-5 h-5 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">Settle Dues</span>
            </Button>
            <Button onClick={() => setIsSplitModalOpen(true)} className="h-20 rounded-[1.5rem] glass-card border-none bg-white dark:bg-white/5 text-brand-500 hover:scale-[1.03] transition-all flex flex-col items-center justify-center gap-1.5 group hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] border border-transparent hover:border-brand-500/20">
                <Users className="w-5 h-5 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">New Split</span>
            </Button>
            <Button onClick={() => setIsExpenseModalOpen(true)} className="h-20 rounded-[1.5rem] glass-card border-none bg-white dark:bg-white/5 text-indigo-500 hover:scale-[1.03] transition-all flex flex-col items-center justify-center gap-1.5 group hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] border border-transparent hover:border-indigo-500/20">
                <CreditCard className="w-5 h-5 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Add Expense</span>
            </Button>
            <Button onClick={scrollToAudit} className="h-20 rounded-[1.5rem] glass-card border-none bg-white dark:bg-white/5 text-amber-500 hover:scale-[1.03] transition-all flex flex-col items-center justify-center gap-1.5 group hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] border border-transparent hover:border-amber-500/20">
                <Sparkles className="w-5 h-5 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">AI Audit</span>
            </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Insights */}
        <section className="space-y-4" ref={auditRef}>
            <div className="flex items-center gap-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Behavioral Audit</h2>
                <div className="h-px grow bg-slate-100 dark:bg-white/5" />
            </div>
            <Card className="glass-card border-none p-5 h-[200px] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                    <Sparkles className="w-20 h-20 text-brand-500" />
                </div>
                <div className="relative z-10 space-y-3 h-full flex flex-col">
                    <div className="flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-brand-500/10 flex items-center justify-center">
                                <Info className="w-3 h-3 text-brand-500" />
                            </div>
                            <h3 className="text-base font-display font-black text-slate-900 dark:text-white tracking-tight">Audit Summary</h3>
                        </div>
                        {isGenerating && (
                            <div className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-brand-500 animate-pulse" />
                                <span className="text-[7px] font-black text-brand-500 uppercase tracking-widest">Syncing</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="text-[12px] text-slate-600 dark:text-slate-400 font-medium leading-[1.5] overflow-y-auto pr-2 custom-scrollbar grow scroll-smooth audit-text">
                        {insights ? (
                            <div className="space-y-1.5 font-sans">
                                <Markdown>{insights}</Markdown>
                            </div>
                        ) : (
                            <div className="italic opacity-60 flex items-center justify-center h-full border-2 border-dashed border-slate-100 dark:border-white/5 rounded-xl text-center p-4">
                                Synthesizing narrative...
                            </div>
                        )}
                    </div>

                    {!insights && !isGenerating && (
                        <Button variant="outline" className="w-full rounded-lg border-dashed h-8 font-black uppercase text-[7px] tracking-widest shrink-0" onClick={() => generateInsights()}>
                            Initialize Deep Analysis
                        </Button>
                    )}
                </div>
            </Card>
        </section>

        {/* Social Balance & High Dues */}
        <section className="space-y-4">
            <div className="flex items-center gap-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Social Pulse</h2>
                <div className="h-px grow bg-slate-100 dark:bg-white/5" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* High Dues Card */}
                <Card className="glass-card border-none p-6 md:p-8 bg-slate-950 text-white relative overflow-hidden group shadow-2xl shadow-rose-900/20">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700">
                        <Users className="w-24 h-24 text-rose-500" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-2">High Dues Alert</p>
                            <h3 className="text-4xl font-display font-black tracking-tight">{formatCurrency(stats.socialSummary.owed)}</h3>
                            <p className="text-sm font-medium text-slate-400 mt-1">Multiple users owe you money. Time to collect?</p>
                        </div>
                        
                        <Button 
                            onClick={() => sendReminders()}
                            className="w-full h-14 rounded-2xl bg-white text-slate-950 font-black text-sm uppercase tracking-widest hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] border-none"
                        >
                            Send Reminders
                        </Button>
                    </div>
                </Card>

                {/* Settle Up Card */}
                <Card className="glass-card border-none p-6 md:p-8 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                        <Zap className="w-24 h-24 text-brand-500" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Pending Outbound</p>
                            <h3 className="text-4xl font-display font-black tracking-tight text-slate-900 dark:text-white">{formatCurrency(stats.socialSummary.owe)}</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">You have unsettled split bills waiting for payment.</p>
                        </div>
                        
                        <Button 
                            onClick={handleSettleAll}
                            className="w-full h-14 rounded-2xl premium-gradient text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-500/20 border-none"
                        >
                            Settle All Now
                        </Button>
                    </div>
                </Card>
            </div>
        </section>

        {/* 6. Subscriptions Preview */}
        <section className="space-y-4">
            <div className="flex items-center gap-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Intelligence Deck</h2>
                <div className="h-px grow bg-slate-100 dark:bg-white/5" />
            </div>
            <div className="flex flex-col h-[200px]">
                <Card className="glass-card border-none p-5 grow bg-slate-900 text-white relative overflow-hidden group">
                    <div className="absolute inset-0 bg-brand-600/10 group-hover:bg-brand-600/20 transition-colors" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="space-y-0.5">
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-400">Advice • {activeTipIndex + 1}/{tips.length}</p>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTipIndex}
                                    initial={{ opacity: 0, y: 3 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -3 }}
                                    className="pt-1.5 space-y-2"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                        {React.createElement(tips[activeTipIndex].icon, { className: "w-4 h-4 text-brand-400" })}
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="text-lg font-display font-black leading-tight tracking-tight">{tips[activeTipIndex].title}</h4>
                                        <p className="text-[12px] font-medium opacity-70 leading-snug max-w-sm line-clamp-3">{tips[activeTipIndex].text}</p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <Button variant="ghost" className="w-fit text-[8px] font-black uppercase tracking-widest hover:bg-white/10 p-0 h-auto self-end mt-1">Next Insight <ArrowRight className="w-2.5 h-2.5 ml-1" /></Button>
                    </div>
                </Card>
            </div>
        </section>
      </div>

      {/* 7. Shared Summary (Social Intelligence) */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 grow">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Social Intelligence</h2>
                <div className="h-px grow bg-slate-100 dark:bg-white/5" />
            </div>
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-brand-600">Circle Analytics <ArrowRight className="w-3 h-3 ml-2" /></Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="glass-card border-none p-8 flex flex-col justify-between h-56 bg-brand-500/[0.03]">
                <div className="flex justify-between items-start">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Social Flow</p>
                    <Users className="w-5 h-5 text-brand-500/30" />
                </div>
                <h3 className={cn(
                    "text-5xl font-display font-black",
                    stats.owedToMe - stats.pendingPayments >= 0 ? "text-emerald-500" : "text-rose-600"
                )}>
                    {formatCurrency(stats.owedToMe - stats.pendingPayments)}
                </h3>
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Relative Liquidity</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-black">Stable</Badge>
                </div>
            </Card>

            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="glass-card border-none p-6 flex flex-col gap-4 bg-emerald-500/[0.02] group transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.05)] border border-transparent hover:border-emerald-500/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-sm">
                                <TrendingUp className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div className="grow">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Owed to you</p>
                                <p className="text-2xl font-display font-black text-emerald-600">{formatCurrency(stats.owedToMe)}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                {stats.usersWhoOweMeCount > 0 
                                  ? `${stats.usersWhoOweMeCount} user${stats.usersWhoOweMeCount > 1 ? 's' : ''} owe you money across your shared expenses.` 
                                  : "No pending incoming payments detected."}
                            </p>
                            <Button 
                                onClick={() => sendReminders()}
                                disabled={stats.owedToMe <= 0}
                                className="w-full h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.03] transition-all font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-emerald-500/10 disabled:opacity-50 disabled:hover:scale-100 border-none"
                            >
                                <Zap className="w-3 h-3 mr-2" />
                                Send Reminders
                            </Button>
                        </div>
                    </Card>
                    <Card className="glass-card border-none p-6 flex items-center gap-4 bg-rose-500/[0.02]">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shadow-sm">
                            <TrendingDown className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">You owe others</p>
                            <p className="text-2xl font-display font-black text-rose-600">{formatCurrency(stats.pendingPayments)}</p>
                        </div>
                    </Card>
                </div>
                
                {/* Optimized Transactions (Mini) */}
                <div className="pt-4">
                    <SettlementOptimizer transactions={stats.optimizedPayments} currentUserEmail={user.email || ''} />
                </div>
            </div>
        </div>
      </section>

      {/* What If Simulator - Placed between Shared and Timeline for flow */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Optimization Engine</h2>
            <div className="h-px grow bg-slate-100 dark:bg-white/5" />
        </div>
        <WhatIfSimulator subscriptions={subscriptions} />
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .audit-text strong, .audit-text b {
            color: #0ea5e9;
            font-weight: 800;
        }
        .audit-text p:contains("₹") {
            background: rgba(14, 165, 233, 0.05);
            padding: 4px 8px;
            border-radius: 6px;
        }
      `}} />

      {/* 8. Activity Timeline */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 grow">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Financial Timeline</h2>
                <div className="h-px grow bg-slate-100 dark:bg-white/5" />
            </div>
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-500">View Full History <ArrowRight className="w-3 h-3 ml-2" /></Button>
        </div>
        
        <Card className="glass-card border-none p-0 overflow-hidden rounded-[2.5rem]">
            <div className="divide-y divide-slate-100 dark:divide-white/5">
                {expenses.length > 0 ? (
                    [...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((expense, i) => {
                        const date = new Date(expense.date);
                        let timeframe = format(date, 'MMM dd');
                        let isNewDay = i === 0 || format(new Date(expenses[i-1].date), 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd');
                        
                        if (isToday(date)) timeframe = 'Today';
                        else if (isYesterday(date)) timeframe = 'Yesterday';

                        return (
                            <React.Fragment key={expense.id}>
                                {isNewDay && (
                                    <div className="px-10 py-4 bg-slate-50/50 dark:bg-white/[0.02] border-y border-slate-100 dark:border-white/5">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{timeframe}</p>
                                    </div>
                                )}
                                <motion.div 
                                    whileHover={{ x: 5, backgroundColor: 'rgba(0,0,0,0.01)' }}
                                    className="px-10 py-8 flex items-center gap-8 group cursor-pointer"
                                >
                                    <div className="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                                        <div className={cn(
                                            "w-7 h-7 rounded-xl flex items-center justify-center",
                                            expense.type === 'income' ? "bg-emerald-500 text-white" : "bg-brand-500 text-white"
                                        )}>
                                            {expense.type === 'income' ? <DollarSign className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
                                        </div>
                                    </div>
                                    <div className="grow space-y-1">
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white capitalize">{expense.description}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{expense.category}</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10" />
                                            <span className="text-[10px] font-bold text-slate-400 opacity-60 uppercase">{format(date, 'HH:mm')}</span>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className={cn(
                                            "text-2xl font-display font-black tracking-tight",
                                            expense.type === 'income' ? "text-emerald-500" : "text-slate-900 dark:text-white"
                                        )}>
                                            {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                                        </p>
                                        <Badge variant="ghost" className="text-[8px] font-black uppercase tracking-widest opacity-40 p-0 h-auto">Verified</Badge>
                                    </div>
                                </motion.div>
                            </React.Fragment>
                        );
                    })
                ) : (
                    <div className="p-32 text-center space-y-6">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <History className="w-10 h-10 text-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-display font-black dark:text-white tracking-tight">Empty Record</h3>
                            <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto">Your financial journey is just beginning. Start by adding your first transaction.</p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
      </section>

      <SettlePaymentDialog 
        open={settleModal.open}
        onOpenChange={(open) => setSettleModal(prev => ({ ...prev, open }))}
        amount={settleModal.amount}
        recipient={settleModal.recipient}
        reason={settleModal.reason}
        onConfirm={confirmSettleBatch}
      />

      {/* Add Expense Modal */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] glass-card border-white/20 dark:border-white/10 p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-display font-black dark:text-white leading-tight">Add New Transaction</DialogTitle>
            <p className="text-xs text-slate-500 font-medium tracking-tight">Record personal inflow or outflow.</p>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-5">
            <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => setNewExpense({ ...newExpense, transactionType: 'expense' })}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-xl transition-all duration-300 uppercase tracking-widest",
                  newExpense.transactionType === 'expense' 
                    ? "bg-white dark:bg-white/10 text-red-600 dark:text-red-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white"
                )}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setNewExpense({ ...newExpense, transactionType: 'income' })}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-xl transition-all duration-300 uppercase tracking-widest",
                  newExpense.transactionType === 'income' 
                    ? "bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white"
                )}
              >
                Income
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount (₹)</Label>
              <Input 
                id="amount" 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                required 
                value={newExpense.amount}
                onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                className="rounded-xl ios-input dark:text-white h-12 text-lg font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Context</Label>
              <Input 
                id="desc" 
                placeholder="e.g. Starbucks Morning" 
                required 
                value={newExpense.description}
                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                className="rounded-xl ios-input dark:text-white h-12 font-semibold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</Label>
                <select 
                  id="category"
                  className="w-full h-12 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111111] text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-white font-bold"
                  value={newExpense.category}
                  onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                >
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Shopping</option>
                  <option>Bills</option>
                  <option>Entertainment</option>
                  <option>Health</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  required 
                  value={newExpense.date}
                  onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                  className="rounded-xl ios-input dark:text-white h-12 font-bold"
                />
              </div>
            </div>
            <Button type="submit" className="w-full rounded-2xl bg-brand-600 h-14 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-500/20 active:scale-95 transition-all">Record Entry</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Split Modal */}
      <Dialog open={isSplitModalOpen} onOpenChange={setIsSplitModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[3rem] glass-card border-none p-10 shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-display font-black dark:text-white tracking-tight leading-tight uppercase">Scale Up Split</DialogTitle>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest">Equal distribution architecture.</p>
          </DialogHeader>
          <form onSubmit={handleAddShared} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="split-amount" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Capital Total (₹)</Label>
              <Input 
                id="split-amount" 
                type="number" 
                placeholder="0.00" 
                required 
                value={newShared.amount}
                onChange={e => setNewShared({...newShared, amount: e.target.value})}
                className="rounded-2xl ios-input h-14 text-xl font-black dark:text-white px-6 focus:ring-4 focus:ring-brand-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="split-desc" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Event Narrative</Label>
              <Input 
                id="split-desc" 
                placeholder="e.g. Cyberpunk Night Out" 
                required 
                value={newShared.description}
                onChange={e => setNewShared({...newShared, description: e.target.value})}
                className="rounded-2xl ios-input h-14 font-black dark:text-white px-6 focus:ring-4 focus:ring-brand-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="split-participants" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Collaborators (CSV)</Label>
              <Input 
                id="split-participants" 
                placeholder="Email addresses..." 
                required 
                value={newShared.participants}
                onChange={e => setNewShared({...newShared, participants: e.target.value})}
                className="rounded-2xl ios-input h-14 font-bold dark:text-white px-6 focus:ring-4 focus:ring-brand-500/20"
              />
            </div>
            <Button type="submit" className="w-full rounded-2xl premium-gradient h-14 text-base font-black uppercase tracking-widest shadow-2xl shadow-brand-500/30 active:scale-95 transition-all">Initiate Split</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
