import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AllocationEngineService } from './allocation.service.js';
import { allocationQueue } from '../../workers/allocationWorker.js';

const triggerAllocationSchema = z.object({
  seed: z.number().int().optional(),
  runAsync: z.boolean().optional().default(false),
});

export class AllocationController {
  /**
   * Triggers the allocation engine either synchronously (direct inspection/test)
   * or asynchronously via BullMQ worker queue.
   */
  static async triggerAllocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cycleId } = req.params;
      const parsed = triggerAllocationSchema.parse(req.body || {});

      if (parsed.runAsync) {
        // Enqueue background BullMQ job
        const job = await allocationQueue.add(`allocation-cycle-${cycleId}`, {
          cycleId,
          seed: parsed.seed,
          triggeredByUserId: req.user!.userId,
        });

        res.status(202).json({
          success: true,
          message: 'Allocation job enqueued in background worker',
          data: { jobId: job.id, cycleId },
        });
        return;
      }

      // Synchronous execution
      const result = await AllocationEngineService.runAllocation(cycleId, parsed.seed);
      res.status(200).json({
        success: true,
        message: 'Draft allocation generated successfully',
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

  static async getDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const details = await AllocationEngineService.getDraftDetails(req.params.draftId);
      res.status(200).json({ success: true, data: details });
    } catch (err) {
      next(err);
    }
  }
}
