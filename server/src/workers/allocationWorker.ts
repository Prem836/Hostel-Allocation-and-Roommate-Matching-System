import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { AllocationEngineService, AllocationRunResult } from '../modules/allocation/allocation.service.js';

export const ALLOCATION_QUEUE_NAME = 'allocation-runs';

export interface AllocationJobData {
  cycleId: string;
  seed?: number;
  triggeredByUserId: string;
}

// 1. Queue Producer
export const allocationQueue = new Queue<AllocationJobData>(ALLOCATION_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

// 2. Background Worker Consumer
export function startAllocationWorker(): Worker<AllocationJobData> {
  const worker = new Worker<AllocationJobData>(
    ALLOCATION_QUEUE_NAME,
    async (job: Job<AllocationJobData>) => {
      console.log(`[BullMQ Worker] Starting allocation job ${job.id} for cycle ${job.data.cycleId}...`);
      await job.updateProgress(10);

      const result: AllocationRunResult = await AllocationEngineService.runAllocation(
        job.data.cycleId,
        job.data.seed
      );

      await job.updateProgress(100);
      console.log(
        `[BullMQ Worker] Allocation job ${job.id} completed. Assigned: ${result.assignedCount}, Waitlisted: ${result.waitlistedCount}`
      );

      return {
        draftId: result.draft._id,
        assignedCount: result.assignedCount,
        waitlistedCount: result.waitlistedCount,
      };
    },
    {
      connection: redisConnection,
      concurrency: 1, // Ensure allocation runs sequentially to prevent conflicting draft generations
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ Worker] Job ${job?.id} failed with error:`, err);
  });

  return worker;
}
