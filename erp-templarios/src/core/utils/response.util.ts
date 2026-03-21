import { Response } from 'express';

interface SuccessResponseOptions<T> {
  res: Response;
  data: T;
  message?: string;
  statusCode?: number;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  meta?: SuccessResponseOptions<T>['meta']
): void => {
  const response: {
    success: boolean;
    message: string;
    data: T;
    meta?: typeof meta;
    timestamp: string;
  } = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (meta) {
    response.meta = meta;
  }

  res.status(statusCode).json(response);
};

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = 'Success'
): void => {
  const totalPages = Math.ceil(total / limit);

  successResponse(res, data, message, 200, {
    page,
    limit,
    total,
    totalPages,
  });
};

export const createdResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): void => {
  successResponse(res, data, message, 201);
};

export const noContentResponse = (
  res: Response
): void => {
  res.status(204).send();
};

export default {
  successResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
};
