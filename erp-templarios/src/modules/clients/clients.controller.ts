import { Request, Response, NextFunction } from 'express';
import ClientsService from './clients.service';
import { successResponse } from '../../core/utils/response.util';
import { ValidationError } from '../../core/middleware/error.middleware';

class ClientsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const hasCredit = req.query.hasCredit === 'true' ? true : req.query.hasCredit === 'false' ? false : undefined;
      const isActive = req.query.isActive === 'false' ? false : true;

      const result = await ClientsService.getAll({
        page,
        limit,
        search,
        hasCredit,
        isActive,
      });

      successResponse(res, result, 'Clientes obtenidos correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const client = await ClientsService.getById(id);
      successResponse(res, client, 'Cliente obtenido correctamente');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;
      const client = await ClientsService.create(data);
      successResponse(res, client, 'Cliente creado correctamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const data = req.body;
      const client = await ClientsService.update(id, data);
      successResponse(res, client, 'Cliente actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await ClientsService.delete(id);
      successResponse(res, result, 'Cliente desactivado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await ClientsService.restore(id);
      successResponse(res, result, 'Cliente reactivado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getCreditStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await ClientsService.getCreditStatus(id);
      successResponse(res, result, 'Estado de crédito obtenido correctamente');
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

      const clients = await ClientsService.search(query, limit);
      successResponse(res, clients, 'Búsqueda completada');
    } catch (error) {
      next(error);
    }
  }
}

export default new ClientsController();
