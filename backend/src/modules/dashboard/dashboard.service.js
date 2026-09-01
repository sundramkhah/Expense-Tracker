import { getUserData } from './dashboard.repository.js';

export async function getDashboard(userId, requestedMonth) {
  const month = /^\d{4}-\d{2}$/.test(requestedMonth || '') ? requestedMonth : new Date().toISOString().slice(0, 7);
  const { transactions, budgets, recurring } = await getUserData(userId);
  const monthTransactions = transactions.filter((item) => item.date.startsWith(month));
  const income = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const categoryMap = {};
  monthTransactions.filter((item) => item.type === 'expense').forEach((item) => {
    const key = item.category.toLowerCase();
    categoryMap[key] ||= { category: item.category, amount: 0 };
    categoryMap[key].amount += item.amount;
  });
  const categorySpending = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);
  const budgetStatus = budgets.filter((item) => item.month === month).map((budget) => {
    const spent = categoryMap[budget.category.toLowerCase()]?.amount || 0;
    return { ...budget, spent, remaining: budget.limit - spent };
  });

  return {
    month,
    summary: { income, expenses, balance: income - expenses, transactionCount: monthTransactions.length },
    categorySpending,
    budgetStatus,
    upcomingRecurring: recurring.filter((item) => item.active).slice(0, 5),
    recentTransactions: [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
  };
}
