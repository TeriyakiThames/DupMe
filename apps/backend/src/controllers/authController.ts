import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { CreateUserData, LoginCredentials } from '../types/auth';

export class AuthController {

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserData = req.body;
      const result = await UserService.register(userData);

      if (result.success && result.userProfile) {

        req.session.isAuthenticated = true;
        req.session.userProfile = result.userProfile;

        res.status(201).json({
          success: true,
          message: result.message,
          userProfile: result.userProfile,
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
  
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const credentials: LoginCredentials = req.body;
      const result = await UserService.login(credentials);

      if (result.success && result.userProfile) {
        
        req.session.isAuthenticated = true;
        req.session.userProfile = result.userProfile;

        res.status(200).json({
          success: true,
          message: result.message,
          userProfile: result.userProfile,
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

  
  static async me(req: Request, res: Response): Promise<void> {
    try {
      if (req.session?.isAuthenticated && req.session?.userProfile) {
        res.status(200).json({
          success: true,
          message: 'User session retrieved.',
          userProfile: req.session.userProfile,
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

  
  static async checkAuth(req: Request, res: Response): Promise<void> {
    try {
      const isAuthenticated = !!(req.session?.isAuthenticated && req.session?.userProfile);
      
      res.status(200).json({
        success: true,
        isAuthenticated,
        userProfile: isAuthenticated ? req.session.userProfile : null,
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