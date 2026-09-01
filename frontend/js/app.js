import * as authApi from './api/auth.api.js';
import * as transactionApi from './api/transaction.api.js';
import * as budgetApi from './api/budget.api.js';
import * as recurringApi from './api/recurring.api.js';

const GUEST_DATA_KEY = 'ex_guest_data_v2';
const THEME_KEY = 'ex_theme';
const $ = (id) => document.getElementById(id);

const elements = {
  theme: $('btn-theme'), themeIcon: $('theme-icon'), userArea: $('user-area'), modal: $('login-modal'),
  authUser: $('auth-username'), authPass: $('auth-password'), loggedUser: $('logged-user'),
  type: $('tx-type'), category: $('tx-category'), amount: $('tx-amount'), date: $('tx-date'),
  notes: $('tx-notes'), recurring: $('tx-recurring'), save: $('btn-save'), formTitle: $('form-title'),
  balance: $('sum-balance'), income: $('sum-income'), expense: $('sum-expense'),
  budgetAmount: $('budget-amount'), budgetInput: $('budget-input'), budgetBar: $('budget-bar'), budgetUsed: $('budget-used'),
  search: $('search-input'), filterType: $('filter-type'), filterCategory: $('filter-category'),
  filterStart: $('filter-start'), filterEnd: $('filter-end'), recent: $('recent-list'), tableBody: $('txn-table-body'),
  importFile: $('import-file'), toast: $('toast'),
};

let session = { mode: 'guest', user: { username: 'Guest' } };
let store = { expenses: [], templates: [], settings: { budget: 0 } };
let editingId = null;
let lineChart = null;
let pieChart = null;
let toastTimer = null;
let budgetWarningKey = '';

function emptyStore() {
  return { expenses: [], templates: [], settings: { budget: 0 } };
}

function toast(message, duration = 2200) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove('show'), duration);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return todayISO().slice(0, 7);
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function money(value) {
  return '₹' + Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(value = '') {
  const element = document.createElement('div');
  element.textContent = String(value);
  return element.innerHTML;
}

function displayDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN');
}

function normalizeTransaction(item) {
  return {
    id: item.id || uid('txn'),
    templateId: item.templateId,
    category: item.category || 'Other',
    type: String(item.type || 'expense').toLowerCase() === 'income' ? 'Income' : 'Expense',
    amount: Number(item.amount),
    date: String(item.date || todayISO()).slice(0, 10),
    notes: item.notes ?? item.description ?? '',
  };
}

function normalizeTemplate(item) {
  return {
    id: item.id || uid('tpl'),
    category: item.category || 'Other',
    type: String(item.type || 'expense').toLowerCase() === 'income' ? 'Income' : 'Expense',
    amount: Number(item.amount),
    recurrence: item.recurrence || item.frequency || 'monthly',
    date: item.date || item.nextDate || todayISO(),
    nextDate: item.nextDate || item.date || todayISO(),
    notes: item.notes ?? item.description ?? '',
    active: item.active !== false,
  };
}

function transactionPayload(item) {
  return {
    type: item.type.toLowerCase(),
    amount: Number(item.amount),
    category: item.category,
    description: item.notes || '',
    date: item.date,
  };
}

function templatePayload(item) {
  return {
    type: item.type.toLowerCase(),
    amount: Number(item.amount),
    category: item.category,
    description: item.notes || '',
    frequency: item.recurrence,
    nextDate: item.nextDate || item.date,
    active: item.active !== false,
  };
}

function loadGuestData() {
  try {
    const raw = localStorage.getItem(GUEST_DATA_KEY)
      || localStorage.getItem('ex_data_v1_guest')
      || localStorage.getItem('ex_data_v1_Guest');
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    return {
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses.map(normalizeTransaction) : [],
      templates: Array.isArray(parsed.templates) ? parsed.templates.map(normalizeTemplate) : [],
      settings: { budget: Number(parsed.settings?.budget || 0) },
    };
  } catch {
    return emptyStore();
  }
}

function persistGuest() {
  if (session.mode === 'guest') localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(store));
}

function addMonths(dateString, count = 1) {
  const [year, month, day] = dateString.split('-').map(Number);
  const target = new Date(year, month - 1 + count, 1);
  const finalDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, finalDay));
  return [
    target.getFullYear(),
    String(target.getMonth() + 1).padStart(2, '0'),
    String(target.getDate()).padStart(2, '0'),
  ].join('-');
}

function processGuestRecurring() {
  const month = currentMonth();
  for (const template of store.templates.filter((item) => item.active !== false && item.recurrence === 'monthly')) {
    const exists = store.expenses.some((item) => item.templateId === template.id && item.date.startsWith(month));
    if (exists) continue;
    const sourceDate = template.date || template.nextDate || todayISO();
    const candidate = `${month}-${sourceDate.slice(8, 10)}`;
    const generatedDate = Number.isNaN(Date.parse(candidate)) ? `${month}-01` : candidate;
    store.expenses.push(normalizeTransaction({ ...template, id: uid('txn'), templateId: template.id, date: generatedDate }));
  }
  persistGuest();
}

async function processRemoteRecurring() {
  const templates = await recurringApi.listRecurring();
  const today = todayISO();
  for (const item of templates.filter((entry) => entry.active && entry.frequency === 'monthly')) {
    let nextDate = item.nextDate;
    let generated = 0;
    while (nextDate <= today && generated < 24) {
      await transactionApi.createTransaction({
        type: item.type, amount: item.amount, category: item.category,
        description: item.description || 'Recurring: monthly', date: nextDate,
      });
      nextDate = addMonths(nextDate);
      generated += 1;
    }
    if (nextDate !== item.nextDate) await recurringApi.updateRecurring(item.id, { nextDate });
  }
}

async function loadData() {
  if (session.mode === 'guest') {
    store = loadGuestData();
    processGuestRecurring();
  } else {
    await processRemoteRecurring();
    const month = currentMonth();
    const [transactions, budgets, templates] = await Promise.all([
      transactionApi.listTransactions(),
      budgetApi.listBudgets(month),
      recurringApi.listRecurring(),
    ]);
    const overallBudget = budgets.find((item) => item.category.toLowerCase() === 'overall');
    store = {
      expenses: transactions.map(normalizeTransaction),
      templates: templates.map(normalizeTemplate),
      settings: { budget: Number(overallBudget?.limit || 0) },
    };
  }
  renderAll();
}

function renderUserArea() {
  const username = escapeHtml(session.user.username);
  if (session.mode === 'guest') {
    elements.userArea.innerHTML = `<div class="actions"><strong>Guest</strong><button id="btn-open-login" class="btn small btn-primary">Login / Sign up</button></div>`;
    $('btn-open-login').addEventListener('click', () => showLogin(true));
    elements.loggedUser.textContent = 'Guest mode';
  } else {
    elements.userArea.innerHTML = `<div class="actions"><strong>${username}</strong><button id="btn-logout" class="btn small btn-ghost">Logout</button></div>`;
    $('btn-logout').addEventListener('click', useGuest);
    elements.loggedUser.textContent = `User: ${session.user.username}`;
  }
}

function showLogin(show) {
  elements.modal.hidden = !show;
  if (show) {
    elements.authUser.focus();
  } else {
    elements.authPass.value = '';
  }
}

async function useGuest() {
  localStorage.removeItem('expenseToken');
  session = { mode: 'guest', user: { username: 'Guest' } };
  showLogin(false);
  renderUserArea();
  await loadData();
  toast('Using guest mode');
}

async function authenticate(kind) {
  const username = elements.authUser.value.trim();
  const password = elements.authPass.value;
  if (username.length < 3 || password.length < 6) {
    toast('Use at least 3 username and 6 password characters');
    return;
  }
  try {
    const result = await authApi[kind]({ username, password });
    localStorage.setItem('expenseToken', result.token);
    session = { mode: 'user', user: result.user };
    showLogin(false);
    renderUserArea();
    await loadData();
    toast(kind === 'register' ? 'Account created' : 'Logged in');
  } catch (error) {
    toast(error.message);
  }
}

function clearForm() {
  editingId = null;
  elements.formTitle.textContent = 'Add Transaction';
  elements.save.textContent = 'Add';
  elements.type.value = 'Expense';
  elements.category.selectedIndex = 0;
  elements.amount.value = '';
  elements.date.value = todayISO();
  elements.notes.value = '';
  elements.recurring.value = 'none';
}

async function saveTransaction() {
  const transaction = normalizeTransaction({
    id: editingId || uid('txn'), type: elements.type.value, category: elements.category.value,
    amount: elements.amount.value, date: elements.date.value, notes: elements.notes.value.trim(),
  });
  if (!transaction.amount || transaction.amount <= 0 || !transaction.date) {
    toast('Please enter a valid amount and date');
    return;
  }

  try {
    if (editingId) {
      if (session.mode === 'guest') {
        const index = store.expenses.findIndex((item) => item.id === editingId);
        if (index >= 0) store.expenses[index] = transaction;
        persistGuest();
      } else {
        await transactionApi.updateTransaction(editingId, transactionPayload(transaction));
      }
      toast('Transaction updated');
    } else {
      if (session.mode === 'guest') {
        store.expenses.push(transaction);
        if (elements.recurring.value === 'monthly') {
          store.templates.push(normalizeTemplate({
            ...transaction, id: uid('tpl'), recurrence: 'monthly', nextDate: addMonths(transaction.date),
          }));
        }
        persistGuest();
      } else {
        await transactionApi.createTransaction(transactionPayload(transaction));
        if (elements.recurring.value === 'monthly') {
          await recurringApi.createRecurring(templatePayload(normalizeTemplate({
            ...transaction, recurrence: 'monthly', nextDate: addMonths(transaction.date),
          })));
        }
      }
      toast(elements.recurring.value === 'monthly' ? 'Transaction and recurring item added' : 'Transaction added');
    }
    clearForm();
    await loadData();
  } catch (error) {
    toast(error.message);
  }
}

function startEdit(id) {
  const item = store.expenses.find((transaction) => transaction.id === id);
  if (!item) return;
  editingId = id;
  elements.formTitle.textContent = 'Edit Transaction';
  elements.save.textContent = 'Save';
  elements.type.value = item.type;
  elements.category.value = item.category;
  elements.amount.value = item.amount;
  elements.date.value = item.date;
  elements.notes.value = item.notes || '';
  elements.recurring.value = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;
  try {
    if (session.mode === 'guest') {
      store.expenses = store.expenses.filter((item) => item.id !== id);
      persistGuest();
    } else {
      await transactionApi.deleteTransaction(id);
    }
    await loadData();
    toast('Transaction deleted');
  } catch (error) {
    toast(error.message);
  }
}

async function clearAll() {
  if (!confirm('Delete all transactions and recurring items?')) return;
  try {
    if (session.mode === 'guest') {
      store.expenses = [];
      store.templates = [];
      persistGuest();
    } else {
      await Promise.all([
        ...store.expenses.map((item) => transactionApi.deleteTransaction(item.id)),
        ...store.templates.map((item) => recurringApi.deleteRecurring(item.id)),
      ]);
    }
    await loadData();
    toast('All transactions cleared');
  } catch (error) {
    toast(error.message);
  }
}

async function setBudget() {
  const value = Number(elements.budgetInput.value);
  if (!value || value <= 0) return toast('Enter a valid budget');
  try {
    if (session.mode === 'guest') {
      store.settings.budget = value;
      persistGuest();
    } else {
      await budgetApi.createBudget({ category: 'Overall', limit: value, month: currentMonth() });
    }
    elements.budgetInput.value = '';
    await loadData();
    toast('Budget updated');
  } catch (error) {
    toast(error.message);
  }
}

function filteredTransactions() {
  let list = [...store.expenses];
  const query = elements.search.value.trim().toLowerCase();
  if (query) list = list.filter((item) => item.category.toLowerCase().includes(query) || item.notes.toLowerCase().includes(query));
  if (elements.filterType.value !== 'all') list = list.filter((item) => item.type === elements.filterType.value);
  if (elements.filterCategory.value !== 'all') list = list.filter((item) => item.category === elements.filterCategory.value);
  if (elements.filterStart.value) list = list.filter((item) => item.date >= elements.filterStart.value);
  if (elements.filterEnd.value) list = list.filter((item) => item.date <= elements.filterEnd.value);
  return list.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

function renderAll() {
  const month = currentMonth();
  const thisMonth = store.expenses.filter((item) => item.date.startsWith(month));
  const income = thisMonth.filter((item) => item.type === 'Income').reduce((sum, item) => sum + item.amount, 0);
  const expense = thisMonth.filter((item) => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0);
  const budget = Number(store.settings.budget || 0);
  const used = budget ? Math.round((expense / budget) * 100) : 0;
  elements.income.textContent = money(income);
  elements.expense.textContent = money(expense);
  elements.balance.textContent = money(income - expense);
  elements.budgetAmount.textContent = money(budget);
  elements.budgetBar.style.width = Math.min(used, 100) + '%';
  elements.budgetUsed.textContent = used > 100 ? '>100%' : used + '%';

  const warningKey = `${month}:${used >= 100 ? 'over' : used >= 80 ? 'near' : ''}`;
  if (budget && used >= 80 && warningKey !== budgetWarningKey) {
    budgetWarningKey = warningKey;
    toast(used >= 100 ? 'Budget exceeded for this month!' : 'Budget usage is above 80%', 3000);
  }
  renderRecent();
  renderTable();
  renderCharts();
}

function renderRecent() {
  const items = filteredTransactions().slice(0, 10);
  if (!items.length) {
    elements.recent.innerHTML = '<div class="empty">No transactions yet. Add one from the panel.</div>';
    return;
  }
  elements.recent.innerHTML = items.map((item) => {
    const isIncome = item.type === 'Income';
    return `<div class="recent-item">
      <div class="recent-main">
        <div class="recent-icon" style="background:${isIncome ? 'var(--recent-inc-bg)' : 'var(--recent-exp-bg)'}">${escapeHtml(item.category[0] || 'C')}</div>
        <div class="recent-details"><strong>${escapeHtml(item.category)}</strong> <span class="muted small">· ${escapeHtml(item.notes)}</span><div class="muted small">${displayDate(item.date)}</div></div>
      </div>
      <div class="recent-actions"><strong class="${isIncome ? 'income-text' : 'expense-text'}">${money(item.amount)}</strong>
        <div class="txn-actions"><button class="btn small btn-ghost" data-edit="${item.id}">Edit</button><button class="btn small danger" data-delete="${item.id}">Delete</button></div>
      </div>
    </div>`;
  }).join('');
  bindRowActions(elements.recent);
}

function renderTable() {
  const items = filteredTransactions();
  elements.tableBody.innerHTML = items.length ? items.map((item) => {
    const isIncome = item.type === 'Income';
    return `<tr><td><span class="badge" style="background:${isIncome ? 'var(--recent-inc-bg)' : 'var(--recent-exp-bg)'}">${escapeHtml(item.category)}</span></td>
      <td>${escapeHtml(item.notes)}</td><td><strong class="${isIncome ? 'income-text' : 'expense-text'}">${money(item.amount)}</strong></td>
      <td>${displayDate(item.date)}</td><td><button class="btn small btn-ghost" data-edit="${item.id}">Edit</button> <button class="btn small danger" data-delete="${item.id}">Delete</button></td></tr>`;
  }).join('') : '<tr><td colspan="5" class="empty">No matching transactions.</td></tr>';
  bindRowActions(elements.tableBody);
}

function bindRowActions(container) {
  container.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => startEdit(button.dataset.edit)));
  container.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => deleteTransaction(button.dataset.delete)));
}

function renderCharts() {
  const chartApi = window.Chart;
  if (lineChart) lineChart.destroy();
  if (pieChart) pieChart.destroy();
  lineChart = null;
  pieChart = null;
  const isDark = document.body.classList.contains('dark');
  const textColor = isDark ? '#f1f5f9' : '#475569';
  const gridColor = isDark ? 'rgba(241,245,249,.15)' : 'rgba(15,23,32,.1)';
  if (!chartApi) {
    for (const id of ['lineChart', 'pieChart']) {
      const canvas = $(id);
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = textColor;
      context.fillText('Charts load when an internet connection is available.', 12, 40);
    }
    return;
  }

  const monthKeys = [];
  const now = new Date();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    monthKeys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  const series = (type) => monthKeys.map((month) => store.expenses.filter((item) => item.type === type && item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0));
  lineChart = new chartApi($('lineChart'), {
    type: 'line',
    data: {
      labels: monthKeys.map((month) => new Date(month + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })),
      datasets: [
        { label: 'Income', data: series('Income'), borderColor: '#43a047', backgroundColor: '#43a047', tension: .25 },
        { label: 'Expense', data: series('Expense'), borderColor: '#ef4444', backgroundColor: '#ef4444', tension: .25 },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor } } }, scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } } },
  });

  const categories = {};
  filteredTransactions().filter((item) => item.type === 'Expense').forEach((item) => { categories[item.category] = (categories[item.category] || 0) + item.amount; });
  const labels = Object.keys(categories);
  pieChart = new chartApi($('pieChart'), {
    type: 'pie',
    data: labels.length
      ? { labels, datasets: [{ data: labels.map((label) => categories[label]), backgroundColor: ['#0288d1','#4db6ac','#ef4444','#f59e0b','#8e24aa','#43a047','#c2185b','#6d4c41'] }] }
      : { labels: ['No expenses'], datasets: [{ data: [1], backgroundColor: ['#dce5eb'] }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: textColor } } } },
  });
}

function download(name, type, content) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const header = ['id','date','type','category','amount','notes'];
  const rows = [header, ...store.expenses.map((item) => header.map((key) => item[key] ?? ''))];
  download('expense-transactions.csv', 'text/csv', rows.map((row) => row.map((value) => JSON.stringify(value)).join(',')).join('\n'));
}

function exportJson() {
  download('expense-tracker-export.json', 'application/json', JSON.stringify(store, null, 2));
}

async function importJson(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const expenses = Array.isArray(parsed.expenses) ? parsed.expenses.map(normalizeTransaction) : [];
    const templates = Array.isArray(parsed.templates) ? parsed.templates.map(normalizeTemplate) : [];
    if (session.mode === 'guest') {
      const transactionIds = new Set(store.expenses.map((item) => item.id));
      const templateIds = new Set(store.templates.map((item) => item.id));
      store.expenses.push(...expenses.filter((item) => !transactionIds.has(item.id)));
      store.templates.push(...templates.filter((item) => !templateIds.has(item.id)));
      if (parsed.settings?.budget) store.settings.budget = Number(parsed.settings.budget);
      persistGuest();
    } else {
      for (const item of expenses) await transactionApi.createTransaction(transactionPayload(item));
      for (const item of templates) await recurringApi.createRecurring(templatePayload(item));
      if (parsed.settings?.budget) await budgetApi.createBudget({ category: 'Overall', limit: Number(parsed.settings.budget), month: currentMonth() });
    }
    await loadData();
    toast(`Imported ${expenses.length} transactions`);
  } catch (error) {
    toast(error.message || 'Could not import this file');
  } finally {
    elements.importFile.value = '';
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  elements.themeIcon.className = dark ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
  renderCharts();
}

function clearFilters() {
  elements.search.value = '';
  elements.filterType.value = 'all';
  elements.filterCategory.value = 'all';
  elements.filterStart.value = '';
  elements.filterEnd.value = '';
  renderAll();
  toast('Filters cleared');
}

function bindEvents() {
  elements.theme.addEventListener('click', toggleTheme);
  elements.save.addEventListener('click', saveTransaction);
  $('btn-cancel').addEventListener('click', clearForm);
  $('btn-budget-set').addEventListener('click', setBudget);
  $('btn-clear-all').addEventListener('click', clearAll);
  $('btn-export-csv').addEventListener('click', exportCsv);
  $('btn-export-json').addEventListener('click', exportJson);
  elements.importFile.addEventListener('change', () => elements.importFile.files[0] && importJson(elements.importFile.files[0]));
  $('btn-filter-apply').addEventListener('click', () => { renderAll(); toast('Filter applied'); });
  $('btn-filter-clear').addEventListener('click', clearFilters);
  elements.search.addEventListener('input', renderAll);
  $('btn-signup').addEventListener('click', () => authenticate('register'));
  $('btn-login').addEventListener('click', () => authenticate('login'));
  $('btn-guest').addEventListener('click', useGuest);
  $('btn-close-login').addEventListener('click', () => showLogin(false));
  elements.modal.addEventListener('click', (event) => { if (event.target === elements.modal) showLogin(false); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') showLogin(false); });
}

async function initialize() {
  bindEvents();
  clearForm();
  elements.filterEnd.value = todayISO();
  if (localStorage.getItem(THEME_KEY) === 'dark') {
    document.body.classList.add('dark');
    elements.themeIcon.className = 'fa-regular fa-sun';
  }
  const token = localStorage.getItem('expenseToken');
  if (token) {
    try {
      session = { mode: 'user', user: await authApi.getMe() };
    } catch {
      localStorage.removeItem('expenseToken');
    }
  }
  renderUserArea();
  try {
    await loadData();
  } catch (error) {
    if (session.mode === 'user') {
      localStorage.removeItem('expenseToken');
      session = { mode: 'guest', user: { username: 'Guest' } };
      renderUserArea();
      await loadData();
      toast('Server unavailable. Continuing in guest mode.');
    } else {
      toast(error.message);
    }
  }
}

initialize();
