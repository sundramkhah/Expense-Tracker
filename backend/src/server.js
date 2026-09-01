import app from './app.js';
import env from './config/env.js';
import { initializeStore } from './utils/store.js';

await initializeStore();

const server = app.listen(env.port, () => {
  console.log(`Expense Tracker running at http://localhost:${env.port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
