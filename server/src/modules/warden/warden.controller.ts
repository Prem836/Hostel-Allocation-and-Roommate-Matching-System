import { Request, Response, NextFunction } from 'express';
import { WardenService } from './warden.service.js';
import {
  overrideBedAssignmentSchema,
  promoteWaitlistStudentSchema,
  updateDraftStatusSchema,
} from './warden.validation.js';

export class WardenController {
  // M7: Floor Bed Map
  static async getFloorBedMap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { draftId } = req.params;
      const { hostelId, floor } = req.query;

      if (!hostelId || floor === undefined) {
        res.status(400).json({ success: false, message: 'hostelId and floor query parameters are required' });
        return;
      }

      const result = await WardenService.getFloorBedMap(
        draftId,
        hostelId as string,
        parseInt(floor as string, 10)
      );

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // M7: Manual Bed Override with Reason
  static async overrideAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = overrideBedAssignmentSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await WardenService.overrideAssignment(req.user!.userId, parsed, ipAddress);
      res.status(200).json({
        success: true,
        message: 'Bed assignment overridden and logged to audit trail',
        data: result,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }

  // M8: Waitlist Promotion
  static async promoteWaitlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { draftId } = req.params;
      const parsed = promoteWaitlistStudentSchema.parse(req.body);

      const result = await WardenService.promoteNextWaitlistStudent(
        req.body.cycleId,
        draftId,
        parsed.targetBedId,
        req.user!.userId,
        parsed.reason
      );

      res.status(200).json({
        success: true,
        message: 'Student promoted from waitlist to bed in draft',
        data: result,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }

  // M7: Draft Approval Review
  static async reviewDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { draftId } = req.params;
      const parsed = updateDraftStatusSchema.parse(req.body);

      const draft = await WardenService.reviewDraft(draftId, req.user!.userId, parsed);
      res.status(200).json({
        success: true,
        message: `Draft successfully ${parsed.status.toLowerCase()}`,
        data: draft,
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }
}
