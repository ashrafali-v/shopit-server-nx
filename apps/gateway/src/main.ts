/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as csrf from 'csurf';
import { AppModule } from './app/app.module';
import { ValidationPipe } from './app/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Apply security headers with Helmet
  app.use(helmet());
  
  // Enable CORS with specific options
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:4200', // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true, // Required for cookies, authorization headers with HTTPS
    maxAge: 3600 // Maximum age of CORS preflight requests cache (1 hour)
  });

  // // Parse cookies
  // app.use(cookieParser());

  // // Apply CSRF protection
  // app.use(csrf({ 
  //   cookie: {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'strict'
  //   }
  // }));

  // // Middleware to set CSRF token cookie
  // app.use((req, res, next) => {
  //   res.cookie('XSRF-TOKEN', req.csrfToken(), {
  //     httpOnly: false, // Frontend needs to read this
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'strict'
  //   });
  //   next();
  // });
  
  // Apply global validation pipe
  app.useGlobalPipes(new ValidationPipe());
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}`
  );
}

bootstrap();
