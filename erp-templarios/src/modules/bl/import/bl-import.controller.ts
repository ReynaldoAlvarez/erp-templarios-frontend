import { Request, Response, NextFunction } from 'express';
import BLImportService from './bl-import.service';
import { successResponse } from '../../../core/utils/response.util';
import { ValidationError } from '../../../core/middleware/error.middleware';

class BLImportController {
  async importFromJSON(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;
      const userId = req.user?.userId!;

      // Validate data
      const validation = BLImportService.validateImportData(data);
      if (!validation.valid) {
        throw new ValidationError(validation.errors.join('; '));
      }

      const result = await BLImportService.importFromJSON(data, userId);
      successResponse(res, result, 'Importación completada', 201);
    } catch (error) {
      next(error);
    }
  }

  async getTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = BLImportService.getImportTemplate();
      successResponse(res, template, 'Plantilla obtenida correctamente');
    } catch (error) {
      next(error);
    }
  }
}

export default new BLImportController();
