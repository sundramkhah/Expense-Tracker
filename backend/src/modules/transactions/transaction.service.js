import ApiError from '../../utils/ApiError.js';
import * as repository from './transaction.repository.js';

export const listTransactions = repository.list;
export const createTransaction = repository.create;

export async function getTransaction(userId, id) {
  const item = await repository.find(userId, id);
  if (!item) throw new ApiError(404, 'Transaction not found');
  return item;
}

export async function updateTransaction(userId, id, input) {
  const item = await repository.update(userId, id, input);
  if (!item) throw new ApiError(404, 'Transaction not found');
  return item;
}

export async function deleteTransaction(userId, id) {
  if (!(await repository.remove(userId, id))) throw new ApiError(404, 'Transaction not found');
}
