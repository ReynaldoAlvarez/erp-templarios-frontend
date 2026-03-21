import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from './error.middleware';

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Cannot find ${req.method} ${req.originalUrl} on this server`);
  next(error);
};

export default notFoundHandler;
