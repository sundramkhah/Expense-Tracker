import { money } from '../utils/format.js';

export function renderCategoryChart(items) {
  const chart = document.getElementById('category-chart');
  const max = Math.max(...items.map((item) => item.amount), 1);
  chart.innerHTML = items.length ? items.map((item) => `<div class="bar-row"><span>${item.category}</span><div class="bar"><i style="width:${(item.amount / max) * 100}%"></i></div><strong>${money(item.amount)}</strong></div>`).join('') : '<p class="empty">No spending this month.</p>';
}
