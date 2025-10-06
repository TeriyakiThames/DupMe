import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { requireAuth, requireOwnership, validateSession } from '../middleware/auth';

const router = Router();

// apply session validation to all user routes
router.use(validateSession);

// protected routes - user profile management
router.get('/profile', requireAuth, UserController.getProfile);
router.put('/profile', requireAuth, UserController.updateProfile);
router.delete('/account', requireAuth, UserController.deleteAccount);

// game statistics routes
router.patch('/increment-win', requireAuth, UserController.incrementWin);
router.patch('/increment-loss', requireAuth, UserController.incrementLoss);
router.patch('/increment-draw', requireAuth, UserController.incrementDraw);

// public routes - get user by ID (public profiles)
router.get('/:id', UserController.getUserById);
router.get('/', requireAuth, UserController.getAllUsers);

export default router;