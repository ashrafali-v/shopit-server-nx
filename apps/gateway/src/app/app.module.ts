import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { RABBITMQ_CONFIG } from '@shopit/shared';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMiddleware } from './middleware/auth.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make config available everywhere
      envFilePath: '.env',
    }),
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
      {
        name: 'ORDER_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_CONFIG.url],
          queue: RABBITMQ_CONFIG.queues.orders,
          queueOptions: RABBITMQ_CONFIG.queueOptions,
        },
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_CONFIG.url],
          queue: RABBITMQ_CONFIG.queues.users,
          queueOptions: RABBITMQ_CONFIG.queueOptions,
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, RateLimitMiddleware)
      .forRoutes('*'); // Apply logging and rate limiting to all routes
      
    // Uncomment to enable authentication
    // consumer
    //   .apply(AuthMiddleware)
    //   .exclude(
    //     { path: '/', method: RequestMethod.GET }, // API info
    //     { path: '/users/login', method: RequestMethod.POST },
    //     { path: '/users/register', method: RequestMethod.POST },
    //     { path: '/products', method: RequestMethod.GET },
    //     { path: '/products/:id', method: RequestMethod.GET }
    //   )
    //   .forRoutes('*');
  }
}
