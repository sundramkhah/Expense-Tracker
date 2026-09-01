import ApiResponse from '../../utils/ApiResponse.js';
import * as service from './budget.service.js';

export async function list(req, res) {
  res.json(new ApiResponse(200, await service.listBudgets(req.user.id, req.query.month)));
}
export async function create(req, res) {
  res.status(201).json(new ApiResponse(201, await service.createBudget(req.user.id, req.body), 'Budget saved'));
}
export async function update(req, res) {
  res.json(new ApiResponse(200, await service.updateBudget(req.user.id, req.params.id, req.body), 'Budget updated'));
}
export async function remove(req, res) {
  await service.deleteBudget(req.user.id, req.params.id);
  res.json(new ApiResponse(200, null, 'Budget deleted'));
}
