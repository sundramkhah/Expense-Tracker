import ApiResponse from '../../utils/ApiResponse.js';
import { getDashboard } from './dashboard.service.js';

export async function dashboard(req, res) {
  res.json(new ApiResponse(200, await getDashboard(req.user.id, req.query.month)));
}
