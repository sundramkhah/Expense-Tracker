import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import notFoundMiddleware from './middlewares/notFound.middleware.js';
import errorMiddleware from './middlewares/error.middleware.js';

const app = express();
const frontendPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend');

app.use(cors());
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Expense Tracker API is running' }));
app.use('/api', routes);
app.use(express.static(frontendPath));
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
