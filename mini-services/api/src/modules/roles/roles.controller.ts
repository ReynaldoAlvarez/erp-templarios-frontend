import { Request, Response, NextFunction } from 'express';
import RolesService from './roles.service';
import { successResponse, createdResponse } from '../../core/utils/response.util';

class RolesController {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await RolesService.getAll();
      successResponse(res, roles, 'Roles retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const role = await RolesService.getById(id);
      successResponse(res, role, 'Role retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleData = req.body;
      const role = await RolesService.create(roleData);
      createdResponse(res, role, 'Role created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const roleData = req.body;
      const role = await RolesService.update(id, roleData);
      successResponse(res, role, 'Role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await RolesService.delete(id);
      successResponse(res, null, 'Role deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async assignPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { permissionIds } = req.body;
      const role = await RolesService.assignPermissions(id, permissionIds);
      successResponse(res, role, 'Permissions assigned successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new RolesController();
