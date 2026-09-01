import { createId, readStore, updateStore } from '../../utils/store.js';

export async function list(userId, month) {
  const store = await readStore();
  return store.budgets.filter((item) => item.userId === userId && (!month || item.month === month)).sort((a, b) => a.category.localeCompare(b.category));
}

export function create(userId, input) {
  return updateStore((store) => {
    const existing = store.budgets.find((item) => item.userId === userId && item.month === input.month && item.category.toLowerCase() === input.category.toLowerCase());
    if (existing) {
      Object.assign(existing, input, { updatedAt: new Date().toISOString() });
      return existing;
    }
    const now = new Date().toISOString();
    const item = { id: createId(), userId, ...input, createdAt: now, updatedAt: now };
    store.budgets.push(item);
    return item;
  });
}

export function update(userId, id, input) {
  return updateStore((store) => {
    const item = store.budgets.find((entry) => entry.id === id && entry.userId === userId);
    if (!item) return null;
    Object.assign(item, input, { updatedAt: new Date().toISOString() });
    return item;
  });
}

export function remove(userId, id) {
  return updateStore((store) => {
    const index = store.budgets.findIndex((item) => item.id === id && item.userId === userId);
    if (index < 0) return false;
    store.budgets.splice(index, 1);
    return true;
  });
}
