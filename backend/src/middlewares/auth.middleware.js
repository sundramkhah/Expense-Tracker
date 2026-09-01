import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';
import asyncHandler from '../utils/asyncHandler.js';

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'No token provided');
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7), env.jwtSecret);
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
});

export default authMiddleware;
