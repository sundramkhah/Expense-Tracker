# Expense Tracker

A simple full-stack expense tracker with the original Pro Expense Tracker dashboard, guest mode, optional user accounts, transactions, monthly budgets, recurring items, filters, charts, and import/export.

## Run locally

1. Open a terminal in `backend`.
2. Run `npm install` if dependencies are not installed.
3. Run `npm start`.
4. Open `http://localhost:5000`.

Guest data stays in the browser. Signed-in account data uses the REST API and is stored locally in `backend/data/store.json`. Copy `.env.example` to `.env` to customize the port or JWT secret.
