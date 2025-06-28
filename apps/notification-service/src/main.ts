import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RABBITMQ_CONFIG } from '@shopit/shared';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [RABBITMQ_CONFIG.url],
      queue: RABBITMQ_CONFIG.queues.notifications,
      noAck: false,
      prefetchCount: RABBITMQ_CONFIG.prefetchCount,
      queueOptions: {
        ...RABBITMQ_CONFIG.queueOptions,
        arguments: {
          'x-dead-letter-exchange': 'dead_letter_exchange',
          'x-dead-letter-routing-key': 'dead_letter_queue'
        }
      },
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5
      }
    },
  });

  await app.listen();
  Logger.log('Notification service is listening for email events');
}

bootstrap();
