const API_BASE = location.protocol === 'file:' ? 'http://localhost:5000/api' : '/api';

export async function request(path, options = {}) {
  const token = localStorage.getItem('expenseToken');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Request failed');
  return body.data;
}
