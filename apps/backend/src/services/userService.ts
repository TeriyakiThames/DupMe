import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user';
import { User, CreateUserData, UpdateUserData, LoginCredentials,  UserProfile } from '../types/auth';

export class UserService {
  private static readonly SALT_ROUNDS = 12;

  // hash password
  private static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, UserService.SALT_ROUNDS);
  }

  // verify password
  private static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private static toUserProfile(userProfile: User): UserProfile {
    return {
      id: userProfile.id,
      username: userProfile.username,
      win_count: userProfile.win_count,
      loss_count: userProfile.loss_count,
      draw_count: userProfile.draw_count,
      is_active: userProfile.is_active
    }
  }

  // register a new user
  static async register(userData: CreateUserData): Promise<{ success: boolean; message: string; userProfile?: UserProfile }> {
    try {
      // validate input
      if (!userData.username || !userData.password) {
        return { success: false, message: 'Username and password are required.' };
      }

      // check password strength
      if (userData.password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long.' };
      }

      // check if username already exists
      if (await UserModel.usernameExists(userData.username)) {
        return { success: false, message: 'Username already taken.' };
      }

      // hash password
      const password_hash = await UserService.hashPassword(userData.password);

      // create user
      const userId = await UserModel.create({
        ...userData,
        password_hash,
      });

      // get created user
      const user = await UserModel.findById(userId);
      if (!user) {
        return { success: false, message: 'Failed to create user.' };
      }

      return {
        success: true,
        message: 'User registered successfully.',
        userProfile: UserService.toUserProfile(user),
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'An error occurred during registration.' };
    }
  }

  // login user
  static async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; userProfile?: UserProfile }> {
    try {
      // validate input
      if (!credentials.username || !credentials.password) {
        return { success: false, message: 'Username and password are required.' };
      }

      // find user by username
      const user = await UserModel.findByUsername(credentials.username);
      if (!user) {
        return { success: false, message: 'Invalid credentials.' };
      }

      // verify password
      const isValidPassword = await UserService.verifyPassword(credentials.password, user.password_hash);
      if (!isValidPassword) {
        return { success: false, message: 'Invalid credentials.' };
      }

      return {
        success: true,
        message: 'Login successful.',
        userProfile: UserService.toUserProfile(user),
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login.' };
    }
  }

  // get user by ID
  static async getUserById(id: number): Promise<{ success: boolean; message: string; userProfile?: UserProfile }> {
    try {
      const user = await UserModel.findById(id);
      if (!user) {
        return { success: false, message: 'User not found.' };
      }

      return {
        success: true,
        message: 'User found.',
        userProfile: UserService.toUserProfile(user),
      };
    } catch (error) {
      console.error('Get user error:', error);
      return { success: false, message: 'An error occurred while fetching user.' };
    }
  }

  // update user
  static async updateUser(id: number, updateData: UpdateUserData): Promise<{ success: boolean; message: string; userProfile?: UserProfile }> {
    try {
      // check if username is unique (if being updated)
      if (updateData.username && await UserModel.usernameExists(updateData.username, id)) {
        return { success: false, message: 'Username already taken.' };
      }

      // update user
      const updated = await UserModel.update(id, updateData);
      if (!updated) {
        return { success: false, message: 'User not found or no changes made.' };
      }

      // get updated user
      const user = await UserModel.findById(id);
      if (!user) {
        return { success: false, message: 'Failed to fetch updated user.' };
      }

      return {
        success: true,
        message: 'User updated successfully.',
        userProfile: UserService.toUserProfile(user),
      };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, message: 'An error occurred while updating user.' };
    }
  }

  // delete user (soft delete)
  static async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const deleted = await UserModel.softDelete(id);
      if (!deleted) {
        return { success: false, message: 'User not found.' };
      }

      return { success: true, message: 'User deleted successfully.' };
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, message: 'An error occurred while deleting user.' };
    }
  }

  // get all users (admin function)
  static async getAllUsers(limit: number = 50, offset: number = 0): Promise<{ success: boolean; message: string; userProfiles?: UserProfile[] }> {
    try {
      const users = await UserModel.findAll(limit, offset);
      const userProfiles = users.map(user => UserService.toUserProfile(user));

      return {
        success: true,
        message: 'Users fetched successfully.',
        userProfiles: userProfiles,
      };
    } catch (error) {
      console.error('Get all users error:', error);
      return { success: false, message: 'An error occurred while fetching users.' };
    }
  }

  // atomic increment methods
  static async incrementWin(userId: number): Promise<{ success: boolean; message: string; userProfile?: UserProfile }> {
    try {
      const updated = await UserModel.incrementWinCount(userId);
      
      if (!updated) {
        return { success: false, message: 'User not found or inactive.' };
      }

      // Fetch updated user data
      const user = await UserModel.findById(userId);
      if (!user) {
        return { success: false, message: 'User not found after update.' };
      }

      return {
        success: true,
        message: 'Win count incremented successfully.',
        userProfile: UserService.toUserProfile(user),
      };
    } catch (error) {
      console.error('Increment win error:', error);
      return { success: false, message: 'An error occurred while incrementing win count.' };
    }
  }

  static async incrementLoss(userId: number): Promise<{ success: boolean; message: string; userProfile?: UserProfile }> {
    try {
      const updated = await UserModel.incrementLossCount(userId);
      
      if (!updated) {
        return { success: false, message: 'User not found or inactive.' };
      }

      // fetch updated user data
      const user = await UserModel.findById(userId);
      if (!user) {
        return { success: false, message: 'User not found after update.' };
      }

      return {
        success: true,
        message: 'Loss count incremented successfully.',
        userProfile: UserService.toUserProfile(user),
      };
    } catch (error) {
      console.error('Increment loss error:', error);
      return { success: false, message: 'An error occurred while incrementing loss count.' };
    }
  }

  static async incrementDraw(userId: number): Promise<{ success: boolean; message: string; userProfile?: UserProfile }> {
    try {
      const updated = await UserModel.incrementDrawCount(userId);
      
      if (!updated) {
        return { success: false, message: 'User not found or inactive.' };
      }

      // fetch updated user data
      const user = await UserModel.findById(userId);
      if (!user) {
        return { success: false, message: 'User not found after update.' };
      }

      return {
        success: true,
        message: 'Draw count incremented successfully.',
        userProfile: UserService.toUserProfile(user),
      };
    } catch (error) {
      console.error('Increment draw error:', error);
      return { success: false, message: 'An error occurred while incrementing draw count.' };
    }
  }
}
 
