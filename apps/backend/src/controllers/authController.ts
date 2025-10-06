import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { CreateUserData, LoginCredentials } from '../types/user';

export class AuthController {
  // register a new user
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserData = req.body;
      const result = await UserService.register(userData);

      if (result.success && result.user) {
        // set up session
        req.session.isAuthenticated = true;
        req.session.user = result.user;

        res.status(201).json({
          success: true,
          message: result.message,
          user: result.user,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Register controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration.',
      });
    }
  }

  // login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const credentials: LoginCredentials = req.body;
      const result = await UserService.login(credentials);

      if (result.success && result.user) {
        // set up session
        req.session.isAuthenticated = true;
        req.session.user = result.user;

        res.status(200).json({
          success: true,
          message: result.message,
          user: result.user,
        });
      } else {
        res.status(401).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login.',
      });
    }
  }

  // logout user
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          res.status(500).json({
            success: false,
            message: 'Failed to logout. Please try again.',
          });
          return;
        }

        // clear the session cookie
        res.clearCookie('connect.sid');
        
        res.status(200).json({
          success: true,
          message: 'Logged out successfully.',
        });
      });
    } catch (error) {
      console.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during logout.',
      });
    }
  }

  // get current user session
  static async me(req: Request, res: Response): Promise<void> {
    try {
      if (req.session?.isAuthenticated && req.session?.user) {
        res.status(200).json({
          success: true,
          message: 'User session retrieved.',
          user: req.session.user,
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Not authenticated.',
        });
      }
    } catch (error) {
      console.error('Me controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  }

  // check authentication status
  static async checkAuth(req: Request, res: Response): Promise<void> {
    try {
      const isAuthenticated = !!(req.session?.isAuthenticated && req.session?.user);
      
      res.status(200).json({
        success: true,
        isAuthenticated,
        user: isAuthenticated ? req.session.user : null,
      });
    } catch (error) {
      console.error('Check auth controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  }

}