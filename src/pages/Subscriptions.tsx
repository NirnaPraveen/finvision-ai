import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  CreditCard, 
  Sparkles, 
  ArrowRight, 
  AlertTriangle,
  Filter,
  Search,
  CheckCircle,
  LayoutGrid,
  List,
  History,
  TrendingDown,
  TrendingUp,
  Zap,
  Calendar,
  Users
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addDays, isBefore, differenceInDays } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { SubscriptionCard } from '@/components/finance/SubscriptionCard';
import { AddSubscriptionModal } from '@/components/finance/AddSubscriptionModal';

export const SubscriptionsPage: React.FC = () => {
  const { subscriptions, loading } = useFinance();
  const { user } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');

  const summary = useMemo(() => {
    const active = subscriptions.filter(s => s.status !== 'expired');
    const monthlyTotal = active.reduce((acc, s) => {
      const amount = s.billingCycle === 'monthly' ? s.amount : s.amount / 12;
      return acc + amount;
    }, 0);
    const yearlyTotal = monthlyTotal * 12;
    const upcomingRenewals = active.filter(s => {
      const days = differenceInDays(new Date(s.nextRenewal), new Date());
      return days >= 0 && days <= 5;
    }).length;

    return { monthlyTotal, yearlyTotal, activeCount: active.length, upcomingRenewals };
  }, [subscriptions]);

  const upcomingAlerts = useMemo(() => {
    return subscriptions
      .filter(s => {
        const days = differenceInDays(new Date(s.nextRenewal), new Date());
        return days >= 0 && days <= 5;
      })
      .sort((a, b) => new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime());
  }, [subscriptions]);

  const aiInsights = useMemo(() => {
    const insights = [];
    if (summary.monthlyTotal > 5000) {
      insights.push({
        title: "Optimization opportunity",
        message: `You spend ${formatCurrency(summary.monthlyTotal)}/month on subscriptions. Consider auditing unused services to save.`,
        icon: TrendingDown,
        color: "rose"
      });
    }
    
    const sharedCount = subscriptions.filter(s => s.isShared).length;
    if (sharedCount < 2) {
      insights.push({
        title: "Sharing Power",
        message: "You save on 1 subscription by sharing. Consider sharing Netflix or Disney+ to reduce costs by 50%.",
        icon: Users,
        color: "indigo"
      });
    }

    insights.push({
      title: "Annual impact",
      message: `Your long-term commitment is ${formatCurrency(summary.yearlyTotal)}/year. Is the value worth the cost?`,
      icon: Zap,
      color: "brand"
    });

    return insights;
  }, [summary, subscriptions]);

  const handleAddSubscription = async (data: any) => {
    if (!user) return;
    try {
      // 1. Create the main subscription record
      const participantStatuses: Record<string, string> = {
        [user.email?.replace(/\./g, '_') || 'owner']: 'accepted'
      };
      
      if (data.isShared && data.participants) {
        data.participants.forEach((email: string) => {
          participantStatuses[email.replace(/\./g, '_')] = 'pending';
        });
      }

      const subRef = await addDoc(collection(db, 'subscriptions'), {
        ...data,
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date().toISOString(),
        participantStatuses
      });

      // 2. If shared, send notifications to participants
      if (data.isShared && (data.participants?.length || 0) > 0) {
        for (const participantEmail of data.participants) {
          await addDoc(collection(db, 'notifications'), {
            userEmail: participantEmail,
            title: 'Action Required: Subscription Join Request',
            message: `${user.displayName || user.email} invited you to join a shared ${data.name} subscription.`,
            type: 'subscription_request',
            status: 'pending',
            payload: {
              subscriptionId: subRef.id,
              name: data.name,
              amount: data.splitAmount,
              totalAmount: data.amount,
              billingCycle: data.billingCycle,
              nextRenewal: data.nextRenewal,
              category: data.category,
              creatorEmail: user.email
            },
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      }

      setIsAddOpen(false);
      toast.success("Subscription activated and invites sent!");
    } catch (error) {
      toast.error("Failed to add subscription.");
      console.error(error);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'subscriptions', id), { status: newStatus });
      toast.success(`Subscription marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status.");
    }
  };

  const handleDeleteSub = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'subscriptions', id));
      toast.success("Subscription cancelled and removed.");
    } catch (error) {
      toast.error("Failed to remove subscription.");
    }
  };

  const filteredSubs = subscriptions.filter(s => {
    const matchesTab = activeTab === 'all' ? true : s.status === activeTab;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8 lg:space-y-12 pb-32 md:pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Vault Manager</span>
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 dark:text-white tracking-tight leading-tight">Subscriptions</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 mt-2 font-medium max-w-lg">
            Intelligent tracking for recurring expenses and shared platform costs.
          </p>
        </div>

        <Button 
          onClick={() => setIsAddOpen(true)}
          className="ios-btn premium-gradient px-8 py-7 rounded-[1.5rem] font-black shadow-2xl shadow-brand-500/40 text-base hidden md:flex"
        >
          <Plus className="w-5 h-5 mr-3" />
          Add Platform
        </Button>
      </div>

      {/* Summary Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        <Card className="glass-card rounded-[2rem] border-none p-6 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
            <Zap className="w-12 h-12 text-brand-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Monthly Burn</p>
          <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white">{formatCurrency(summary.monthlyTotal)}</h3>
          <p className="text-[10px] text-brand-600 font-bold mt-2 uppercase">Across {summary.activeCount} services</p>
        </Card>
        
        <Card className="glass-card rounded-[2rem] border-none p-6 flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform text-indigo-600">
            <Calendar className="w-12 h-12" />
          </div>
          <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Yearly Outlook</p>
          <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white">{formatCurrency(summary.yearlyTotal)}</h3>
          <p className="text-[10px] text-indigo-600 font-bold mt-2 uppercase">Scheduled Forecast</p>
        </Card>

        <Card className="glass-card rounded-[2rem] border-none p-6 flex flex-col justify-between group overflow-hidden relative bg-brand-600 text-white shadow-2xl shadow-brand-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform">
            <CheckCircle className="w-12 h-12" />
          </div>
          <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Active Now</p>
          <h3 className="text-3xl font-display font-black text-white">{summary.activeCount} Services</h3>
          <p className="text-[10px] text-white/50 font-bold mt-2 uppercase tracking-widest">Running smoothly</p>
        </Card>

        <Card className={cn(
          "glass-card rounded-[2rem] border-none p-6 flex flex-col justify-between group overflow-hidden relative text-white shadow-2xl transition-all duration-500",
          summary.upcomingRenewals > 0 ? "bg-rose-600 shadow-rose-500/30" : "bg-emerald-600 shadow-emerald-500/30"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Upcoming</p>
          <h3 className="text-3xl font-display font-black text-white">{summary.upcomingRenewals} Renewals</h3>
          <p className="text-[10px] text-white/50 font-bold mt-2 uppercase tracking-widest">
            Next 5 Days
          </p>
        </Card>
      </motion.div>

      {/* Renewal Alerts */}
      {upcomingAlerts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          {upcomingAlerts.map((sub, i) => (
            <div key={i} className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 bg-amber-500 rounded-[2.5rem] border-none relative overflow-hidden group shadow-2xl shadow-amber-500/20">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
               <div className="flex items-center gap-6 relative z-10">
                 <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                    <AlertTriangle className="w-8 h-8 text-white" />
                 </div>
                 <div className="text-white">
                    <h4 className="text-2xl font-display font-black leading-none">{sub.name} renews soon</h4>
                    <p className="mt-1 font-bold text-white/80">Scheduled for {format(new Date(sub.nextRenewal), 'MMMM dd')} • <span className="text-white">{formatCurrency(sub.amount)}</span></p>
                 </div>
               </div>
               <Button className="ios-btn bg-white text-amber-600 hover:bg-amber-50 px-10 py-7 rounded-2xl font-black text-base shadow-2xl shadow-black/10 shrink-0 relative z-10 transition-all active:scale-95 leading-none">
                  Check Balance
               </Button>
            </div>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-8">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1.5 rounded-[1.5rem]">
              {['all', 'active', 'expired'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-500",
                    activeTab === tab 
                      ? "bg-white dark:bg-white/10 text-brand-600 dark:text-white shadow-lg shadow-black/5" 
                      : "text-slate-500 dark:text-gray-500 hover:text-slate-800 dark:hover:text-gray-300"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search platforms..." 
                className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 text-sm font-bold placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-brand-500/10 dark:focus:ring-brand-500/20 transition-all font-display"
              />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredSubs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full py-32 flex flex-col items-center justify-center text-center glass-card border-none rounded-[3rem]"
                >
                  <div className="w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-10 shadow-inner">
                    <History className="w-16 h-16 text-slate-200 dark:text-gray-800" />
                  </div>
                  <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white mb-3 tracking-tight">No subscriptions found</h3>
                  <p className="text-slate-500 dark:text-gray-400 font-medium max-w-xs mx-auto text-lg leading-relaxed">
                    Start tracking your recurring expenses to gain financial clarity.
                  </p>
                  <Button 
                    onClick={() => setIsAddOpen(true)}
                    className="mt-10 ios-btn premium-gradient px-12 py-7 rounded-2xl font-black text-lg shadow-2xl shadow-brand-500/30"
                  >
                    Add First Platform
                  </Button>
                </motion.div>
              ) : (
                filteredSubs.map((sub) => (
                  <SubscriptionCard 
                    key={sub.id} 
                    subscription={sub} 
                    onEdit={(s) => {
                      toast.info("Edit functionality coming in next build");
                    }}
                    onDelete={handleDeleteSub}
                    onMarkPaid={(id) => handleUpdateStatus(id, 'active')}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-10">
          <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden">
             <div className="p-8 pb-4">
                <h3 className="text-xl font-display font-black flex items-center gap-3 text-slate-900 dark:text-white leading-none">
                  <Sparkles className="w-5 h-5 text-brand-600" />
                  AI Insights
                </h3>
             </div>
             <CardContent className="p-8 pt-6 space-y-8">
                {aiInsights.map((insight, idx) => {
                  const Icon = insight.icon;
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group"
                    >
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                          insight.color === 'rose' ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600" :
                          insight.color === 'indigo' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" :
                          "bg-brand-50 dark:bg-brand-900/20 text-brand-600"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1">{insight.title}</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-gray-400 leading-relaxed group-hover:text-slate-900 dark:group-hover:text-gray-200 transition-colors">
                            {insight.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-widest text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 py-6 rounded-xl border border-dashed border-brand-200 dark:border-brand-900/50">
                  Generate More
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Button>
             </CardContent>
          </Card>

          <Card className="glass-card border-none rounded-[2.5rem] bg-indigo-600 p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-500/30">
             <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
             <div className="relative z-10 space-y-4">
                <Users className="w-8 h-8 text-white/50" />
                <h4 className="text-2xl font-display font-black leading-tight">Saving Circle</h4>
                <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                  Join a shared circle for Netflix, HBO, or YouTube Premium to split costs automatically.
                </p>
                <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-black text-xs uppercase tracking-widest py-3 h-auto">
                   Explore Communities
                </Button>
             </div>
          </Card>
        </div>
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAddOpen(true)}
        className="md:hidden fixed bottom-24 right-6 w-16 h-16 rounded-full premium-gradient shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex items-center justify-center text-white z-50 group active:shadow-inner transition-all duration-500"
      >
        <Plus className="w-8 h-8 group-active:scale-95 transition-transform" />
      </motion.button>

      <AddSubscriptionModal 
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAddSubscription}
      />
    </div>
  );
};
