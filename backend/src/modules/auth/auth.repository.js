import { createId, readStore, updateStore } from '../../utils/store.js';

export async function findByUsername(username) {
  const store = await readStore();
  return store.users.find((user) => user.username.toLowerCase() === username.toLowerCase()) || null;
}

export function createUser({ username, password }) {
  return updateStore((store) => {
    const user = { id: createId(), username, password, createdAt: new Date().toISOString() };
    store.users.push(user);
    return user;
  });
}
