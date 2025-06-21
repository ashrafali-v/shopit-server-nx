import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'notifications_queue',
      queueOptions: {
        durable: true,
        deadLetterExchange: 'dead_letter_exchange',
        deadLetterRoutingKey: 'dead_letter_queue',
        messageTtl: 60000 // 1 minute
      },
      prefetchCount: 1,
    },
  });

  await app.listen();
  Logger.log('Notification service is listening for email events');
}

bootstrap();
