import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { ENV } from '../../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerSchema.parse(req.body);
      const { user, token } = await AuthService.register(parsed);

      res.cookie('accessToken', token, COOKIE_OPTIONS);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: { user, token },
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
        return;
      }
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.parse(req.body);
      const { user, token } = await AuthService.login(parsed);

      res.cookie('accessToken', token, COOKIE_OPTIONS);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { user, token },
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
        return;
      }
      next(err);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('accessToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthenticated' });
        return;
      }
      const user = await AuthService.getProfile(req.user.userId);
      res.status(200).json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  }
}
