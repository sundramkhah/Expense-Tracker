import ApiError from '../../utils/ApiError.js';
import * as repository from './budget.repository.js';

export const listBudgets = repository.list;
export const createBudget = repository.create;

export async function updateBudget(userId, id, input) {
  const item = await repository.update(userId, id, input);
  if (!item) throw new ApiError(404, 'Budget not found');
  return item;
}

export async function deleteBudget(userId, id) {
  if (!(await repository.remove(userId, id))) throw new ApiError(404, 'Budget not found');
}
