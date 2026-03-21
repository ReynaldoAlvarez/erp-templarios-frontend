import { Request, Response, NextFunction } from 'express';
import BLService from './bl.service';
import { successResponse } from '../../core/utils/response.util';
import { ValidationError } from '../../core/middleware/error.middleware';

class BLController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const clientId = req.query.clientId as string;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      const result = await BLService.getAll({
        page,
        limit,
        search,
        status,
        clientId,
        dateFrom,
        dateTo,
      });

      successResponse(res, result, 'Bills of Lading obtenidos correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const bl = await BLService.getById(id);
      successResponse(res, bl, 'Bill of Lading obtenido correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const blNumber = req.params.blNumber as string;
      const bl = await BLService.getByNumber(blNumber);
      successResponse(res, bl, 'Bill of Lading obtenido correctamente');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;
      const userId = req.user?.userId!;

      const bl = await BLService.create(data, userId);
      successResponse(res, bl, 'Bill of Lading creado correctamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const data = req.body;
      const userId = req.user?.userId!;

      const bl = await BLService.update(id, data, userId);
      successResponse(res, bl, 'Bill of Lading actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId!;

      const bl = await BLService.approve(id, userId);
      successResponse(res, bl, 'Bill of Lading aprobado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const userId = req.user?.userId!;

      if (!reason) {
        throw new ValidationError('La razón de cancelación es requerida');
      }

      const bl = await BLService.cancel(id, reason, userId);
      successResponse(res, bl, 'Bill of Lading cancelado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getProgressReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const report = await BLService.getProgressReport(id);
      successResponse(res, report, 'Reporte de progreso obtenido correctamente');
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

      const bls = await BLService.search(query, limit);
      successResponse(res, bls, 'Búsqueda completada');
    } catch (error) {
      next(error);
    }
  }
}

export default new BLController();
