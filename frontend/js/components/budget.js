import { money } from '../utils/format.js';

export function renderBudgets(items, onDelete) {
  const list = document.getElementById('budget-list');
  list.innerHTML = items.length ? items.map((item) => {
    const percent = Math.min(100, Math.round(((item.spent || 0) / item.limit) * 100));
    return `<li><div class="budget-head"><strong>${item.category}</strong><span>${money(item.spent || 0)} / ${money(item.limit)}</span></div><div class="progress"><span style="width:${percent}%"></span></div><button class="danger-link" data-id="${item.id}">Delete</button></li>`;
  }).join('') : '<li class="empty">No budgets for this month.</li>';
  list.querySelectorAll('[data-id]').forEach((button) => button.addEventListener('click', () => onDelete(button.dataset.id)));
}
