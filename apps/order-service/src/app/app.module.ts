import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RABBITMQ_CONFIG } from '@shopit/shared';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-yet';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_CONFIG.url],
          queue: RABBITMQ_CONFIG.queues.products,
          queueOptions: RABBITMQ_CONFIG.queueOptions,
        },
      },
    ]),
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
      ttl: 60, // 1 minute default TTL
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
