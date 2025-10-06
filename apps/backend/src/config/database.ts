import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dupme_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// create connection pool
export const pool = mysql.createPool(dbConfig);

// test connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// initialize database schema
export const initializeDatabase = async (): Promise<void> => {
  try {
    // create user table if does not exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        win_count INT DEFAULT 0,
        loss_count INT DEFAULT 0,
        draw_count INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE
      ) 
    `);


    console.log('Database schema initialized');
  } catch (error) {
    console.error('Database schema initialization failed:', error);
    throw error;
  }
};

export default pool;