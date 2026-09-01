import { readStore } from '../../utils/store.js';

export async function getUserData(userId) {
  const store = await readStore();
  return {
    transactions: store.transactions.filter((item) => item.userId === userId),
    budgets: store.budgets.filter((item) => item.userId === userId),
    recurring: store.recurring.filter((item) => item.userId === userId),
  };
}
