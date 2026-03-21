import { Request, Response, NextFunction } from 'express';
import PermissionsService from './permissions.service';
import { successResponse } from '../../core/utils/response.util';

class PermissionsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const module = req.query.module as string | undefined;
      const permissions = await PermissionsService.getAll(module);
      successResponse(res, permissions, 'Permissions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getByModule(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await PermissionsService.getByModule();
      successResponse(res, permissions, 'Permissions grouped by module');
    } catch (error) {
      next(error);
    }
  }
}

export default new PermissionsController();
