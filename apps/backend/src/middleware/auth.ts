import { Request, Response, NextFunction } from 'express';
import { UserSession } from '../types/user';

// extend express request type to include user session
declare global {
  namespace Express {
    interface Request {
      user?: UserSession;
    }
  }
}

// check if user is authenticated
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session?.isAuthenticated && req.session?.user) {
    req.user = req.session.user;
    next();
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required. Please log in.' 
    });
  }
};

// check if user is NOT authenticated (for login/register routes)
export const requireNoAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session?.isAuthenticated) {
    res.status(409).json({ 
      success: false, 
      message: 'Already authenticated. Please log out first.' 
    });
  } else {
    next();
  }
};

// optionally check authentication (user might or might not be logged in)
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session?.isAuthenticated && req.session?.user) {
    req.user = req.session.user;
  }
  next();
};

// validate session data
export const validateSession = (req: Request, res: Response, next: NextFunction): void => {
  // check if session exists and has valid structure
  if (req.session?.isAuthenticated) {
    if (!req.session.user || typeof req.session.user.id !== 'number') {
      // invalid session data, clear it
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
        res.status(401).json({ 
          success: false, 
          message: 'Invalid session. Please log in again.' 
        });
      });
      return;
    }
  }
  next();
};

// check if user owns the resource (for user-specific operations)
export const requireOwnership = (req: Request, res: Response, next: NextFunction): void => {
  const userId = parseInt(req.params.userId || req.params.id);
  
  if (!req.user) {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
    return;
  }

  if (req.user.id !== userId) {
    res.status(403).json({ 
      success: false, 
      message: 'Forbidden. You can only access your own resources.' 
    });
    return;
  }

  next();
};
