import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { UpdateUserData } from '../types/user';

export class UserController {
  // get current user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const result = await UserService.getUserById(req.user.id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          user: result.user,
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
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const updateData: UpdateUserData = req.body;

      const result = await UserService.updateUser(req.user.id, updateData);

      if (result.success) {
        // Update session with new user data
        if (req.session && result.user) {
          req.session.user = { id: result.user.id };
        }

        res.status(200).json({
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
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const result = await UserService.deleteUser(req.user.id);

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

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID.',
        });
        return;
      }

      const result = await UserService.getUserById(userId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          user: result.user,
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
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

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
          users: result.users,
          pagination: {
            limit,
            offset,
            count: result.users?.length || 0,
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

  // no admin middleware yet

  // update user by ID (admin function)
  // static async updateUser(req: Request, res: Response): Promise<void> {
  //   try {
  //     const userId = parseInt(req.params.id);

  //     if (isNaN(userId)) {
  //       res.status(400).json({
  //         success: false,
  //         message: 'Invalid user ID.',
  //       });
  //       return;
  //     }

  //     const updateData: UpdateUserData = req.body;
  //     const result = await UserService.updateUser(userId, updateData);

  //     if (result.success) {
  //       res.status(200).json({
  //         success: true,
  //         message: result.message,
  //         user: result.user,
  //       });
  //     } else {
  //       res.status(400).json({
  //         success: false,
  //         message: result.message,
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Update user controller error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Internal server error.',
  //     });
  //   }
  // }

  // delete user by ID (admin function)
  // static async deleteUser(req: Request, res: Response): Promise<void> {
  //   try {
  //     const userId = parseInt(req.params.id);

  //     if (isNaN(userId)) {
  //       res.status(400).json({
  //         success: false,
  //         message: 'Invalid user ID.',
  //       });
  //       return;
  //     }

  //     const result = await UserService.deleteUser(userId);

  //     if (result.success) {
  //       res.status(200).json({
  //         success: true,
  //         message: result.message,
  //       });
  //     } else {
  //       res.status(404).json({
  //         success: false,
  //         message: result.message,
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Delete user controller error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Internal server error.',
  //     });
  //   }
  // }

  // increment win count for current user
  static async incrementWin(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const result = await UserService.incrementWin(req.user.id);

      if (result.success) {
        res.status(200).json({
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
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const result = await UserService.incrementLoss(req.user.id);

      if (result.success) {
        res.status(200).json({
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
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const result = await UserService.incrementDraw(req.user.id);

      if (result.success) {
        res.status(200).json({
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
      console.error('Increment draw controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  }

}