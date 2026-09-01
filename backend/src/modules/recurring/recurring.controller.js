import ApiResponse from '../../utils/ApiResponse.js';
import * as service from './recurring.service.js';

export async function list(req, res) { res.json(new ApiResponse(200, await service.listRecurring(req.user.id))); }
export async function create(req, res) { res.status(201).json(new ApiResponse(201, await service.createRecurring(req.user.id, req.body), 'Recurring item added')); }
export async function update(req, res) { res.json(new ApiResponse(200, await service.updateRecurring(req.user.id, req.params.id, req.body), 'Recurring item updated')); }
export async function remove(req, res) {
  await service.deleteRecurring(req.user.id, req.params.id);
  res.json(new ApiResponse(200, null, 'Recurring item deleted'));
}
