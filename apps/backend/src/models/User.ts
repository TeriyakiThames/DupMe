import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database';
import { User, CreateUserData, UpdateUserData } from '../types/user';

export class UserModel {
  // create a new user
  static async create(userData: CreateUserData & { password_hash: string }): Promise<number> {
    const { username, password_hash } = userData;
    
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO user (username, password_hash) 
       VALUES (?, ?)`,
      [username, password_hash]
    );
    
    return result.insertId;
  }

  // find user by ID
  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM user WHERE id = ? AND is_active = TRUE',
      [id]
    );
    
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  // find user by username
  static async findByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM user WHERE username = ? AND is_active = TRUE',
      [username]
    );
    
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  // update user
  static async update(id: number, userData: UpdateUserData): Promise<boolean> {
    const allowedFields = ['username', 'win_count', 'loss_count', 'draw_count', 'is_active'];
    const fields = Object.keys(userData).filter(field => allowedFields.includes(field));
    const values = fields.map(field => userData[field as keyof UpdateUserData]);
    
    if (fields.length === 0) return false;
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE user SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    
    return result.affectedRows > 0;
  }

  // soft delete user (set is_active to false)
  static async softDelete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE user SET is_active = FALSE WHERE id = ?',
      [id]
    );
    
    return result.affectedRows > 0;
  }

  // get all users (for admin purposes)
  static async findAll(limit: number = 50, offset: number = 0): Promise<User[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM user WHERE is_active = TRUE LIMIT 100 OFFSET 0`
    );

    return rows as User[];
  }

  // check if username exists
  static async usernameExists(username: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT id FROM user WHERE username = ? AND is_active = TRUE';
    const params: any[] = [username];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.length > 0;
  }

  // atomic increment methods
  static async incrementWinCount(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE user SET win_count = win_count + 1 WHERE id = ? AND is_active = TRUE',
      [id]
    );
    
    return result.affectedRows > 0;
  }

  static async incrementLossCount(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE user SET loss_count = loss_count + 1 WHERE id = ? AND is_active = TRUE',
      [id]
    );
    
    return result.affectedRows > 0;
  }

  static async incrementDrawCount(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE user SET draw_count = draw_count + 1 WHERE id = ? AND is_active = TRUE',
      [id]
    );
    
    return result.affectedRows > 0;
  }
}