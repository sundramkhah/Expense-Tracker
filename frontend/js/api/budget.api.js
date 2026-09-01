import { request } from './client.js';
export const listBudgets = (month = '') => request(`/budgets${month ? `?month=${month}` : ''}`);
export const createBudget = (input) => request('/budgets', { method: 'POST', body: JSON.stringify(input) });
export const updateBudget = (id, input) => request(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
export const deleteBudget = (id) => request(`/budgets/${id}`, { method: 'DELETE' });
