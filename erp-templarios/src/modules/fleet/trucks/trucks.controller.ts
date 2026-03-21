import { Request, Response, NextFunction } from 'express';
import TrucksService from './trucks.service';
import { successResponse } from '../../../core/utils/response.util';
import { ValidationError } from '../../../core/middleware/error.middleware';

class TrucksController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const isActive = req.query.isActive === 'false' ? false : true;

      const result = await TrucksService.getAll({
        page,
        limit,
        search,
        status,
        isActive,
      });

      successResponse(res, result, 'Camiones obtenidos correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const truck = await TrucksService.getById(id);
      successResponse(res, truck, 'Camión obtenido correctamente');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;
      // Get company ID from authenticated user
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        throw new ValidationError('Empresa no encontrada para el usuario');
      }

      const truck = await TrucksService.create(data, companyId);
      successResponse(res, truck, 'Camión creado correctamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const data = req.body;
      const truck = await TrucksService.update(id, data);
      successResponse(res, truck, 'Camión actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await TrucksService.delete(id);
      successResponse(res, result, 'Camión desactivado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await TrucksService.restore(id);
      successResponse(res, result, 'Camión reactivado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async updateMileage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { mileage } = req.body;

      if (mileage === undefined || mileage < 0) {
        throw new ValidationError('Kilometraje inválido');
      }

      const truck = await TrucksService.updateMileage(id, mileage);
      successResponse(res, truck, 'Kilometraje actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getAvailable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dateStr = req.query.date as string;
      const date = dateStr ? new Date(dateStr) : undefined;

      const trucks = await TrucksService.getAvailable({ date });
      successResponse(res, trucks, 'Camiones disponibles obtenidos correctamente');
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

      const trucks = await TrucksService.search(query, limit);
      successResponse(res, trucks, 'Búsqueda completada');
    } catch (error) {
      next(error);
    }
  }
}

export default new TrucksController();
