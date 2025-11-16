/* -------------------------
   Utilities & Data storage
   ------------------------- */
const USER_KEY = 'ex_users_v1';
const SESSION_KEY = 'ex_session_v1';
const DATA_PREFIX = 'ex_data_v1_';
const THEME_KEY = 'ex_theme';

/* DOM elements */
const btnTheme = document.getElementById('btn-theme');
const themeIcon = document.getElementById('theme-icon');
const userArea = document.getElementById('user-area');
const loginModal = document.getElementById('login-modal');
const authUser = document.getElementById('auth-username');
const authPass = document.getElementById('auth-password');
const btnSignup = document.getElementById('btn-signup');
const btnLogin = document.getElementById('btn-login');

const txType = document.getElementById('tx-type');
const txCategory = document.getElementById('tx-category');
const txAmount = document.getElementById('tx-amount');
const txDate = document.getElementById('tx-date');
const txNotes = document.getElementById('tx-notes');
const txRecurring = document.getElementById('tx-recurring');
const btnSave = document.getElementById('btn-save');
const btnCancel = document.getElementById('btn-cancel');
const btnExportCSV = document.getElementById('btn-export-csv');
const btnExportJSON = document.getElementById('btn-export-json');
const importFile = document.getElementById('import-file');
const btnClearAll = document.getElementById('btn-clear-all');

const summaryBalance = document.getElementById('sum-balance');
const summaryIncome = document.getElementById('sum-income');
const summaryExpense = document.getElementById('sum-expense');
const budgetAmountEl = document.getElementById('budget-amount');
const budgetInput = document.getElementById('budget-input');
const btnBudgetSet = document.getElementById('btn-budget-set');
const budgetBar = document.getElementById('budget-bar');
const budgetUsed = document.getElementById('budget-used');

const searchInput = document.getElementById('search-input');
const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');
const filterStart = document.getElementById('filter-start');
const filterEnd = document.getElementById('filter-end');
const btnFilterApply = document.getElementById('btn-filter-apply');
const btnFilterClear = document.getElementById('btn-filter-clear');

const recentList = document.getElementById('recent-list');
const txnTableBody = document.getElementById('txn-table-body');

const toastEl = document.getElementById('toast');
let toastTimeout = null;

let lineChart = null, pieChart = null;

/* Per-user runtime state */
let currentUser = null;
let store = { expenses: [], templates: [], settings: { budget: 0 } };
let editingId = null;

/* Helpers */
function toast(msg, time = 2200) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastEl.classList.remove('show'), time);
}

function uid(prefix = 'id') {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function monthKeyFromDateString(s) { if (!s) return null; return s.slice(0, 7); }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

/* -------------------------
   Authentication (localStorage)
   ------------------------- */
function loadUsers() { try { return JSON.parse(localStorage.getItem(USER_KEY) || '{}'); } catch (e) { return {}; } }
function saveUsers(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }

function showLogin(show = true) {
    loginModal.style.display = show ? 'flex' : 'none';
    if (show) { authUser.value = ''; authPass.value = ''; }
}

// single, authoritative setSession - updates UI immediately
function setSession(username) {
    if (!username) return;
    localStorage.setItem(SESSION_KEY, username);
    currentUser = username;
    renderAfterLogin();
    renderUserArea();
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    currentUser = null;
    store = { expenses: [], templates: [], settings: { budget: 0 } };
    renderUserArea();
    showLogin(true);
}

/* sign up logic */
btnSignup.addEventListener('click', () => {
    const u = (authUser.value || '').trim();
    const p = (authPass.value || '').trim();
    if (!u || !p) { toast('Enter username & password'); return; }
    const users = loadUsers();
    if (users[u]) { toast('Username already exists'); return; }
    users[u] = p;
    saveUsers(users);
    toast('Account created. Logged in.');
    setSession(u);
    showLogin(false);
});

/* login */
btnLogin.addEventListener('click', () => {
    const u = (authUser.value || '').trim();
    const p = (authPass.value || '').trim();
    if (!u || !p) { toast('Enter username & password'); return; }
    const users = loadUsers();
    if (users[u] && users[u] === p) {
        toast('Logged in');
        setSession(u);
        showLogin(false);
    } else {
        toast('Invalid credentials');
    }
});

/* render user area (login/logout) */
function renderUserArea() {
    const s = localStorage.getItem(SESSION_KEY);
    currentUser = s || currentUser;
    if (currentUser) {
        userArea.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
      <div style="font-weight:700">${currentUser}</div>
      <button id="btn-logout" class="btn small btn-ghost">Logout</button>
    </div>`;
        document.getElementById('btn-logout').addEventListener('click', () => { clearSession(); toast('Logged out'); });
        // hide login if it was open
        showLogin(false);
    } else {
        userArea.innerHTML = <button id="btn-open-login" class="btn small btn-primary">Login / Sign up</button>;
        document.getElementById('btn-open-login').addEventListener('click', () => showLogin(true));
        // keep modal hidden until user asks
        showLogin(false);
    }
}

/* -------------------------
   Data persistence per user
   ------------------------- */
function userDataKey(username) { return DATA_PREFIX + username; }

function loadUserData() {
    if (!currentUser) return;
    try {
        const raw = localStorage.getItem(userDataKey(currentUser));
        const d = raw ? JSON.parse(raw) : null;
        if (d && typeof d === 'object') {
            store = {
                expenses: Array.isArray(d.expenses) ? d.expenses : [],
                templates: Array.isArray(d.templates) ? d.templates : [],
                settings: d.settings || { budget: 0 }
            };
        } else {
            store = { expenses: [], templates: [], settings: { budget: 0 } };
        }
    } catch (e) {
        store = { expenses: [], templates: [], settings: { budget: 0 } };
    }
    store.expenses = store.expenses.map(e => ({ ...e, amount: Number(e.amount) }));
    processRecurringTemplates();
    persist();
    renderAll();
}

function persist() {
    if (!currentUser) return;
    localStorage.setItem(userDataKey(currentUser), JSON.stringify(store));
}

/* -------------------------
   Recurring templates
   ------------------------- */
function processRecurringTemplates() {
    const nowMonth = (new Date()).toISOString().slice(0, 7);
    const toAdd = [];
    store.templates.forEach(t => {
        if (t.recurrence === 'monthly') {
            const exists = store.expenses.some(e => e.templateId === t.id && monthKeyFromDateString(e.date) === nowMonth);
            if (!exists) {
                const day = t.startDay || t.date?.slice(8, 10) || (new Date()).toISOString().slice(8, 10);
                const year = nowMonth.slice(0, 4);
                const month = nowMonth.slice(5, 7);
                let dayNum = parseInt(day, 10);
                if (isNaN(dayNum) || dayNum < 1) dayNum = 1;
                const d = new Date(year, parseInt(month, 10) - 1, dayNum);
                const genDate = d.toISOString().slice(0, 10);
                const newTxn = {
                    id: uid('txn'),
                    templateId: t.id,
                    category: t.category,
                    type: t.type,
                    amount: Number(t.amount),
                    date: genDate,
                    notes: t.notes || Recurring: ${ t.recurrence },
                    createdFromTemplate: true
            };
            toAdd.push(newTxn);
        }
    }
  });
if (toAdd.length) store.expenses.push(...toAdd);
}

/* -------------------------
   Add / Edit / Delete transactions
   ------------------------- */
function addTransactionFromForm() {
    const type = txType.value;
    const category = txCategory.value;
    const amount = Number(txAmount.value);
    const date = txDate.value;
    const notes = txNotes.value.trim();
    const recurrence = txRecurring.value;

    if (!amount || amount <= 0 || !date || !category) {
        toast('Please enter valid amount, date and category');
        return;
    }

    if (editingId) {
        const idx = store.expenses.findIndex(e => e.id === editingId);
        if (idx !== -1) {
            store.expenses[idx] = { ...store.expenses[idx], type, category, amount: Number(amount), date, notes };
            toast('Updated transaction');
        }
        editingId = null;
        document.getElementById('form-title').textContent = 'Add Transaction';
        btnSave.textContent = 'Add';
    } else {
        const txn = { id: uid('txn'), category, type, amount: Number(amount), date, notes };
        store.expenses.push(txn);
        toast('Added transaction');
        if (recurrence !== 'none') {
            const tpl = {
                id: uid('tpl'),
                category, type, amount: Number(amount),
                recurrence, startDay: Number(date.slice(8, 10)), date, notes
            };
            store.templates.push(tpl);
            toast('Recurring template created (monthly)');
        }
    }

    persist();
    renderAll();
    clearForm();
}

function clearForm() {
    txAmount.value = '';
    txDate.value = todayISO();
    txNotes.value = '';
    txRecurring.value = 'none';
    txCategory.selectedIndex = 0;
    txType.value = 'Expense';
    editingId = null;
    document.getElementById('form-title').textContent = 'Add Transaction';
    btnSave.textContent = 'Add';
}

function startEdit(id) {
    const t = store.expenses.find(x => x.id === id);
    if (!t) return;
    editingId = id;
    txType.value = t.type || 'Expense';
    txCategory.value = t.category || '';
    txAmount.value = t.amount;
    txDate.value = t.date;
    txNotes.value = t.notes || '';
    document.getElementById('form-title').textContent = 'Edit Transaction';
    btnSave.textContent = 'Save';
}

function deleteTxn(id) {
    if (!confirm('Delete this transaction?')) return;
    store.expenses = store.expenses.filter(e => e.id !== id);
    persist();
    renderAll();
    toast('Deleted');
}

btnClearAll.addEventListener('click', () => {
    if (!currentUser) return toast('Login first');
    if (!confirm('Delete ALL transactions and templates?')) return;
    store.expenses = [];
    store.templates = [];
    persist();
    renderAll();
    toast('All cleared');
});

/* -------------------------
   Filters / Search
   ------------------------- */
function getFilteredTransactions() {
    let list = [...store.expenses];
    const start = filterStart.value || null;
    const end = filterEnd.value || null;
    if (start) {
        const s = new Date(start);
        list = list.filter(e => new Date(e.date) >= s);
    }
    if (end) {
        const eDate = new Date(end); eDate.setHours(23, 59, 59, 999);
        list = list.filter(e => new Date(e.date) <= eDate);
    }
    const type = filterType.value;
    if (type && type !== 'all') list = list.filter(e => e.type === type);
    const cat = filterCategory.value;
    if (cat && cat !== 'all') list = list.filter(e => e.category === cat);
    const q = (searchInput.value || '').trim().toLowerCase();
    if (q) list = list.filter(e => (e.notes || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q));
    list.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id.localeCompare(a.id));
    return list;
}

/* -------------------------
   Charts & rendering
   ------------------------- */
function formatMoney(n) { return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function renderAll() {
    const now = new Date();
    const curMonthKey = now.toISOString().slice(0, 7);
    let income = 0, expense = 0;
    store.expenses.forEach(e => {
        if (monthKeyFromDateString(e.date) === curMonthKey) {
            if (e.type === 'Income') income += Number(e.amount);
            else expense += Number(e.amount);
        }
    });
    const balance = income - expense;
    summaryIncome.textContent = '₹' + formatMoney(income);
    summaryExpense.textContent = '₹' + formatMoney(expense);
    summaryBalance.textContent = '₹' + formatMoney(balance);

    const budget = Number(store.settings?.budget || 0);
    budgetAmountEl.textContent = budget ? '₹' + formatMoney(budget) : '₹0.00';
    const usedPercent = budget ? Math.round((expense / budget) * 100) : 0;
    const clamped = clamp(usedPercent, 0, 999);
    budgetBar.style.width = (clamped > 100 ? 100 : clamped) + '%';
    budgetUsed.textContent = (clamped > 100 ? '>100' : clamped) + '%';

    if (budget > 0 && usedPercent >= 100) {
        toast('Budget exceeded for this month!', 3500);
    } else if (budget > 0 && usedPercent >= 80) {
        toast('Budget usage at 80%+', 2500);
    }

    renderRecent();
    renderTable();
    renderCharts();
}

function renderRecent() {
    const filtered = getFilteredTransactions();
    const recent = filtered.slice(0, 10);
    recentList.innerHTML = '';
    recent.forEach(tx => {
        const div = document.createElement('div');
        div.className = 'recent-item';
        const iconBg = tx.type === 'Income' ? 'var(--recent-inc-bg)' : 'var(--recent-exp-bg)';
        const amountColor = tx.type === 'Income' ? '#0f5132' : '#b91c1c';
        div.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center">
        <div style="width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${iconBg}">
          <div style="font-weight:700;color:var(--text)">${(tx.category || 'C')[0]}</div>
        </div>
        <div>
          <div style="font-weight:600">${tx.category} <span class="muted small">· ${tx.notes || ''}</span></div>
          <div class="muted small">${new Date(tx.date).toLocaleDateString()}</div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;color:${amountColor}">₹${formatMoney(tx.amount)}</div>
        <div class="txn-actions" style="margin-top:6px">
          <button class="btn small btn-ghost" onclick="startEdit('${tx.id}')">Edit</button>
          <button class="btn small" style="background:#fee2e2;color:#b91c1c" onclick="deleteTxn('${tx.id}')">Delete</button>
        </div>
      </div>
    `;
        recentList.appendChild(div);
    });
}

function renderTable() {
    const list = getFilteredTransactions();
    txnTableBody.innerHTML = '';
    list.forEach(tx => {
        const tr = document.createElement('tr'); tr.className = 'txn-row';
        const badgeBg = tx.type === 'Income' ? 'var(--recent-inc-bg)' : 'var(--recent-exp-bg)';
        const amountColor = tx.type === 'Income' ? '#0f5132' : '#b91c1c';
        const catTd = document.createElement('td'); catTd.innerHTML = <span class="badge" style="background:${badgeBg};color:var(--text);padding:6px;border-radius:8px">${tx.category}</span>;
        const notesTd = document.createElement('td'); notesTd.textContent = tx.notes || '';
        const amtTd = document.createElement('td'); amtTd.innerHTML = <strong style="color:${amountColor}">₹${formatMoney(tx.amount)}</strong>;
        const dateTd = document.createElement('td'); dateTd.textContent = new Date(tx.date).toLocaleDateString();
        const actTd = document.createElement('td'); actTd.innerHTML = `
      <button class="btn small btn-ghost" onclick="startEdit('${tx.id}')"><i class="fa-regular fa-pen-to-square"></i></button>
      <button class="btn small" style="background:#fee2e2;color:#b91c1c" onclick="deleteTxn('${tx.id}')"><i class="fa-regular fa-trash-can"></i></button>
    `;
        tr.appendChild(catTd); tr.appendChild(notesTd); tr.appendChild(amtTd); tr.appendChild(dateTd); tr.appendChild(actTd);
        txnTableBody.appendChild(tr);
    });
}

function renderCharts() {
    const isDark = document.body.classList.contains('dark');
    const legendColor = isDark ? '#f1f5f9' : '#475569';
    const gridColor = isDark ? 'rgba(241,245,249,0.15)' : 'rgba(15,23,32,0.1)';

    const filtered = getFilteredTransactions();
    const expenseByCat = {};
    filtered.forEach(t => { if (t.type === 'Expense') expenseByCat[t.category] = (expenseByCat[t.category] || 0) + Number(t.amount); });
    const pieLabels = Object.keys(expenseByCat);
    const pieData = pieLabels.map(l => expenseByCat[l]);

    if (pieChart) { pieChart.destroy(); pieChart = null; }
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    if (pieLabels.length) {
        pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: { labels: pieLabels, datasets: [{ data: pieData, backgroundColor: generatePalette(pieLabels.length) }] },
            options: { plugins: { legend: { position: 'right', labels: { color: legendColor } } } }
        });
    } else {
        pieCtx.clearRect(0, 0, 420, 300);
        pieCtx.font = '14px Inter';
        pieCtx.fillStyle = '#94a3b8';
        pieCtx.fillText('No expense data to display (select filters/add expenses).', 12, 140);
    }

    const months = lastNMonthKeys(6);
    const incomeSeries = [], expenseSeries = [];
    months.forEach(mk => {
        let inc = 0, exp = 0;
        store.expenses.forEach(e => {
            if (monthKeyFromDateString(e.date) === mk) {
                if (e.type === 'Income') inc += Number(e.amount);
                else exp += Number(e.amount);
            }
        });
        incomeSeries.push(inc); expenseSeries.push(exp);
    });

    if (lineChart) { lineChart.destroy(); lineChart = null; }
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: months.map(k => { const [y, m] = k.split('-'); return new Date(y, m - 1, 1).toLocaleString(undefined, { month: 'short', year: 'numeric' }); }),
            datasets: [
                { label: 'Income', data: incomeSeries, fill: false, borderColor: '#43a047', tension: 0.25 },
                { label: 'Expense', data: expenseSeries, fill: false, borderColor: '#ef4444', tension: 0.25 }
            ]
        },
        options: {
            plugins: { legend: { position: 'top', labels: { color: legendColor } } },
            scales: {
                x: { ticks: { color: legendColor }, grid: { color: gridColor } },
                y: { ticks: { color: legendColor }, grid: { color: gridColor } }
            }
        }
    });
}

/* -------------------------
   Exports / Import
   ------------------------- */
function exportCSV() {
    const list = store.expenses.map(e => ({ id: e.id, date: e.date, type: e.type, category: e.category, amount: e.amount, notes: e.notes || '', templateId: e.templateId || '' }));
    const header = ['id', 'date', 'type', 'category', 'amount', 'notes', 'templateId'];
    const rows = [header.join(',')].concat(list.map(r => header.map(h => JSON.stringify(r[h] ?? '')).join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (currentUser || 'data') + '_transactions.csv'; a.click();
}

function exportJSON() {
    const data = { expenses: store.expenses, templates: store.templates, settings: store.settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (currentUser || 'data') + '_export.json'; a.click();
}

importFile.addEventListener('change', (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            if (parsed.expenses && Array.isArray(parsed.expenses)) {
                const existingIds = new Set(store.expenses.map(x => x.id));
                const toAdd = parsed.expenses.filter(x => !existingIds.has(x.id)).map(x => ({ ...x, amount: Number(x.amount) }));
                store.expenses.push(...toAdd);
                if (parsed.templates && Array.isArray(parsed.templates)) {
                    const existTplIds = new Set(store.templates.map(t => t.id));
                    const newTpls = parsed.templates.filter(t => !existTplIds.has(t.id));
                    store.templates.push(...newTpls);
                }
                if (parsed.settings) store.settings = parsed.settings;
                persist();
                renderAll();
                toast('Imported ' + toAdd.length + ' transactions');
            } else {
                toast('Invalid JSON structure');
            }
        } catch (err) {
            toast('Failed to parse file');
        }
    };
    reader.readAsText(f);
});

/* -------------------------
   Budget management
   ------------------------- */
btnBudgetSet.addEventListener('click', () => {
    const v = Number(budgetInput.value);
    if (!v || v <= 0) { toast('Enter a valid budget'); return; }
    store.settings.budget = Number(v);
    persist();
    renderAll();
    toast('Budget updated');
});

/* -------------------------
   Helpers & small util functions
   ------------------------- */
function lastNMonthKeys(n) {
    const out = []; const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        out.push(d.toISOString().slice(0, 7));
    }
    return out;
}

function generatePalette(n) {
    const base = ['#0288d1', '#4db6ac', '#ef4444', '#f59e0b', '#8e24aa', '#43a047', '#c2185b', '#6d4c41', '#00bcd4', '#ff7043'];
    if (n <= base.length) return base.slice(0, n);
    const out = [];
    for (let i = 0; i < n; i++) { const h = Math.floor(360 * (i / n)); out.push('hsl(' + h + ',70%,50%)'); }
    return out;
}

/* -------------------------
   Theme Toggle Implementation
   ------------------------- */
function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    themeIcon.className = isDark ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
    renderCharts();
}

function applyInitialTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    if (savedTheme === 'dark') { document.body.classList.add('dark'); themeIcon.className = 'fa-regular fa-sun'; }
    else { document.body.classList.remove('dark'); themeIcon.className = 'fa-regular fa-moon'; }
}

/* -------------------------
   Bindings & initialization
   ------------------------- */
btnTheme.addEventListener('click', toggleTheme);
btnSave.addEventListener('click', addTransactionFromForm);
btnCancel.addEventListener('click', clearForm);
btnFilterApply.addEventListener('click', () => { renderAll(); toast('Filter applied', 1200); });
btnFilterClear.addEventListener('click', () => { searchInput.value = ''; filterType.value = 'all'; filterCategory.value = 'all'; filterStart.value = ''; filterEnd.value = ''; renderAll(); toast('Filters cleared', 1200); });
btnExportCSV.addEventListener('click', exportCSV);
btnExportJSON.addEventListener('click', exportJSON);

/* Start defaults */
document.addEventListener('DOMContentLoaded', () => {
    applyInitialTheme();
    txDate.value = todayISO();
    filterEnd.value = todayISO();

    const sess = localStorage.getItem(SESSION_KEY);
    if (sess) {
        setSession(sess); // will render UI + load data
        showLogin(false);
    } else {
        renderUserArea(); // shows login button (modal hidden)
    }

    window.startEdit = startEdit;
    window.deleteTxn = deleteTxn;
});

/* -------------------------
   After-login helper
   ------------------------- */
function renderAfterLogin() {
    document.getElementById('logged-user').textContent = currentUser ? ('User: ' + currentUser) : '';
    loadUserData();
}

// Expose setSession safely to global if needed
window.setSession = setSession;

// Ensure initial render
renderUserArea();