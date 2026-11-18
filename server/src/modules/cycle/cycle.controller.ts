import { Request, Response, NextFunction } from 'express';
import { CycleService } from './cycle.service.js';
import { createCycleSchema, updateCycleStatusSchema, applyToCycleSchema } from './cycle.validation.js';

export class CycleController {
  static async createCycle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createCycleSchema.parse(req.body);
      const cycle = await CycleService.createCycle(parsed);
      res.status(201).json({ success: true, data: cycle });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }

  static async getCycles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as any;
      const cycles = await CycleService.getCycles(status);
      res.status(200).json({ success: true, data: cycles });
    } catch (err) {
      next(err);
    }
  }

  static async getCycleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cycle = await CycleService.getCycleById(req.params.id);
      res.status(200).json({ success: true, data: cycle });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateCycleStatusSchema.parse(req.body);
      const cycle = await CycleService.updateCycleStatus(req.params.id, parsed.status);
      res.status(200).json({ success: true, data: cycle });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }

  static async apply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthenticated' });
        return;
      }
      const parsed = applyToCycleSchema.parse(req.body);
      const application = await CycleService.submitApplication(req.params.id, req.user.userId, parsed);
      res.status(201).json({ success: true, data: application });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }

  static async getMyApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthenticated' });
        return;
      }
      const app = await CycleService.getStudentApplication(req.params.id, req.user.userId);
      res.status(200).json({ success: true, data: app });
    } catch (err) {
      next(err);
    }
  }

  static async getApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const applications = await CycleService.getApplicationsForCycle(req.params.id, status);
      res.status(200).json({ success: true, data: applications });
    } catch (err) {
      next(err);
    }
  }
}
