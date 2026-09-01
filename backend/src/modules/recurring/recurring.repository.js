import { createId, readStore, updateStore } from '../../utils/store.js';

export async function list(userId) {
  const store = await readStore();
  return store.recurring.filter((item) => item.userId === userId).sort((a, b) => a.nextDate.localeCompare(b.nextDate));
}

export function create(userId, input) {
  return updateStore((store) => {
    const now = new Date().toISOString();
    const item = { id: createId(), userId, ...input, nextDate: input.nextDate.slice(0, 10), createdAt: now, updatedAt: now };
    store.recurring.push(item);
    return item;
  });
}

export function update(userId, id, input) {
  return updateStore((store) => {
    const item = store.recurring.find((entry) => entry.id === id && entry.userId === userId);
    if (!item) return null;
    Object.assign(item, input, input.nextDate ? { nextDate: input.nextDate.slice(0, 10) } : {}, { updatedAt: new Date().toISOString() });
    return item;
  });
}

export function remove(userId, id) {
  return updateStore((store) => {
    const index = store.recurring.findIndex((item) => item.id === id && item.userId === userId);
    if (index < 0) return false;
    store.recurring.splice(index, 1);
    return true;
  });
}
