/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { RABBITMQ_CONFIG } from '@shopit/shared';

async function bootstrap() {
  const logger = new Logger('OrderService');
  
  try {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.RMQ,
      options: {
        urls: [RABBITMQ_CONFIG.url],
        queue: RABBITMQ_CONFIG.queues.orders,
        queueOptions: {
          ...RABBITMQ_CONFIG.queueOptions,
          durable: true
        },
        prefetchCount: 1,  // Process one message at a time
        noAck: false,      // Require explicit acknowledgment
      }
    });

    app.enableShutdownHooks();

    // Error handling
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
    });

    await app.listen();
    logger.log(`🚀 Order service is listening to queue ${RABBITMQ_CONFIG.queues.orders}`);
  } catch (error) {
    logger.error('Failed to start order service:', error);
    process.exit(1);
  }
}

bootstrap();