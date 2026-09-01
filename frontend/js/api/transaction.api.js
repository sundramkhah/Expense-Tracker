import { request } from './client.js';
export const listTransactions = (query = '') => request(`/transactions${query ? `?${query}` : ''}`);
export const createTransaction = (input) => request('/transactions', { method: 'POST', body: JSON.stringify(input) });
export const updateTransaction = (id, input) => request(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
export const deleteTransaction = (id) => request(`/transactions/${id}`, { method: 'DELETE' });
