import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  MoreVertical, 
  Trash2, 
  Edit3,
  CreditCard,
  ShoppingBag,
  Coffee,
  Plane,
  Home,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { PaymentModal } from '@/components/finance/PaymentModal';

interface SharedExpenseCardProps {
  expense: any;
  currentUserId: string;
  currentUserEmail: string;
  onSettle: (id: string, info?: any) => void;
  onEdit: (expense: any) => void;
  onDelete: (id: string) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'food': return Coffee;
    case 'shopping': return ShoppingBag;
    case 'travel': return Plane;
    case 'rent':
    case 'home': return Home;
    case 'bills': return Zap;
    default: return CreditCard;
  }
};

export const SharedExpenseCard: React.FC<SharedExpenseCardProps> = ({ 
  expense, 
  currentUserId, 
  currentUserEmail,
  onSettle, 
  onEdit, 
  onDelete 
}) => {
  const [payModalOpen, setPayModalOpen] = useState(false);
  const Icon = getCategoryIcon(expense.category);
  const isCreator = expense.creatorId === currentUserId;
  const myShare = expense.splits[currentUserEmail.replace(/\./g, '_')] || 0;
  
  const handlePayment = async () => {
    onSettle(expense.id, {
      amount: balanceAmount,
      description: expense.description,
      creatorId: expense.creatorId,
      creatorEmail: expense.creatorEmail || 'creator@finvision.ai'
    });
  };
  
  // Logic for balance status
  const myStatus = expense.participantStatuses?.[currentUserEmail.replace(/\./g, '_')] || expense.status;
  const allSettled = (expense.participants || []).every((p: string) => 
    expense.participantStatuses?.[p.replace(/\./g, '_')] === 'settled'
  );

  const status = allSettled 
    ? 'settled' 
    : isCreator 
      ? 'owed' 
      : (myStatus === 'settled' ? 'settled' : 'owe');
  
  const balanceAmount = isCreator 
    ? expense.amount - myShare 
    : myShare;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className="glass-card border-none overflow-hidden hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                status === 'owed' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" :
                status === 'owe' ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" :
                "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-500"
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {expense.description}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 dark:text-gray-400">
                    {format(new Date(expense.date), 'MMM dd')}
                  </span>
                  <span className="text-[10px] text-slate-300 dark:text-gray-600">•</span>
                  <div className="flex items-center gap-1.5 ">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-gray-400">
                      Split with {(expense.participants?.length || 1) - 1} people
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-display font-black text-slate-900 dark:text-white">
                {formatCurrency(expense.amount)}
              </p>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider mt-1 border-none px-2 py-0.5 rounded-lg",
                  status === 'owed' ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" :
                  status === 'owe' ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300" :
                  "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400"
                )}
              >
                {expense.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                {isCreator ? "You Paid" : "Your Share"}
              </p>
              <p className="text-sm font-bold text-slate-700 dark:text-gray-200">
                {formatCurrency(isCreator ? expense.amount : myShare)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                Balance
              </p>
              <p className={cn(
                "text-sm font-black",
                status === 'owed' ? "text-emerald-600 dark:text-emerald-400" :
                status === 'owe' ? "text-rose-600 dark:text-rose-400" :
                "text-slate-500 dark:text-gray-400"
              )}>
                {status === 'owed' ? "+" : status === 'owe' ? "-" : ""}{formatCurrency(balanceAmount)}
                <span className="text-[10px] ml-1 font-medium italic opacity-70">
                  {status === 'owed' ? "(owed)" : status === 'owe' ? "(owe)" : "(settled)"}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {status === 'owe' && expense.status === 'pending' && (
                <>
                  <Button 
                    onClick={() => setPayModalOpen(true)}
                    className="ios-btn bg-brand-600 hover:bg-brand-700 text-white font-black h-11 px-6 rounded-xl shadow-lg shadow-brand-500/20"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Now
                  </Button>
                  <PaymentModal 
                    open={payModalOpen}
                    onOpenChange={setPayModalOpen}
                    amount={balanceAmount}
                    recipientEmail={expense.creatorEmail || "Admin"}
                    reason={expense.description}
                    onConfirm={handlePayment}
                  />
                </>
              )}
              {isCreator && expense.status === 'pending' && (
                <Button 
                  onClick={() => onEdit(expense)}
                  variant="outline"
                  className="ios-btn border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5 font-bold h-9 px-4 rounded-xl"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-xl transition-all outline-none select-none size-8",
                  "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-foreground"
                )}
              >
                <MoreVertical className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card rounded-2xl border-white/20 dark:border-white/10">
                {isCreator && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(expense.id)}
                    className="text-rose-600 dark:text-rose-400 font-bold focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Expense
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="font-bold">
                  View Participants
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
