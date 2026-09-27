import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { join } from 'path';
import { OrderConfirmationEmailEvent } from './interfaces/email.interface';

const EMAIL_QUEUE_NAME = 'email-delivery';

@Injectable()
export class EmailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailQueueService.name);
  private queue!: Queue<OrderConfirmationEmailEvent>;
  private worker!: Worker<OrderConfirmationEmailEvent, { messageId: string }>;

  async onModuleInit(): Promise<void> {
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
      ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
    };

    this.queue = new Queue<OrderConfirmationEmailEvent>(EMAIL_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });

    this.worker = new Worker<OrderConfirmationEmailEvent, { messageId: string }>(
      EMAIL_QUEUE_NAME,
      join(__dirname, 'email', 'order-confirmation.processor.js'),
      {
        connection,
        useWorkerThreads: true,
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Email job ${job.id} completed for order #${job.data.orderId}`);
    });
    this.worker.on('failed', (job, error) => {
      this.logger.error(`Email job ${job?.id || 'unknown'} failed: ${error.message}`);
    });
    this.worker.on('error', (error) => {
      this.logger.error(`Email worker error: ${error.message}`);
    });

    await Promise.all([this.queue.waitUntilReady(), this.worker.waitUntilReady()]);
    this.logger.log(`BullMQ email worker is ready on Redis ${connection.host}:${connection.port}`);
  }

  async enqueueOrderConfirmation(data: OrderConfirmationEmailEvent): Promise<string> {
    const job = await this.queue.add('order-confirmation', data, {
      jobId: `order-confirmation-${data.orderId}`,
    });
    return String(job.id);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.worker?.close(), this.queue?.close()]);
  }
}