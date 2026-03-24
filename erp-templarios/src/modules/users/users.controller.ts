import { Request, Response, NextFunction } from 'express';
import UsersService from './users.service';
import { successResponse, createdResponse, paginatedResponse } from '../../core/utils/response.util';

class UsersController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '10', search, status, roleId } = req.query;
      
      const result = await UsersService.getAll({
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        search: search as string,
        status: status as string,
        roleId: roleId as string,
      });

      paginatedResponse(
        res,
        result.users,
        result.total,
        result.page,
        result.limit,
        'Users retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = await UsersService.getById(id);
      successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req.user!;
      const userData = req.body;
      const user = await UsersService.create(userData, currentUser.userId);
      createdResponse(res, user, 'User created successfully. An email with credentials has been sent.');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const currentUser = req.user!;
      const updateData = req.body;
      const user = await UsersService.update(id, updateData, currentUser.userId);
      successResponse(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const currentUser = req.user!;
      await UsersService.delete(id, currentUser.userId);
      successResponse(res, null, 'User deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  async assignRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { roleIds } = req.body;
      const currentUser = req.user!;
      const user = await UsersService.assignRoles(id, roleIds, currentUser.userId);
      successResponse(res, user, 'Roles assigned successfully');
    } catch (error) {
      next(error);
    }
  }

  async getUserPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const permissions = await UsersService.getUserPermissions(id);
      successResponse(res, permissions, 'User permissions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async resendInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await UsersService.resendInvitation(id);
      successResponse(res, null, 'Invitation email sent successfully');
    } catch (error) {
      next(error);
    }
  }

  async unlockAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await UsersService.unlockAccount(id);
      successResponse(res, null, 'Account unlocked successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new UsersController();
