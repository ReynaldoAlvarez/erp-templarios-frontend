import { Request, Response, NextFunction } from 'express';
import ExpensesService from './expenses.service';
import { successResponse } from '../../core/utils/response.util';
import { ExpenseCategory } from '@prisma/client';

class ExpensesController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const driverId = req.query.driverId as string;
      const tripId = req.query.tripId as string;
      const category = req.query.category as ExpenseCategory | undefined;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      const result = await ExpensesService.getAll({
        page,
        limit,
        search,
        driverId,
        tripId,
        category,
        dateFrom,
        dateTo,
      });

      successResponse(res, result, 'Gastos obtenidos correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const expense = await ExpensesService.getById(id);
      successResponse(res, expense, 'Gasto obtenido correctamente');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;
      const expense = await ExpensesService.create(data);
      successResponse(res, expense, 'Gasto registrado correctamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const data = req.body;
      const expense = await ExpensesService.update(id, data);
      successResponse(res, expense, 'Gasto actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await ExpensesService.delete(id);
      successResponse(res, result, 'Gasto eliminado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getByDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.params.driverId as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await ExpensesService.getByDriver(driverId, { limit });
      successResponse(res, result, 'Gastos del conductor obtenidos correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getByTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tripId = req.params.tripId as string;
      const result = await ExpensesService.getByTrip(tripId);
      successResponse(res, result, 'Gastos del viaje obtenidos correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const driverId = req.query.driverId as string;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      const stats = await ExpensesService.getStats({ driverId, dateFrom, dateTo });
      successResponse(res, stats, 'Estadísticas de gastos obtenidas correctamente');
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await ExpensesService.getCategories();
      successResponse(res, categories, 'Categorías obtenidas correctamente');
    } catch (error) {
      next(error);
    }
  }
}

export default new ExpensesController();
