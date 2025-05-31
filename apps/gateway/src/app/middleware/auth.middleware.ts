import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Skip authentication for public endpoints
    if (this.isPublicRoute(req.path)) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, this.JWT_SECRET) as JwtPayload;
      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private isPublicRoute(path: string): boolean {
    const publicRoutes = [
      '/',                // API info
      '/users/login',     // Login
      '/users/register',  // Register
      '/products',        // Public product listing
      /^\/products\/\d+$/ // Individual product details
    ];

    return publicRoutes.some(route => {
      if (route instanceof RegExp) {
        return route.test(path);
      }
      return route === path;
    });
  }
}