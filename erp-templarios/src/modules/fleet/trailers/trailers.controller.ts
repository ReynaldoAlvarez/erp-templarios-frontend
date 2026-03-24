import { Request, Response, NextFunction } from 'express';
import TrailersService from './trailers.service';
import { successResponse } from '../../../core/utils/response.util';
import { ValidationError } from '../../../core/middleware/error.middleware';

class TrailersController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const isActive = req.query.isActive === 'false' ? false : true;
      const truckId = req.query.truckId as string;

      const result = await TrailersService.getAll({
        page,
        limit,
        search,
        isActive,
        truckId,
      });

      successResponse(res, result, 'Remolques obtenidos correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const trailer = await TrailersService.getById(id);
      successResponse(res, trailer, 'Remolque obtenido correctamente');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;
      const trailer = await TrailersService.create(data);
      successResponse(res, trailer, 'Remolque creado correctamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const data = req.body;
      const trailer = await TrailersService.update(id, data);
      successResponse(res, trailer, 'Remolque actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await TrailersService.delete(id);
      successResponse(res, result, 'Remolque desactivado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await TrailersService.restore(id);
      successResponse(res, result, 'Remolque reactivado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async assignToTruck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { truckId } = req.body;

      const trailer = await TrailersService.assignToTruck(id, truckId || null);
      successResponse(res, trailer, 'Remolque asignado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getAvailable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trailers = await TrailersService.getAvailable();
      successResponse(res, trailers, 'Remolques disponibles obtenidos correctamente');
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

      const trailers = await TrailersService.search(query, limit);
      successResponse(res, trailers, 'Búsqueda completada');
    } catch (error) {
      next(error);
    }
  }
}

export default new TrailersController();
