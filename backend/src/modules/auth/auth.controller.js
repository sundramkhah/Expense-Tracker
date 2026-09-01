import ApiResponse from '../../utils/ApiResponse.js';
import * as authService from './auth.service.js';

export async function register(req, res) {
  res.status(201).json(new ApiResponse(201, await authService.register(req.body), 'Account created'));
}

export async function login(req, res) {
  res.json(new ApiResponse(200, await authService.login(req.body), 'Logged in'));
}

export function me(req, res) {
  res.json(new ApiResponse(200, req.user));
}
