import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Receipt, 
  Trash2, 
  Edit2,
  ChevronRight,
  ChevronLeft,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';
import { handleFirestoreError, OperationType } from '@/lib/firebase-utils';

export const ExpensesPage: React.FC = () => {
  const { expenses, loading } = useFinance();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'Food',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    transactionType: 'expense' as 'income' | 'expense'
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const expenseData = {
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
        date: newExpense.date,
        userId: user.uid,
        type: newExpense.transactionType,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'expenses'), expenseData);
      
      setIsAddOpen(false);
      setNewExpense({ 
        amount: '', 
        category: 'Food', 
        description: '', 
        date: format(new Date(), 'yyyy-MM-dd'),
        transactionType: 'expense'
      });
      toast.success(`${newExpense.transactionType === 'income' ? 'Income' : 'Expense'} added successfully!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'expenses');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
      toast.success("Expense deleted.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Expenses</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1.5 font-medium">Manage and track your personal spending.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger className="inline-flex items-center justify-center ios-btn premium-gradient px-6 py-3 text-sm font-bold text-white shadow-xl shadow-brand-500/20 cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            New Expense
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl glass-card border-white/20 dark:border-white/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold dark:text-white">Add New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-6 pt-4">
              <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setNewExpense({ ...newExpense, transactionType: 'expense' })}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300",
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
                    "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300",
                    newExpense.transactionType === 'income' 
                      ? "bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white"
                  )}
                >
                  Income
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="dark:text-gray-300">Amount (₹)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  required 
                  value={newExpense.amount}
                  onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                  className="rounded-xl ios-input dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc" className="dark:text-gray-300">Description</Label>
                <Input 
                  id="desc" 
                  placeholder="e.g. Grocery shopping" 
                  required 
                  value={newExpense.description}
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                  className="rounded-xl ios-input dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="dark:text-gray-300">Category</Label>
                  <select 
                    id="category"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111111] text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
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
                  <Label htmlFor="date" className="dark:text-gray-300">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    required 
                    value={newExpense.date}
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                    className="rounded-xl ios-input dark:text-white"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl bg-brand-600 py-6 text-lg font-bold">Save Expense</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by description or category..." 
            className="pl-10 rounded-xl border-slate-200 dark:border-gray-800 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="rounded-xl border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/10">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Expense List */}
      <div className="space-y-4">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-20 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-dashed border-slate-200 dark:border-gray-800">
            <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Receipt className="w-10 h-10 text-slate-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">No expenses found</h3>
            <p className="text-slate-500 dark:text-gray-400 mt-2">Start tracking your spending by adding your first expense.</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="glass-card border-none hover:shadow-2xl transition-all duration-300 group">
                <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-white/10 transition-colors shrink-0">
                      <Receipt className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base md:text-lg font-bold text-slate-900 dark:text-white truncate">{expense.description}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-400 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          {expense.category}
                        </Badge>
                        <span className="text-[10px] md:text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(expense.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-8 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-none border-slate-100 dark:border-white/5">
                    <div className="text-left sm:text-right">
                      <p className={cn(
                        "text-xl font-display font-bold",
                        expense.type === 'income' ? "text-emerald-600" : "text-slate-900 dark:text-white"
                      )}>
                        {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                      </p>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        expense.type === 'income' ? "text-emerald-500" : "text-slate-400 dark:text-gray-500"
                      )}>
                        {expense.type === 'income' ? 'Income' : 'Personal'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredExpenses.length > 0 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-slate-500">Showing {filteredExpenses.length} results</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled className="rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="rounded-lg bg-brand-600 text-white border-brand-600">1</Button>
            <Button variant="outline" size="icon" className="rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
};
