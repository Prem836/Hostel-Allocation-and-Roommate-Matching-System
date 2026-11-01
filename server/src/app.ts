import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';

export function createApp(): Application {
  const app = express();

  // Standard Security & Utilities
  app.use(helmet());
  app.use(
    cors({
      origin: ENV.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health and Readiness checks
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'hostel-allocation-api', timestamp: new Date() });
  });

  // Root / API V1 router placeholder
  app.get('/api/v1', (req: Request, res: Response) => {
    res.json({
      message: 'EduRev Hostel Allocation & Roommate Matching API v1',
      version: '1.0.0',
      modules: ['M1-Inventory', 'M2-Cycles', 'M3-Eligibility', 'M4-Preferences', 'M5-Compatibility', 'M6-AllocationEngine', 'M7-WardenReview', 'M8-Waitlist', 'M9-Publication'],
    });
  });

  // Authentication API routes
  app.use('/api/v1/auth', authRoutes);

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Error Handler]', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
      errors: err.errors || undefined,
    });
  });

  return app;
}

