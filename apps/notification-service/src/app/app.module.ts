import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RABBITMQ_CONFIG } from '@shopit/shared';
import { EmailController } from './email/email.controller';
import { EmailQueueService } from './email/email-queue.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    // Add connection retry strategy
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_CONFIG.url],
          queue: RABBITMQ_CONFIG.queues.notifications,
          queueOptions: {
            ...RABBITMQ_CONFIG.queueOptions,
            noAck: false,
          },
          prefetchCount: RABBITMQ_CONFIG.prefetchCount,
          socketOptions: {
            heartbeatIntervalInSeconds: 60,
            reconnectTimeInSeconds: 5,
          },
        },
      },
    ]),
  ],
  controllers: [EmailController],
  providers: [EmailQueueService],
})
export class AppModule {}
