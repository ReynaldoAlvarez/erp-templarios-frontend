import { PrismaClient } from '@prisma/client';

export class PrismaService {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
      });
    }
    return PrismaService.instance;
  }
}

export default PrismaService;
