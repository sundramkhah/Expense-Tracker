import { request } from './client.js';
export const register = (input) => request('/auth/register', { method: 'POST', body: JSON.stringify(input) });
export const login = (input) => request('/auth/login', { method: 'POST', body: JSON.stringify(input) });
export const getMe = () => request('/auth/me');
