import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Users, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface SubscriptionCardProps {
  subscription: any;
  onEdit: (sub: any) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ 
  subscription, 
  onEdit, 
  onDelete,
  onMarkPaid
}) => {
  const nextRenewal = new Date(subscription.nextRenewal);
  const daysUntilRenewal = differenceInDays(nextRenewal, new Date());
  
  const isExpiringSoon = daysUntilRenewal >= 0 && daysUntilRenewal <= 5;
  const isExpired = daysUntilRenewal < 0;

  const yearlyCost = subscription.billingCycle === 'monthly' 
    ? subscription.amount * 12 
    : subscription.amount;

  const statusLabel = isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active';
  const statusColor = isExpired 
    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' 
    : isExpiringSoon 
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className="glass-card border-none overflow-hidden relative">
        {isExpiringSoon && (
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 animate-pulse" />
        )}
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-white/5 flex items-center justify-center border border-brand-100 dark:border-white/10 shrink-0">
                {subscription.logo ? (
                  <img src={subscription.logo} alt={subscription.name} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xl font-black text-brand-600 dark:text-brand-400">
                    {subscription.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-display font-black text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {subscription.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border-none", statusColor)}>
                    {statusLabel}
                  </Badge>
                  <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest leading-none">
                    {subscription.category}
                  </span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-xl transition-all outline-none select-none size-8",
                  "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                )}
              >
                <MoreVertical className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card rounded-2xl border-white/20">
                <DropdownMenuItem onClick={() => onEdit(subscription)} className="font-bold">
                  <Edit3 className="w-4 h-4 mr-2" /> Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMarkPaid(subscription.id)} className="font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark as Paid
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(subscription.id)} className="font-bold text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-4 h-4 mr-2" /> Cancel Subscription
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">Billing Cycle</p>
              <p className="text-sm font-bold text-slate-700 dark:text-gray-200 capitalize">
                {formatCurrency(subscription.amount)} / {subscription.billingCycle === 'monthly' ? 'mo' : 'yr'}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">Next Renewal</p>
              <div className="flex items-center justify-end gap-1.5">
                <Calendar className={cn("w-3.5 h-3.5", isExpiringSoon ? "text-amber-500" : "text-slate-400")} />
                <p className={cn("text-sm font-bold", isExpiringSoon ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-gray-200")}>
                  {format(nextRenewal, 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 dark:text-gray-400 italic">
                  Annual impact: <span className="font-bold text-slate-700 dark:text-gray-200 not-italic">{formatCurrency(yearlyCost)}</span>
                </span>
              </div>
              
              {subscription.isShared && (
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] uppercase font-bold text-brand-600/60 dark:text-brand-400/60">Your share:</span>
                  <span className="text-sm font-black text-brand-600 dark:text-brand-400">
                    {formatCurrency(subscription.splitAmount)}
                  </span>
                </div>
              )}
            </div>

            {subscription.isShared && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-brand-50/50 dark:bg-brand-500/5 p-3 rounded-xl border border-brand-100/50 dark:border-brand-500/20">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span className="text-xs font-bold text-slate-600 dark:text-gray-300">
                      Split with {subscription.participants?.length || 0} others
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/20 rounded-lg">
                    Manage
                  </Button>
                </div>
                
                {subscription.participantStatuses && (
                  <div className="px-3 space-y-2">
                    {Object.entries(subscription.participantStatuses).map(([emailKey, status]) => {
                      const email = emailKey.replace(/_/g, '.');
                      return (
                        <div key={emailKey} className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-medium truncate max-w-[120px]">{email}</span>
                          <span className={cn(
                            "font-black uppercase tracking-tighter flex items-center gap-1",
                            status === 'accepted' ? "text-emerald-600" : 
                            status === 'rejected' ? "text-rose-600" : "text-amber-600"
                          )}>
                            {status === 'accepted' ? '✅ Joined' : 
                             status === 'rejected' ? '❌ Declined' : '⏳ Pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {isExpiringSoon && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[11px] font-bold">
                Renews in {daysUntilRenewal} {daysUntilRenewal === 1 ? 'day' : 'days'}. Ensure balance is available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
