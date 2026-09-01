import ApiResponse from '../../utils/ApiResponse.js';
import * as service from './transaction.service.js';

export async function list(req, res) {
  res.json(new ApiResponse(200, await service.listTransactions(req.user.id, req.query)));
}
export async function get(req, res) {
  res.json(new ApiResponse(200, await service.getTransaction(req.user.id, req.params.id)));
}
export async function create(req, res) {
  res.status(201).json(new ApiResponse(201, await service.createTransaction(req.user.id, req.body), 'Transaction added'));
}
export async function update(req, res) {
  res.json(new ApiResponse(200, await service.updateTransaction(req.user.id, req.params.id, req.body), 'Transaction updated'));
}
export async function remove(req, res) {
  await service.deleteTransaction(req.user.id, req.params.id);
  res.json(new ApiResponse(200, null, 'Transaction deleted'));
}
