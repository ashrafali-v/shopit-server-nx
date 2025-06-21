import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as redisStore from 'cache-manager-redis-yet';
import { PrismaService, RABBITMQ_CONFIG } from '@shopit/shared';
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
          urls: [RABBITMQ_CONFIG.url],
          queue: RABBITMQ_CONFIG.queues.orders,
          queueOptions: RABBITMQ_CONFIG.queueOptions,
          noAck: RABBITMQ_CONFIG.noAck,
          prefetchCount: RABBITMQ_CONFIG.prefetchCount,
          socketOptions: RABBITMQ_CONFIG.socketOptions
        }
      },
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_CONFIG.url],
          queue: RABBITMQ_CONFIG.queues.products,
          queueOptions: RABBITMQ_CONFIG.queueOptions,
          noAck: RABBITMQ_CONFIG.noAck,
          prefetchCount: RABBITMQ_CONFIG.prefetchCount,
          socketOptions: RABBITMQ_CONFIG.socketOptions
        }
      }
    ]),
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ttl: 60 // 1 minute default TTL
    })
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService]
})
export class AppModule {}