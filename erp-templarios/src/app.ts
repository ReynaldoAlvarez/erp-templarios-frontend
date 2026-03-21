import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './core/config';

// Import routes
import authRoutes from './modules/auth';
import userRoutes from './modules/users';
import roleRoutes from './modules/roles';
import permissionRoutes from './modules/permissions';
import clientRoutes from './modules/clients';
import blRoutes from './modules/bl';
import fleetRoutes from './modules/fleet';
import driverRoutes from './modules/drivers';
import expenseRoutes from './modules/expenses';

// Import middleware
import { errorHandler } from './core/middleware/error.middleware';
import { notFoundHandler } from './core/middleware/not-found.middleware';

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.cors.origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
const apiPrefix = config.apiPrefix;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/roles`, roleRoutes);
app.use(`${apiPrefix}/permissions`, permissionRoutes);
app.use(`${apiPrefix}/clients`, clientRoutes);
app.use(`${apiPrefix}/bl`, blRoutes);
app.use(`${apiPrefix}/fleet`, fleetRoutes);
app.use(`${apiPrefix}/drivers`, driverRoutes);
app.use(`${apiPrefix}/expenses`, expenseRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
