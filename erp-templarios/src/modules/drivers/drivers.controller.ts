import { Request, Response, NextFunction } from 'express';
import DriversService from './drivers.service';
import { successResponse } from '../../core/utils/response.util';
import { ValidationError } from '../../core/middleware/error.middleware';
import { ContractType } from '@prisma/client';

class DriversController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const isAvailable = req.query.isAvailable === 'true' ? true : req.query.isAvailable === 'false' ? false : undefined;
      const isActive = req.query.isActive === 'false' ? false : true;
      const contractType = req.query.contractType as ContractType | undefined;

      const result = await DriversService.getAll({
        page,
        limit,
        search,
        isAvailable,
        isActive,
        contractType,
      });

      successResponse(res, result, 'Conductores obtenidos correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const driver = await DriversService.getById(id);
      successResponse(res, driver, 'Conductor obtenido correctamente');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;
      const companyId = req.user?.companyId;
      const branchId = req.body.branchId;

      if (!companyId) {
        throw new ValidationError('Empresa no encontrada para el usuario');
      }

      const driver = await DriversService.create(data, companyId, branchId);
      successResponse(res, driver, 'Conductor creado correctamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const data = req.body;
      const driver = await DriversService.update(id, data);
      successResponse(res, driver, 'Conductor actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await DriversService.delete(id);
      successResponse(res, result, 'Conductor desactivado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await DriversService.restore(id);
      successResponse(res, result, 'Conductor reactivado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async setAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { isAvailable } = req.body;

      if (typeof isAvailable !== 'boolean') {
        throw new ValidationError('isAvailable debe ser true o false');
      }

      const driver = await DriversService.setAvailability(id, isAvailable);
      successResponse(res, driver, 'Disponibilidad actualizada correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getAvailable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const drivers = await DriversService.getAvailable();
      successResponse(res, drivers, 'Conductores disponibles obtenidos correctamente');
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!query || query.length < 2) {
        throw new ValidationError('La búsqueda debe tener al menos 2 caracteres');
      }

      const drivers = await DriversService.search(query, limit);
      successResponse(res, drivers, 'Búsqueda completada');
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const stats = await DriversService.getDriverStats(id);
      successResponse(res, stats, 'Estadísticas obtenidas correctamente');
    } catch (error) {
      next(error);
    }
  }
}

export default new DriversController();
