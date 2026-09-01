import { request } from './client.js';
export const getDashboard = (month = '') => request(`/dashboard${month ? `?month=${month}` : ''}`);
