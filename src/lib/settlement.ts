export interface Participant {
  email: string;
  name?: string;
}

export interface OptimizedTransaction {
  from: string;
  to: string;
  amount: number;
}

/**
 * Minimizes transactions between users using a greedy matching algorithm.
 * Net balance approach: 
 * 1. Find the net balance of each user (what they are owed - what they owe).
 * 2. Separate users into "Payers" (debtors) and "Receivers" (creditors).
 * 3. Match the largest Payer with the largest Receiver.
 */
export const optimizeTransactions = (sharedExpenses: any[], currentUserEmail: string): OptimizedTransaction[] => {
  const balances: Record<string, number> = {};

  sharedExpenses.forEach(exp => {
    const creator = exp.creatorEmail;
    const totalAmount = exp.amount;
    const splits = exp.splits || {};

    // The creator is owed the money by others
    Object.entries(splits).forEach(([emailRaw, amount]) => {
      const email = emailRaw.replace(/_/g, '.');
      const share = amount as number;

      if (email !== creator) {
        balances[email] = (balances[email] || 0) - share;
        balances[creator] = (balances[creator] || 0) + share;
      }
    });
  });

  const debtors = Object.entries(balances)
    .filter(([, bal]) => bal < -0.01)
    .map(([email, bal]) => ({ email, bal: Math.abs(bal) }))
    .sort((a, b) => b.bal - a.bal);

  const creditors = Object.entries(balances)
    .filter(([, bal]) => bal > 0.01)
    .map(([email, bal]) => ({ email, bal }))
    .sort((a, b) => b.bal - a.bal);

  const transactions: OptimizedTransaction[] = [];

  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];

    const amount = Math.min(d.bal, c.bal);
    
    if (amount > 0.01) {
      transactions.push({
        from: d.email,
        to: c.email,
        amount: Math.round(amount * 100) / 100
      });
    }

    d.bal -= amount;
    c.bal -= amount;

    if (d.bal < 0.01) i++;
    if (c.bal < 0.01) j++;
  }

  return transactions;
};
