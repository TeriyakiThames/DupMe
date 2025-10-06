import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';

const router = Router();

// mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DupMe API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /auth/register': 'Register a new user',
        'POST /auth/login': 'Login user',
        'POST /auth/logout': 'Logout user (requires auth)',
        'GET /auth/me': 'Get current user session (requires auth)',
        'GET /auth/check': 'Check authentication status',
      },
      users: {
        'GET /users/profile': 'Get current user profile (requires auth)',
        'PUT /users/profile': 'Update current user profile (requires auth)',
        'DELETE /users/account': 'Delete current user account (requires auth)',

        'PATCH /users/increment-win': 'Increment win count (requires auth)',
        'PATCH /users/increment-loss': 'Increment loss count (requires auth)',
        'PATCH /users/increment-draw': 'Increment draw count (requires auth)',

        'GET /users/:id': 'Get user by ID',
        'GET /users': 'Get all users',
      },
    },
  });
});

export default router;