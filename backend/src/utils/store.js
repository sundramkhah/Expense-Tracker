import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const dataDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data');
const dataFile = process.env.DATA_FILE ? path.resolve(process.env.DATA_FILE) : path.join(dataDirectory, 'store.json');
const emptyStore = { users: [], transactions: [], budgets: [], recurring: [] };
let writeQueue = Promise.resolve();

export const createId = () => randomUUID();

export async function initializeStore() {
  await mkdir(path.dirname(dataFile), { recursive: true });
  try {
    await readFile(dataFile, 'utf8');
  } catch {
    await writeFile(dataFile, JSON.stringify(emptyStore, null, 2));
  }
}

export async function readStore() {
  await initializeStore();
  return JSON.parse(await readFile(dataFile, 'utf8'));
}

export function updateStore(updater) {
  const operation = writeQueue.then(async () => {
    const store = await readStore();
    const result = await updater(store);
    await writeFile(dataFile, JSON.stringify(store, null, 2));
    return result;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}
