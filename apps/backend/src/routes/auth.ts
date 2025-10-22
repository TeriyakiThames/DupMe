import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { requireAuth, requireNoAuth, validateSession } from '../middleware/auth';

const router = Router();

// apply session validation to all auth routes
router.use(validateSession);

// public routes (no authentication required)
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/check', AuthController.checkAuth);

// protected routes (authentication required)
router.post('/logout', requireAuth, AuthController.logout);
router.get('/me', requireAuth, AuthController.me);

export default router;