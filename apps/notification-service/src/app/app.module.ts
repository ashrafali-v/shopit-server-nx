import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RABBITMQ_CONFIG } from '@shopit/shared';
import { EmailController } from './email/email.controller';
import { EmailService } from './email/email.service';
import * as path from 'path';

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
    MailerModule.forRootAsync({
      useFactory: () => {
        const smtpPort = parseInt(process.env.SMTP_PORT || '1026', 10);
        console.log(`SMTP Configuration: Host=${process.env.SMTP_HOST || 'localhost'}, Port=${smtpPort}`);
        return {
          transport: {
            host: process.env.SMTP_HOST || 'localhost',
            port: smtpPort,
            secure: false,
            // In development with Mailpit, no authentication is needed
            ...(process.env.NODE_ENV === 'production' && {
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            }),
          },
          defaults: {
            from: process.env.SMTP_FROM || 'noreply@shopit.com',
          },
          template: {
            dir: path.join(__dirname, 'email/templates'), // Changed from 'templates' to 'email/templates'
            adapter: new HandlebarsAdapter({
              multiply: (a: string | number, b: string | number) => Number(a) * Number(b)
            }),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService],
})
export class AppModule {}
