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
  const logger = new Logger('ProductService');

  try {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.RMQ,
      options: {
        urls: [RABBITMQ_CONFIG.url],
        queue: RABBITMQ_CONFIG.queues.products,
        queueOptions: RABBITMQ_CONFIG.queueOptions,
        prefetchCount: RABBITMQ_CONFIG.prefetchCount,
      },
    });

    app.enableShutdownHooks();

    // Set up error handling
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
    });

    await app.listen();
    logger.log(
      `🚀 Product service is listening to queue ${RABBITMQ_CONFIG.queues.products}`
    );
  } catch (error) {
    logger.error('Failed to start product service:', error);
    process.exit(1);
  }
}

bootstrap();
