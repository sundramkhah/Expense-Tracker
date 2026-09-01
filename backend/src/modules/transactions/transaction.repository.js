import { createId, readStore, updateStore } from '../../utils/store.js';

export async function list(userId, filters = {}) {
  const store = await readStore();
  return store.transactions
    .filter((item) => item.userId === userId)
    .filter((item) => !filters.type || item.type === filters.type)
    .filter((item) => !filters.category || item.category.toLowerCase() === filters.category.toLowerCase())
    .filter((item) => !filters.from || item.date >= filters.from)
    .filter((item) => !filters.to || item.date <= filters.to)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function find(userId, id) {
  const store = await readStore();
  return store.transactions.find((item) => item.id === id && item.userId === userId) || null;
}

export function create(userId, input) {
  return updateStore((store) => {
    const now = new Date().toISOString();
    const item = { id: createId(), userId, ...input, date: input.date.slice(0, 10), createdAt: now, updatedAt: now };
    store.transactions.push(item);
    return item;
  });
}

export function update(userId, id, input) {
  return updateStore((store) => {
    const index = store.transactions.findIndex((item) => item.id === id && item.userId === userId);
    if (index < 0) return null;
    store.transactions[index] = { ...store.transactions[index], ...input, ...(input.date && { date: input.date.slice(0, 10) }), updatedAt: new Date().toISOString() };
    return store.transactions[index];
  });
}

export function remove(userId, id) {
  return updateStore((store) => {
    const index = store.transactions.findIndex((item) => item.id === id && item.userId === userId);
    if (index < 0) return false;
    store.transactions.splice(index, 1);
    return true;
  });
}
