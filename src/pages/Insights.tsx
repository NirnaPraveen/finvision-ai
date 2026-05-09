import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Zap, 
  PieChart as PieIcon, 
  BarChart as BarIcon, 
  AlertCircle, 
  ArrowRight,
  Target,
  Users,
  Wallet,
  Calendar,
  CreditCard,
  ChefHat,
  ShoppingBag,
  Bus,
  Tv,
  Info
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import { format, subMonths, startOfMonth, endOfMonth, isAfter, isBefore, parseISO } from 'date-fns';

const COLORS = ['#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

export const InsightsPage: React.FC = () => {
  const { expenses, sharedExpenses, subscriptions, settlements, sendReminders } = useFinance();
  const { user } = useAuth();

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // 1. Data Processing
  const stats = useMemo(() => {
    if (!user) return null;

    const thisMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= monthStart && d <= monthEnd && e.type !== 'income';
    });

    const totalSpent = thisMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Category Breakdown
    const categories: Record<string, number> = {};
    thisMonthExpenses.forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + e.amount;
    });

    const pieData = Object.entries(categories).map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const topCategory = pieData[0] || { name: 'None', value: 0 };
    const topCategoryPercent = totalSpent > 0 ? Math.round((topCategory.value / totalSpent) * 100) : 0;

    // Subscription Savings (Assuming user splits subs they own)
    const subSavings = subscriptions.reduce((acc, sub) => {
        if (!sub.masterSubscriptionId && sub.isShared) {
            return acc + (sub.amount - sub.splitAmount);
        }
        return acc;
    }, 0);

    const subTotal = subscriptions.reduce((acc, sub) => acc + (sub.splitAmount || sub.amount), 0);

    // Pending Payments (Social Finance)
    const socialSummary = sharedExpenses
      .filter(e => e.status === 'pending')
      .reduce((acc, exp) => {
        const isCreator = exp.creatorId === user.uid;
        const myEmail = user.email || '';
        const myShare = exp.splits[myEmail.replace(/\./g, '_')] || 0;
        
        if (isCreator) {
          acc.owed += (exp.amount - myShare);
        } else {
          acc.owe += myShare;
        }
        return acc;
      }, { owed: 0, owe: 0 });

    // Person-wise Balances
    const balances: Record<string, number> = {};
    sharedExpenses
      .filter(e => e.status === 'pending')
      .forEach(exp => {
        const isCreator = exp.creatorId === user.uid;
        const myEmail = user.email || '';
        
        if (isCreator) {
          exp.participants?.forEach((email: string) => {
            if (email !== myEmail) {
              const share = exp.splits[email.replace(/\./g, '_')] || 0;
              balances[email] = (balances[email] || 0) + share;
            }
          });
        } else {
          const share = exp.splits[myEmail.replace(/\./g, '_')] || 0;
          const creatorEmail = exp.creatorEmail || 'Admin';
          balances[creatorEmail] = (balances[creatorEmail] || 0) - share;
        }
      });

    const personWiseBalances = Object.entries(balances)
      .filter(([_, balance]) => Math.abs(balance) > 0)
      .map(([email, balance]) => ({
        email,
        name: email.split('@')[0],
        balance
      }));

    // Monthly Trend (6 months)
    const trendData = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(new Date(), i);
        const ms = startOfMonth(date);
        const me = endOfMonth(date);
        
        const amount = expenses
          .filter(e => {
            const d = new Date(e.date);
            return d >= ms && d <= me && e.type !== 'income';
          })
          .reduce((acc, curr) => acc + curr.amount, 0);

        return {
          name: format(date, 'MMM'),
          amount
        };
    }).reverse();

    // Prediction
    const last3Months = trendData.slice(-3);
    const avgSpend = last3Months.reduce((acc, curr) => acc + curr.amount, 0) / 3;
    const projectedNextMonth = avgSpend * 1.05; // 5% buffer

    // Personality
    let personality = "Conservative Spender";
    let personalityDesc = "Your spending is well-controlled and within limits.";
    if (totalSpent > 10000) {
        personality = "Luxe Life Enthusiast";
        personalityDesc = "You enjoy high-quality experiences. Consider optimizing luxury subscriptions.";
    } else if (subSavings > 500) {
        personality = "Social Finance Ninja";
        personalityDesc = "Exemplary use of group sharing to minimize costs!";
    } else if (socialSummary.owe > 2000) {
        personality = "Generous Borrower";
        personalityDesc = "Your social dues are high. Time to settle up!";
    }

    return {
        totalSpent,
        pieData,
        topCategory,
        topCategoryPercent,
        subSavings,
        subTotal,
        socialSummary,
        trendData,
        projectedNextMonth,
        personality,
        personalityDesc,
        personWiseBalances
    };
  }, [expenses, sharedExpenses, subscriptions, user]);

  if (!stats) return null;

  const suggestions = [
    { 
        title: `Reduce ${stats.topCategory.name} Spending`, 
        desc: `It accounts for ${stats.topCategoryPercent}% of your budget. Small cuts here will save ${formatCurrency(stats.topCategory.value * 0.1)}/mo.`,
        icon: stats.topCategory.name === 'Food' ? ChefHat : ShoppingBag
    },
    { 
        title: "Link More Subscriptions", 
        desc: "You can save up to ₹400/month by sharing your standard Netflix or Spotify accounts.",
        icon: Sparkles
    },
    { 
        title: "Settle Overdue Bills", 
        desc: `You currently owe ${formatCurrency(stats.socialSummary.owe)}. Clear this to keep your social credit high.`,
        icon: AlertCircle
    }
  ];

  const alerts = [
    { type: 'warning', title: 'Spending Peak', message: 'You spent 15% more than last week in the Food & Dining category.' },
    { type: 'info', title: 'Subscription Update', message: 'Hulu subscription price increases from next month. Consider splitting.' },
    { type: 'danger', title: 'High Dues', message: `Multiple participants owe you ${formatCurrency(stats.socialSummary.owed)}. Send reminders?` }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 lg:py-12 space-y-10 lg:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-28 md:pb-12">
      {/* Header & Storytelling */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl premium-gradient flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Intelligence Core</span>
        </div>
        
        <div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-6 md:mb-8 text-center md:text-left">Financial Insights</h1>
            <Card className="glass-card border-none p-6 md:p-10 lg:p-14 relative overflow-hidden group bg-slate-900 text-white">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Zap className="w-96 h-96 text-white" />
                </div>
                <div className="relative z-10 max-w-3xl space-y-6 md:space-y-8">
                    <p className="text-xl md:text-3xl lg:text-4xl font-display font-medium leading-[1.4] opacity-90">
                        This month your volume reached <span className="font-black text-white underline decoration-brand-500/50 decoration-4 underline-offset-8">{formatCurrency(stats.totalSpent)}</span>. 
                        Primary exposure is in <span className="font-black text-brand-400">{stats.topCategory.name} ({stats.topCategoryPercent}%)</span>. 
                        Social sharing mitigated <span className="font-black text-emerald-400">{formatCurrency(stats.subSavings)}</span> from your base costs.
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pt-2">
                        <Badge className="bg-brand-500 text-white border-none px-4 py-2 font-black rounded-xl uppercase tracking-widest text-[10px]">Neural Analysis Live</Badge>
                        <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Real-time Sync Active</span>
                    </div>
                </div>
            </Card>
        </div>
      </motion.div>

      {/* Insight Cards (Scrollable) */}
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto no-scrollbar px-1 py-4 -my-4 snap-x">
            {[
                { label: 'Total Spending', value: formatCurrency(stats.totalSpent), icon: Wallet, color: 'brand' },
                { label: 'Top Category', value: stats.topCategory.name, icon: PieIcon, color: 'brand' },
                { label: 'Subscription Cost', value: formatCurrency(stats.subTotal), icon: Calendar, color: 'indigo' },
                { label: 'Pending Payments', value: formatCurrency(stats.socialSummary.owe), icon: CreditCard, color: 'rose' },
                { label: 'Shared Balance', value: formatCurrency(stats.socialSummary.owed - stats.socialSummary.owe), icon: Users, color: 'emerald' },
            ].map((card, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex-shrink-0 w-[240px] snap-start"
                >
                    <Card className="glass-card border-none p-6 group hover:scale-105 transition-all duration-500 cursor-default">
                        <div className={`w-12 h-12 bg-${card.color}-500/10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-12`}>
                            <card.icon className={`w-6 h-6 text-${card.color}-500`} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{card.label}</p>
                        <p className="text-2xl font-display font-black text-slate-900 dark:text-white">{card.value}</p>
                    </Card>
                </motion.div>
            ))}
        </div>
      </div>

      {/* Visual Analytics */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Distribution Analysis</h2>
            <div className="h-px grow bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Spending Personality Profile */}
            <Card className="glass-card border-none lg:col-span-1 p-10 flex flex-col justify-between items-center text-center space-y-8">
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Persona Profile</h2>
                    <div className="w-32 h-32 mx-auto premium-gradient rounded-full flex items-center justify-center shadow-3xl shadow-brand-500/30 group cursor-pointer hover:rotate-12 transition-transform duration-500">
                        <Target className="w-16 h-16 text-white" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white leading-tight">{stats.personality}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-gray-400 px-4 leading-relaxed">{stats.personalityDesc}</p>
                </div>
                <Button className="w-full ios-btn premium-gradient h-14 rounded-2xl font-black text-xs uppercase tracking-widest">
                    Optimization Benchmarks
                </Button>
            </Card>

            {/* Visual Analytics Distribution */}
            <Card className="glass-card border-none lg:col-span-2 overflow-hidden flex flex-col">
                <div className="p-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Spending Distribution</h2>
                    <div className="flex gap-2">
                        <Badge className="rounded-xl font-black border-none bg-brand-500/10 text-brand-600 text-[8px] uppercase tracking-widest px-3">Category View</Badge>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 p-10 gap-12 items-center grow">
                    <div className="h-[280px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '20px', color: '#fff', padding: '12px 16px' }}
                                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                                    formatter={(value: number) => [formatCurrency(value)]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact</span>
                            <span className="text-3xl font-display font-black text-slate-900 dark:text-white px-4 text-center leading-tight">{stats.topCategory.name}</span>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center gap-6">
                        {stats.pieData.slice(0, 5).map((entry, i) => (
                            <div key={i} className="flex items-center justify-between group cursor-default">
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors capitalize">{entry.name}</p>
                                        <div className="w-full bg-slate-100 dark:bg-white/5 h-1 rounded-full mt-1 overflow-hidden">
                                            <div 
                                                className="h-full bg-brand-500 transition-all duration-1000" 
                                                style={{ width: `${(entry.value / stats.totalSpent) * 100}%` }} 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-white/60">{formatCurrency(entry.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
      </section>


      {/* Monthly Trend & Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="glass-card border-none lg:col-span-2 p-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Monthly Spending Trend</h2>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#64748b'}} />
                        <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.03)'}}
                            contentStyle={{ backgroundColor: '#0a0a0a', border: 'none', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value: number) => [formatCurrency(value)]}
                        />
                        <Bar 
                            dataKey="amount" 
                            fill="url(#colorGradient)" 
                            radius={[8, 8, 0, 0]} 
                            barSize={32} 
                        />
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.4}/>
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>

        {/* Future Prediction */}
        <Card className="glass-card border-none lg:col-span-1 p-8 bg-brand-600 text-white relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <TrendingUp className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-8">
                <div className="space-y-2">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Future Projection</h2>
                    <h3 className="text-3xl font-display font-black leading-tight">Spending Forecast</h3>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Next Month Est.</p>
                        <p className="text-4xl font-display font-black">{formatCurrency(stats.projectedNextMonth)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                        <TrendingUp className="w-4 h-4" />
                        <span>Based on 3-month growth trend</span>
                    </div>
                    <p className="text-sm opacity-80 leading-relaxed">
                        If you continue your current spending habits, you'll likely peak in <span className="font-black underline italic">{format(subMonths(new Date(), -1), 'MMMM')}</span>.
                    </p>
                </div>

                <Button className="w-full bg-white text-brand-600 hover:bg-white/90 h-14 rounded-2xl font-black text-lg transition-transform active:scale-95 shadow-xl shadow-black/20">
                    Plan Budget
                </Button>
            </div>
        </Card>
      </div>

      {/* Smart Suggestions & Social Finance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Smart Suggestions */}
        <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">AI Recommendations</h2>
            <div className="space-y-4">
                {suggestions.map((s, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ x: 10 }}
                        className="glass-card border-none p-6 flex items-start gap-6 group cursor-pointer"
                    >
                        <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-all duration-500">
                            <s.icon className="w-6 h-6 text-brand-500 group-hover:text-white transition-colors" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 dark:text-white">{s.title}</h4>
                            <p className="text-sm text-slate-500 dark:text-gray-400 font-medium leading-relaxed">{s.desc}</p>
                        </div>
                        <div className="ml-auto flex items-center h-14">
                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Social Finance (Balances) */}
        <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Social Finance</h2>
            <Card className="glass-card border-none overflow-hidden h-full">
                <div className="p-8 bg-slate-50 dark:bg-white/5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Credit</p>
                        <p className={cn(
                            "text-2xl font-display font-black",
                            stats.socialSummary.owed - stats.socialSummary.owe >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                            {formatCurrency(stats.socialSummary.owed - stats.socialSummary.owe)}
                        </p>
                    </div>
                    <Users className="w-10 h-10 text-brand-500 opacity-20" />
                </div>
                <CardContent className="p-8 space-y-6">
                    {stats.personWiseBalances.length > 0 ? (
                        <div className="space-y-4">
                            {stats.personWiseBalances.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 group">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs",
                                            item.balance > 0 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-rose-100 dark:bg-rose-900/30 text-rose-600"
                                        )}>
                                            {item.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{item.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{item.balance > 0 ? 'owes you' : 'you owe'}</p>
                                        </div>
                                    </div>
                                    <p className={cn(
                                        "text-sm font-black",
                                        item.balance > 0 ? "text-emerald-600" : "text-rose-600"
                                    )}>
                                        {formatCurrency(Math.abs(item.balance))}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                            <Users className="w-12 h-12 text-slate-200 dark:text-gray-800" />
                            <p className="text-sm font-medium text-slate-400">No active shared balances</p>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 dark:border-white/10 space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                            <div className="flex items-center gap-4">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Owed to you</p>
                                    <p className="text-lg font-display font-black text-slate-900 dark:text-white">{formatCurrency(stats.socialSummary.owed)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                            <div className="flex items-center gap-4">
                                <TrendingDown className="w-4 h-4 text-rose-500" />
                                <div>
                                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">You owe others</p>
                                    <p className="text-lg font-display font-black text-slate-900 dark:text-white">{formatCurrency(stats.socialSummary.owe)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full h-14 rounded-2xl border-white/20 dark:border-white/10 font-bold hover:bg-slate-50 dark:hover:bg-white/5">
                        Manage Settlements
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Critical Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {alerts.map((alert, i) => (
                <Card key={i} className={cn(
                    "border-none p-6 rounded-3xl flex gap-4 transition-all hover:scale-105 duration-500 bg-opacity-10",
                    alert.type === 'warning' ? "bg-amber-500/10" :
                    alert.type === 'danger' ? "bg-rose-500/10" :
                    "bg-blue-500/10"
                )}>
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        alert.type === 'warning' ? "bg-amber-500 text-white" :
                        alert.type === 'danger' ? "bg-rose-500 text-white" :
                        "bg-blue-500 text-white"
                    )}>
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 grow">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{alert.title}</h4>
                        <p className="text-xs font-medium text-slate-500 dark:text-gray-400 leading-relaxed">{alert.message}</p>
                    </div>
                    {alert.title === 'High Dues' && stats.socialSummary.owed > 0 && (
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => sendReminders()}
                            className="ml-auto shrink-0 text-[10px] h-8 font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                        >
                            Remind
                        </Button>
                    )}
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
};
