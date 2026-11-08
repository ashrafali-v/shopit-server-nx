import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import * as redisStore from 'cache-manager-redis-yet';
import { PrismaService, RABBITMQ_CONFIG } from '@shopit/shared';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_CONFIG.url],
          queue: 'notifications_queue', // Changed from orders queue to avoid declaration conflicts
          queueOptions: RABBITMQ_CONFIG.queueOptions,
          prefetchCount: RABBITMQ_CONFIG.prefetchCount,
        }
      },
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_CONFIG.url],
          queue: RABBITMQ_CONFIG.queues.products,
          queueOptions: RABBITMQ_CONFIG.queueOptions,
          prefetchCount: RABBITMQ_CONFIG.prefetchCount,
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
  providers: [AppService, PrismaService, ReportsService]
})
export class AppModule {}