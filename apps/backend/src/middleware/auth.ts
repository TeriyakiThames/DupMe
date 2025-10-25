import { Request, Response, NextFunction } from 'express';



export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session?.isAuthenticated && req.session?.userProfile) {
    next();
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required. Please log in.' 
    });
  }
};

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


export const validateSession = (req: Request, res: Response, next: NextFunction): void => {
  // check if session exists and has valid structure
  if (req.session?.isAuthenticated) {
    if (!req.session.userProfile || typeof req.session.userProfile.id !== 'number') {
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


export const requireOwnership = (req: Request, res: Response, next: NextFunction): void => {
  const userId = parseInt(req.params.id);
  
  if (!req.session.userProfile) {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
    return;
  }

  if (req.session.userProfile.id !== userId) {
    res.status(403).json({ 
      success: false, 
      message: 'Forbidden. You can only access your own resources.' 
    });
    return;
  }

  next();
};
