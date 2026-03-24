import 'dotenv/config';
import app from './app';
import { config } from './core/config';
import { PrismaService } from './core/database/prisma.service';
import { RedisService } from './core/database/redis.service';

const PORT = config.port;

async function startServer() {
  try {
    // Initialize database connection
    const prisma = PrismaService.getInstance();
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Initialize Redis connection
    const redis = RedisService.getInstance();
    await redis.connect();
    console.log('✅ Redis connected successfully');

    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log(`🚀 ${config.app.name} API Server`);
      console.log('='.repeat(50));
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Port: ${PORT}`);
      console.log(`API Prefix: ${config.apiPrefix}`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  const prisma = PrismaService.getInstance();
  const redis = RedisService.getInstance();
  await prisma.$disconnect();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  const prisma = PrismaService.getInstance();
  const redis = RedisService.getInstance();
  await prisma.$disconnect();
  await redis.disconnect();
  process.exit(0);
});

startServer();
