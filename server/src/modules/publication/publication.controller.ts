import { Request, Response, NextFunction } from 'express';
import { PublicationService } from './publication.service.js';
import { publishDraftSchema } from './publication.validation.js';

export class PublicationController {
  // M9.1: Transactional Draft Publication
  static async publishDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { draftId } = req.params;
      const parsed = publishDraftSchema.parse(req.body || {});
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await PublicationService.publishDraft(
        draftId,
        req.user!.userId,
        parsed.notes,
        ipAddress
      );

      res.status(200).json({
        success: true,
        message: 'Allocation draft published atomically. Live bed occupancy updated.',
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

  // Student Published Result
  static async getMyResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PublicationService.getStudentResult(req.params.cycleId, req.user!.userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // M9.2: Download PDF Allocation Letter
  static async downloadAllocationLetter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pdfBuffer = await PublicationService.generateAllocationLetterPdf(
        req.params.cycleId,
        req.user!.userId
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="hostel-allocation-letter-${req.params.cycleId}.pdf"`
      );
      res.status(200).send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  // M9.3: Student Notifications
  static async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await PublicationService.getUserNotifications(req.user!.userId);
      res.status(200).json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  }

  // M9.4: Occupancy Heatmap Analytics
  static async getOccupancyHeatmap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const heatmap = await PublicationService.getOccupancyHeatmap();
      res.status(200).json({ success: true, data: heatmap });
    } catch (err) {
      next(err);
    }
  }

  // M9.5: Preference Satisfaction & Override Analytics
  static async getCycleAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await PublicationService.getCycleAnalytics(req.params.cycleId);
      res.status(200).json({ success: true, data: analytics });
    } catch (err) {
      next(err);
    }
  }
}
