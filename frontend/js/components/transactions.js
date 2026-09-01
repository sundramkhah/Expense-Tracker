import { money, readableDate } from '../utils/format.js';

export function renderTransactions(items, onDelete) {
  const list = document.getElementById('transaction-list');
  list.innerHTML = items.length ? items.map((item) => `
    <li class="list-row">
      <div><strong>${escapeHtml(item.category)}</strong><small>${escapeHtml(item.description || 'No description')} · ${readableDate(item.date)}</small></div>
      <div class="row-actions"><span class="amount ${item.type}">${item.type === 'expense' ? '-' : '+'}${money(item.amount)}</span><button class="danger-link" data-id="${item.id}">Delete</button></div>
    </li>`).join('') : '<li class="empty">No transactions yet.</li>';
  list.querySelectorAll('[data-id]').forEach((button) => button.addEventListener('click', () => onDelete(button.dataset.id)));
}

function escapeHtml(value) {
  const div = document.createElement('div'); div.textContent = value; return div.innerHTML;
}
