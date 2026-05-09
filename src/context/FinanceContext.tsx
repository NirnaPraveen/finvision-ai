import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, query, where, orderBy, addDoc, updateDoc, doc, getDocFromServer } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firebase-utils';
import { useAuth } from './AuthContext';
import { isBefore, addMonths, addYears, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface FinanceContextType {
  expenses: any[];
  sharedExpenses: any[];
  subscriptions: any[];
  notifications: any[];
  settlements: any[];
  loading: boolean;
  processRenewals: () => Promise<void>;
  acceptSubscription: (notificationId: string) => Promise<void>;
  rejectSubscription: (notificationId: string) => Promise<void>;
  completePayment: (fromEmail: string, toEmail: string, amount: number, reason: string, proofUrl?: string) => Promise<void>;
  sendReminders: () => Promise<void>;
  smartReminders: any[];
}

const FinanceContext = createContext<FinanceContextType>({
  expenses: [],
  sharedExpenses: [],
  subscriptions: [],
  notifications: [],
  settlements: [],
  loading: true,
  processRenewals: async () => {},
  acceptSubscription: async () => {},
  rejectSubscription: async () => {},
  completePayment: async () => {},
  sendReminders: async () => {},
  smartReminders: []
});

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [sharedExpenses, setSharedExpenses] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [smartReminders, setSmartReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const generateSmartReminders = useCallback(() => {
    if (!user) return;
    const reminders = [];
    
    // 1. Debt Reminders (Feature 5)
    sharedExpenses.filter(e => e.status === 'pending').forEach(exp => {
      const isCreator = exp.creatorId === user.uid;
      const myEmail = user.email || '';
      const myShare = exp.splits[myEmail.replace(/\./g, '_')] || 0;
      
      if (!isCreator && myShare > 0) {
        reminders.push({
          id: `rem-debt-${exp.id}`,
          title: "Outstanding Split",
          message: `You might forget to pay ${formatCurrency(myShare)} to ${exp.creatorEmail.split('@')[0]} for "${exp.description}"`,
          type: 'warning',
          date: exp.date
        });
      }
    });

    // 2. Subscription Reminders
    subscriptions.forEach(sub => {
      const renewalDate = parseISO(sub.nextRenewal);
      const daysUntil = (renewalDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      
      if (daysUntil <= 2 && daysUntil > 0) {
        reminders.push({
          id: `rem-sub-${sub.id}`,
          title: "Renewal Alert",
          message: `${sub.name} renews in ${Math.ceil(daysUntil)} day(s). Action required?`,
          type: 'info',
          date: sub.nextRenewal
        });
      }
    });

    setSmartReminders(reminders);
  }, [user, sharedExpenses, subscriptions]);

  useEffect(() => {
    generateSmartReminders();
  }, [generateSmartReminders]);

  const acceptSubscription = async (notificationId: string) => {
    if (!user) return;
    const notif = notifications.find(n => n.id === notificationId);
    if (!notif || !notif.payload) return;

    try {
      const { subscriptionId, amount, creatorEmail } = notif.payload;

      // 1. Update Notification status
      await updateDoc(doc(db, 'notifications', notificationId), {
        status: 'accepted',
        read: true
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`));

      // 2. Update the master Subscription record's participant status
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        [`participantStatuses.${user.email?.replace(/\./g, '_')}`]: 'accepted'
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `subscriptions/${subscriptionId}`));

      // 3. Add a copy of this subscription to the acceptor's account for tracking
      await addDoc(collection(db, 'subscriptions'), {
        userId: user.uid,
        userEmail: user.email,
        name: notif.payload.name,
        amount: notif.payload.totalAmount,
        billingCycle: notif.payload.billingCycle,
        nextRenewal: notif.payload.nextRenewal,
        category: notif.payload.category,
        isShared: true,
        splitAmount: amount,
        masterSubscriptionId: subscriptionId,
        status: 'active',
        creatorEmail: creatorEmail
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'subscriptions'));

      toast.success("Subscription accepted and added to your vault!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept subscription.");
    }
  };

  const rejectSubscription = async (notificationId: string) => {
    if (!user) return;
    const notif = notifications.find(n => n.id === notificationId);
    if (!notif || !notif.payload) return;

    try {
      const { subscriptionId } = notif.payload;

      await updateDoc(doc(db, 'notifications', notificationId), {
        status: 'rejected',
        read: true
      });

      const targetSub = subscriptions.find(s => s.id === subscriptionId);
      const filteredParticipants = (targetSub?.participants || []).filter((p: string) => p !== user.email);

      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        [`participantStatuses.${user.email?.replace(/\./g, '_')}`]: 'rejected',
        participants: filteredParticipants
      });

      toast.info("Subscription split rejected.");
    } catch (err) {
      console.error(err);
    }
  };

  const completePayment = async (fromEmail: string, toEmail: string, amount: number, reason: string, proofUrl?: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'settlements'), {
        fromId: user.uid,
        fromEmail,
        toEmail,
        amount,
        reason,
        status: 'paid',
        date: new Date().toISOString(),
        paymentMethod: 'In-app Transfer',
        proofUrl: proofUrl || null,
        isVerified: false
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'settlements'));

      toast.success(proofUrl ? "Payment sent with proof!" : "Payment confirmed!");
    } catch (err) {
      console.error(err);
      toast.error("Payment logging failed.");
    }
  };

  const sendReminders = useCallback(async () => {
    if (!user) return;
    
    const myOwedExpenses = sharedExpenses.filter(e => e.creatorId === user.uid);
    const notificationsToSend: any[] = [];
    const uniqueUsersSet = new Set<string>();

    myOwedExpenses.forEach(exp => {
      Object.entries(exp.participantStatuses || {}).forEach(([emailId, status]) => {
        const email = emailId.replace(/_/g, '.');
        if (status === 'pending' && email !== user.email) {
          const amountOwed = exp.splits[emailId] || 0;
          if (amountOwed > 0) {
            uniqueUsersSet.add(email);
            notificationsToSend.push({
              targetEmail: email,
              userEmail: email,
              title: "Payment Reminder",
              message: `Reminder: You owe ₹${amountOwed} to ${user.displayName || user.email} for "${exp.description}". Please settle your dues.`,
              type: 'reminder',
              createdAt: new Date().toISOString(),
              read: false,
              link: '/shared'
            });
          }
        }
      });
    });

    if (notificationsToSend.length === 0) {
      toast.info("No pending dues found from others.");
      return;
    }

    try {
      await Promise.all(notificationsToSend.map(notif => 
        addDoc(collection(db, 'notifications'), notif)
      ));
      toast.success(`Reminders sent to ${uniqueUsersSet.size} users`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'notifications');
    }
  }, [sharedExpenses, user]);

  const processRenewals = useCallback(async () => {
    if (!user || subscriptions.length === 0) return;

    const now = new Date();
    const renewalsToProcess = subscriptions.filter(sub => {
      const nextRenewal = parseISO(sub.nextRenewal);
      // Only process renewals for master subscriptions (owned by creator) to avoid duplicates
      return isBefore(nextRenewal, now) && 
             sub.status !== 'expired' && 
             !sub.masterSubscriptionId;
    });

    for (const sub of renewalsToProcess) {
      try {
        // 1. Create Expense Entry
        if (sub.isShared) {
          const currentParticipants = sub.participants || [];
          const participants = currentParticipants.includes(user.email) ? currentParticipants : [...currentParticipants, user.email];
          await addDoc(collection(db, 'shared_expenses'), {
            amount: sub.amount,
            description: `Renewal: ${sub.name}`,
            category: sub.category,
            creatorId: user.uid,
            creatorEmail: user.email,
            participants,
            date: sub.nextRenewal,
            status: 'pending',
            splits: participants.reduce((acc: any, email: string) => {
              acc[email.replace(/\./g, '_')] = sub.splitAmount;
              return acc;
            }, {})
          }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'shared_expenses'));

          // 2. Notify participants
          const participantsToNotify = sub.participants || [];
          for (const pEmail of participantsToNotify) {
            if (pEmail !== user.email) {
              await addDoc(collection(db, 'notifications'), {
                userEmail: pEmail,
                title: 'New Subscription Shared Bill',
                message: `You owe ${sub.splitAmount} for ${sub.name} subscription renewal.`,
                type: 'reminder',
                read: false,
                createdAt: new Date().toISOString()
              }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'notifications'));
            }
          }
        } else {
          await addDoc(collection(db, 'expenses'), {
            userId: user.uid,
            amount: sub.amount,
            category: sub.category,
            description: `Renewal: ${sub.name}`,
            date: sub.nextRenewal,
            type: 'expense'
          }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'expenses'));
        }

        // 3. Update Subscription to next date
        const nextDate = sub.billingCycle === 'monthly' 
          ? addMonths(parseISO(sub.nextRenewal), 1)
          : addYears(parseISO(sub.nextRenewal), 1);
        
        await updateDoc(doc(db, 'subscriptions', sub.id), {
          nextRenewal: nextDate.toISOString()
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `subscriptions/${sub.id}`));

        // 4. Send renewal notification to owner
        await addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          userEmail: user.email,
          title: 'Subscription Renewed',
          message: `${sub.name} subscription has been renewed successfully.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'notifications'));

      } catch (err) {
        console.error(`Failed to process renewal for ${sub.name}:`, err);
      }
    }
  }, [user, subscriptions]);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setSharedExpenses([]);
      setSubscriptions([]);
      setNotifications([]);
      setSettlements([]);
      setLoading(false);
      return;
    }

    const qExpenses = query(collection(db, 'expenses'), where('userId', '==', user.uid), orderBy('date', 'desc'));
    const qShared = query(collection(db, 'shared_expenses'), where('participants', 'array-contains', user.email));
    const qSubs = query(collection(db, 'subscriptions'), where('userEmail', '==', user.email));
    const qNotifs = query(collection(db, 'notifications'), where('userEmail', '==', user.email), orderBy('createdAt', 'desc'));
    const qSettlements = query(collection(db, 'settlements'), where('fromEmail', '==', user.email));

    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'expenses'));

    const unsubShared = onSnapshot(qShared, (snapshot) => {
      setSharedExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'shared_expenses'));

    const unsubSubs = onSnapshot(qSubs, (snapshot) => {
      setSubscriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'subscriptions'));

    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));

    const unsubSettlements = onSnapshot(qSettlements, (snapshot) => {
      setSettlements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'settlements'));

    setLoading(false);

    return () => {
      unsubExpenses();
      unsubShared();
      unsubSubs();
      unsubNotifs();
      unsubSettlements();
    };
  }, [user]);

  // Check renewals once loading is done
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'system', 'connection_test'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
    
    if (!loading && subscriptions.length > 0) {
      processRenewals();
    }
  }, [loading, subscriptions.length, processRenewals]);

  return (
    <FinanceContext.Provider value={{ 
      expenses, 
      sharedExpenses, 
      subscriptions, 
      notifications, 
      settlements, 
      loading, 
      processRenewals,
      acceptSubscription,
      rejectSubscription,
      completePayment,
      sendReminders,
      smartReminders
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
