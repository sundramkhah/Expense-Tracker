import dotenv from 'dotenv';

dotenv.config();

export default {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'local-expense-tracker-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
