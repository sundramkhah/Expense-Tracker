import ApiError from '../../utils/ApiError.js';
import * as repository from './recurring.repository.js';

export const listRecurring = repository.list;
export const createRecurring = repository.create;

export async function updateRecurring(userId, id, input) {
  const item = await repository.update(userId, id, input);
  if (!item) throw new ApiError(404, 'Recurring item not found');
  return item;
}

export async function deleteRecurring(userId, id) {
  if (!(await repository.remove(userId, id))) throw new ApiError(404, 'Recurring item not found');
}
