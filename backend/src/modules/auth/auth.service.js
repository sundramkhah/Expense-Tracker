import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';
import { createUser, findByUsername } from './auth.repository.js';

const publicUser = ({ id, username, createdAt }) => ({ id, username, createdAt });
const createToken = (user) => jwt.sign({ id: user.id, username: user.username }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export async function register(input) {
  if (await findByUsername(input.username)) throw new ApiError(409, 'Username is already taken');
  const user = await createUser({ username: input.username, password: await bcrypt.hash(input.password, 10) });
  return { user: publicUser(user), token: createToken(user) };
}

export async function login(input) {
  const user = await findByUsername(input.username);
  if (!user || !(await bcrypt.compare(input.password, user.password))) {
    throw new ApiError(401, 'Invalid username or password');
  }
  return { user: publicUser(user), token: createToken(user) };
}
