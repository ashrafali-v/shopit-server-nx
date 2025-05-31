import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      statusCode: 429
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Skip rate limiting for whitelisted IPs or internal requests
    if (this.isWhitelisted(req)) {
      return next();
    }

    this.limiter(req, res, next);
  }

  private isWhitelisted(req: Request): boolean {
    const whitelistedIPs = ['127.0.0.1', 'localhost'];
    const clientIP = req.ip || req.socket.remoteAddress;
    return whitelistedIPs.includes(clientIP);
  }
}