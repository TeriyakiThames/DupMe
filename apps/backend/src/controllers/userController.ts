import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { UpdateUserData } from '../types/auth';

export class UserController {
  // get current user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const id = req.session.userProfile?.id as number;
      const result = await UserService.getUserById(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          userProfile: result.userProfile,
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Get profile controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  }
  
  // update user profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const id = req.session.userProfile?.id as number;
      const updateData: UpdateUserData = req.body;
      const result = await UserService.updateUser(id, updateData);

      if (result.success) {
        // Update session with new user data
        if (req.session && result.userProfile) {
          
          req.session.userProfile = { id: result.userProfile.id,
                              username: result.userProfile.username,
                              win_count: result.userProfile.win_count,
                              loss_count: result.userProfile.loss_count,
                              draw_count: result.userProfile.draw_count,
                              is_active: result.userProfile.is_active
           };
        }

        res.status(200).json({
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
      console.error('Update profile controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  }

  // delete current user account
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const id = req.session.userProfile?.id as number;
      const result = await UserService.deleteUser(id);

      if (result.success) {
        // Destroy session after account deletion
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destruction error after account deletion:', err);
          }
          res.clearCookie('connect.sid');
          
          res.status(200).json({
            success: true,
            message: result.message,
          });
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Delete account controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  }

  // get user by ID 
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const result = await UserService.getUserById(userId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          userProfile: result.userProfile,
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Get user by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  }

  // get all users 
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      let limit = parseInt(req.query.limit as string);
      let offset = parseInt(req.query.offset as string);
      if (Number.isNaN(limit)) limit = 50;
      if (Number.isNaN(offset)) offset = 0;

      if (limit > 100) {
        res.status(400).json({
          success: false,
          message: 'Limit cannot exceed 100.',
        });
        return;
      }

      const result = await UserService.getAllUsers(limit, offset);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          userProfiles: result.userProfiles,
          pagination: {
            limit,
            offset,
            count: result.userProfiles?.length || 0,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Get all users controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  }


  // increment win count for current user
  static async incrementWin(req: Request, res: Response): Promise<void> {
    try {
      const id = req.session.userProfile?.id as number;
      const result = await UserService.incrementWin(id);

      if (result.success) {
        res.status(200).json({
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
      console.error('Increment win controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  }

  // increment loss count for current user
  static async incrementLoss(req: Request, res: Response): Promise<void> {
    try {
      const id = req.session.userProfile?.id as number;
      const result = await UserService.incrementLoss(id);

      if (result.success) {
        res.status(200).json({
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
      console.error('Increment loss controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  }

    // increment draw count for current user
  static async incrementDraw(req: Request, res: Response): Promise<void> {
    try {
      const id = req.session.userProfile?.id as number;
      const result = await UserService.incrementDraw(id);

      if (result.success) {
        res.status(200).json({
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
      console.error('Increment draw controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  }

}