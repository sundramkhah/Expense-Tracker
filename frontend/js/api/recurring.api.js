import { request } from './client.js';
export const listRecurring = () => request('/recurring');
export const createRecurring = (input) => request('/recurring', { method: 'POST', body: JSON.stringify(input) });
export const updateRecurring = (id, input) => request(`/recurring/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
export const deleteRecurring = (id) => request(`/recurring/${id}`, { method: 'DELETE' });
