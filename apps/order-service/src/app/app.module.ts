import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as redisStore from 'cache-manager-redis-yet';
import { PrismaService } from '@shopit/shared';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
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
        },
      },
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'products_queue',
          queueOptions: {
            durable: true,
            deadLetterExchange: 'dead_letter_exchange',
            deadLetterRoutingKey: 'dead_letter_queue',
            messageTtl: 60000 // 1 minute
          },
        },
      },
    ]),
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ttl: 60, // 1 minute default TTL
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
